import crypto from 'crypto';
import path from 'path';
import { ApiError } from '../../utils/ApiError.js';
import { redisClient } from '../../config/redis.js';
import { cloudinary, hasCloudinaryConfig } from '../../config/cloudinary.js';
import { emitNotification } from '../../config/socket.js';
import { ReportModel } from './report.model.js';

const LIST_CACHE_TTL_SECONDS = 45;

const listCacheKey = ({ role, userId, query }) => `reports:list:${role}:${userId}:${JSON.stringify(query)}`;
const registryKey = (scope, id = 'all') => `reports:list-registry:${scope}:${id}`;

const safeGet = async (key) => {
  try {
    return await redisClient.get(key);
  } catch (_error) {
    return null;
  }
};

const safeSet = async (key, value, ttl) => {
  try {
    await redisClient.set(key, value, 'EX', ttl);
  } catch (_error) {}
};

const safeSAdd = async (key, members) => {
  try {
    if (!members.length) return;
    await redisClient.sadd(key, ...members);
  } catch (_error) {}
};

const safeSMembers = async (key) => {
  try {
    return await redisClient.smembers(key);
  } catch (_error) {
    return [];
  }
};

const safeDel = async (keys) => {
  try {
    if (!keys.length) return;
    await redisClient.del(keys);
  } catch (_error) {}
};

class ReportService {
  async uploadToCloudinary(file, reportId) {
    if (!hasCloudinaryConfig) {
      throw new ApiError('Cloudinary is not configured. Please set Cloudinary environment variables.', 500);
    }

    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'hms/reports',
          resource_type: 'auto',
          public_id: reportId,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

      stream.end(file.buffer);
    });
  }

  resolveUploadContext(auth, payload) {
    if (auth.role === 'admin') {
      if (!payload.patientId) {
        throw new ApiError('patientId is required for admin uploads', 400);
      }
      return {
        patientId: payload.patientId,
        doctorId: payload.doctorId || null,
      };
    }

    if (auth.role === 'doctor') {
      if (!payload.patientId) {
        throw new ApiError('patientId is required for doctor uploads', 400);
      }

      if (payload.doctorId && String(payload.doctorId) !== String(auth.userId)) {
        throw new ApiError('Doctors can only upload reports under their own identity', 403);
      }

      return {
        patientId: payload.patientId,
        doctorId: auth.userId,
      };
    }

    if (payload.patientId && String(payload.patientId) !== String(auth.userId)) {
      throw new ApiError('Patients can only upload their own reports', 403);
    }

    return {
      patientId: auth.userId,
      doctorId: payload.doctorId || null,
    };
  }

  canAccess(auth, report) {
    if (auth.role === 'admin') return true;
    if (auth.role === 'doctor' && report.doctorId && String(report.doctorId) === String(auth.userId)) return true;
    if (auth.role === 'patient' && String(report.patientId) === String(auth.userId)) return true;
    return false;
  }

  async upload({ auth, payload, file }) {
    if (!file) {
      throw new ApiError('Report file is required', 400);
    }

    const context = this.resolveUploadContext(auth, payload);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `report-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${fileExtension}`;
    const uploaded = await this.uploadToCloudinary(file, fileName);

    const created = await ReportModel.create({
      patientId: context.patientId,
      doctorId: context.doctorId,
      appointmentId: payload.appointmentId || null,
      title: payload.title,
      reportType: payload.reportType,
      fileName,
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: auth.userId,
    });

    await this.invalidateListCaches({
      patientId: String(created.patientId),
      doctorId: created.doctorId ? String(created.doctorId) : null,
    });

    emitNotification({
      userIds: [String(created.patientId), created.doctorId ? String(created.doctorId) : null],
      notification: {
        type: 'report-uploaded',
        title: 'New report uploaded',
        message: `${created.title} is now available for review.`,
        reportId: created.reportId,
        fileUrl: created.fileUrl,
        createdAt: created.createdAt,
      },
    });

    return {
      report: {
        reportId: created.reportId,
        patientId: created.patientId,
        doctorId: created.doctorId,
        appointmentId: created.appointmentId,
        title: created.title,
        reportType: created.reportType,
        fileUrl: created.fileUrl,
        originalName: created.originalName,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        createdAt: created.createdAt,
      },
    };
  }

  async list({ auth, query }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.reportType) {
      filter.reportType = query.reportType;
    }

    if (auth.role === 'patient') {
      filter.patientId = auth.userId;
    } else if (auth.role === 'doctor') {
      filter.doctorId = auth.userId;
      if (query.patientId) filter.patientId = query.patientId;
    } else {
      if (query.patientId) filter.patientId = query.patientId;
      if (query.doctorId) filter.doctorId = query.doctorId;
    }

    const cacheKey = listCacheKey({
      role: auth.role,
      userId: auth.userId,
      query: { ...query, page, limit },
    });

    const cached = await safeGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [items, total] = await Promise.all([
      ReportModel.find(filter)
        .select('reportId patientId doctorId appointmentId title reportType fileUrl originalName mimeType sizeBytes createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportModel.countDocuments(filter),
    ]);

    const result = {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await safeSet(cacheKey, JSON.stringify(result), LIST_CACHE_TTL_SECONDS);
    await this.registerListCacheKey({
      cacheKey,
      role: auth.role,
      doctorId: auth.role === 'doctor' ? auth.userId : query.doctorId,
      patientId: auth.role === 'patient' ? auth.userId : query.patientId,
    });

    return result;
  }

  async getForDownload({ auth, reportId }) {
    const report = await ReportModel.findOne({ reportId })
      .select('reportId patientId doctorId fileName fileUrl filePublicId originalName mimeType')
      .lean();

    if (!report) {
      throw new ApiError('Report not found', 404);
    }

    if (!this.canAccess(auth, report)) {
      throw new ApiError('Forbidden: cannot access this report', 403);
    }

    return report;
  }

  async registerListCacheKey({ cacheKey, role, doctorId, patientId }) {
    const keys = [registryKey('admin')];

    if (role === 'doctor' && doctorId) keys.push(registryKey('doctor', doctorId));
    if (role === 'patient' && patientId) keys.push(registryKey('patient', patientId));

    if (role === 'admin') {
      if (doctorId) keys.push(registryKey('doctor', doctorId));
      if (patientId) keys.push(registryKey('patient', patientId));
    }

    await Promise.all(keys.map((key) => safeSAdd(key, [cacheKey])));
  }

  async invalidateListCaches({ patientId, doctorId }) {
    const [adminKeys, doctorKeys, patientKeys] = await Promise.all([
      safeSMembers(registryKey('admin')),
      doctorId ? safeSMembers(registryKey('doctor', doctorId)) : Promise.resolve([]),
      patientId ? safeSMembers(registryKey('patient', patientId)) : Promise.resolve([]),
    ]);

    await safeDel(Array.from(new Set([...adminKeys, ...doctorKeys, ...patientKeys])));
  }
}

export const reportService = new ReportService();
