import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { ApiError } from '../../utils/ApiError.js';
import { redisClient } from '../../config/redis.js';
import { AppointmentModel } from '../appointments/appointment.model.js';
import { PrescriptionModel } from './prescription.model.js';

const LIST_CACHE_TTL_SECONDS = 45;

const listCacheKey = ({ role, userId, query }) => {
  return `prescriptions:list:${role}:${userId}:${JSON.stringify(query)}`;
};

const registryKey = (scope, id = 'all') => `prescriptions:list-registry:${scope}:${id}`;

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

class PrescriptionService {
  assertCreatePermission(auth, payload) {
    if (auth.role === 'admin') return;

    if (auth.role === 'doctor' && String(payload.doctorId) === String(auth.userId)) {
      return;
    }

    throw new ApiError('Forbidden: insufficient permissions', 403);
  }

  async create({ auth, payload }) {
    const appointment = await AppointmentModel.findOne({
      appointmentId: payload.appointmentId,
    })
      .select('appointmentId patientId doctorId status')
      .lean();

    if (!appointment) {
      throw new ApiError('Matching appointment not found', 404);
    }

    if (appointment.status === 'cancelled') {
      throw new ApiError('Cannot create prescription for cancelled appointment', 400);
    }

    const appointmentPatientId = String(appointment.patientId);
    const appointmentDoctorId = String(appointment.doctorId);

    if (payload.patientId && String(payload.patientId) !== appointmentPatientId) {
      throw new ApiError('Patient ID does not match appointment', 400);
    }

    if (payload.doctorId && String(payload.doctorId) !== appointmentDoctorId) {
      throw new ApiError('Doctor ID does not match appointment', 400);
    }

    if (auth.role === 'doctor' && String(auth.userId) !== appointmentDoctorId) {
      throw new ApiError('Forbidden: appointment is not assigned to this doctor', 403);
    }

    this.assertCreatePermission(auth, { doctorId: appointmentDoctorId });

    try {
      const created = await PrescriptionModel.create({
        prescriptionId: `PRX-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        appointmentId: payload.appointmentId,
        patientId: appointmentPatientId,
        doctorId: appointmentDoctorId,
        diagnosis: payload.diagnosis,
        medicines: payload.medicines,
        advice: payload.advice,
      });

      await this.invalidateListCaches({
        patientId: String(created.patientId),
        doctorId: String(created.doctorId),
      });

      return {
        prescription: {
          prescriptionId: created.prescriptionId,
          appointmentId: created.appointmentId,
          patientId: created.patientId,
          doctorId: created.doctorId,
          diagnosis: created.diagnosis,
          medicines: created.medicines,
          advice: created.advice,
          createdAt: created.createdAt,
        },
      };
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError('Prescription already exists for this appointment', 409);
      }
      throw error;
    }
  }

  async update({ auth, prescriptionId, payload }) {
    const existing = await PrescriptionModel.findOne({ prescriptionId })
      .select('prescriptionId appointmentId patientId doctorId diagnosis medicines advice createdAt')
      .lean();

    if (!existing) {
      throw new ApiError('Prescription not found', 404);
    }

    if (auth.role === 'doctor' && String(existing.doctorId) !== String(auth.userId)) {
      throw new ApiError('Forbidden: can only modify own prescriptions', 403);
    }

    const updated = await PrescriptionModel.findOneAndUpdate(
      { prescriptionId },
      {
        $set: {
          diagnosis: payload.diagnosis,
          medicines: payload.medicines,
          advice: payload.advice,
        },
      },
      { returnDocument: 'after', runValidators: true }
    )
      .select('prescriptionId appointmentId patientId doctorId diagnosis medicines advice createdAt updatedAt')
      .lean();

    await this.invalidateListCaches({
      patientId: String(existing.patientId),
      doctorId: String(existing.doctorId),
    });

    return {
      prescription: updated,
    };
  }

  async list({ auth, query }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {};

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
      PrescriptionModel.find(filter)
        .select('prescriptionId appointmentId patientId doctorId diagnosis medicines advice createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PrescriptionModel.countDocuments(filter),
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

  async recordAdherence({ auth, prescriptionId, payload }) {
    const prescription = await PrescriptionModel.findOne({ prescriptionId }).lean();

    if (!prescription) {
      throw new ApiError('Prescription not found', 404);
    }

    if (String(prescription.patientId) !== String(auth.userId)) {
      throw new ApiError('Forbidden: can only update own prescriptions', 403);
    }

    const { medicineIndex, date, taken } = payload;

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      throw new ApiError('Invalid medicine index', 400);
    }

    const medicines = [...prescription.medicines];
    const adherence = Array.isArray(medicines[medicineIndex].adherence)
      ? [...medicines[medicineIndex].adherence]
      : [];
    const existingIndex = adherence.findIndex((entry) => entry.date === date);

    if (existingIndex >= 0) {
      adherence[existingIndex] = {
        ...adherence[existingIndex],
        taken,
      };
    } else {
      adherence.push({
        date,
        taken,
        missedAlert: false,
        reminderSent: false,
      });
    }

    medicines[medicineIndex] = {
      ...medicines[medicineIndex],
      adherence,
    };

    const updated = await PrescriptionModel.findOneAndUpdate(
      { prescriptionId },
      { $set: { medicines } },
      { returnDocument: 'after' }
    ).select('prescriptionId medicines');

    await this.invalidateListCaches({
      patientId: String(prescription.patientId),
      doctorId: String(prescription.doctorId),
    });

    return {
      prescriptionId: updated.prescriptionId,
      medicine: updated.medicines[medicineIndex],
    };
  }

  async downloadPrescriptionPDF({ auth, prescriptionId }) {
    const prescription = await PrescriptionModel.findOne({ prescriptionId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization qualification')
      .lean();

    if (!prescription) {
      throw new ApiError('Prescription not found', 404);
    }

    const patientId = String(prescription.patientId?._id || prescription.patientId);
    const doctorId = String(prescription.doctorId?._id || prescription.doctorId);

    if (patientId !== String(auth.userId) && doctorId !== String(auth.userId)) {
      throw new ApiError('Forbidden: cannot access this prescription', 403);
    }

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Medical Prescription', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12).text(`Prescription ID: ${prescription.prescriptionId}`);
      doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
      doc.moveDown(1);

      doc.fontSize(14).text('Patient Details');
      doc.fontSize(11).text(`Name: ${prescription.patientId?.name || 'N/A'}`);
      doc.text(`Email: ${prescription.patientId?.email || 'N/A'}`);
      doc.moveDown(1);

      doc.fontSize(14).text('Doctor Details');
      doc.fontSize(11).text(`Name: ${prescription.doctorId?.name || 'N/A'}`);
      doc.text(`Specialization: ${prescription.doctorId?.specialization || 'N/A'}`);
      doc.text(`Qualification: ${prescription.doctorId?.qualification || 'N/A'}`);
      doc.moveDown(1);

      doc.fontSize(14).text('Diagnosis');
      doc.fontSize(11).text(prescription.diagnosis || 'N/A');
      doc.moveDown(1);

      doc.fontSize(14).text('Medicines');
      prescription.medicines.forEach((medicine, index) => {
        doc.fontSize(11).text(`${index + 1}. ${medicine.medicine}`);
        doc.text(`   Dosage: ${medicine.dosage || 'N/A'}`);
        doc.text(`   Frequency: ${medicine.frequency || 'N/A'}`);
        doc.text(`   Duration: ${medicine.durationDays || 'N/A'} days`);
        if (medicine.notes) {
          doc.text(`   Notes: ${medicine.notes}`);
        }
        doc.moveDown(0.5);
      });

      if (prescription.advice) {
        doc.moveDown(1);
        doc.fontSize(14).text('Doctor Advice');
        doc.fontSize(11).text(prescription.advice);
      }

      doc.end();
    });

    return pdfBuffer;
  }

  async invalidateListCaches({ patientId, doctorId }) {
    const [adminKeys, doctorKeys, patientKeys] = await Promise.all([
      safeSMembers(registryKey('admin')),
      safeSMembers(registryKey('doctor', doctorId)),
      safeSMembers(registryKey('patient', patientId)),
    ]);

    await safeDel(Array.from(new Set([...adminKeys, ...doctorKeys, ...patientKeys])));
  }
}

export const prescriptionService = new PrescriptionService();
