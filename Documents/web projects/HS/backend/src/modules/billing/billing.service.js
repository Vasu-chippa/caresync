import { ApiError } from '../../utils/ApiError.js';
import { redisClient } from '../../config/redis.js';
import { BillingModel } from './billing.model.js';

const LIST_CACHE_TTL_SECONDS = 45;

const listCacheKey = ({ role, userId, query }) => {
  return `billing:list:${role}:${userId}:${JSON.stringify(query)}`;
};

const registryKey = (scope, id = 'all') => `billing:list-registry:${scope}:${id}`;

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
  } catch (_error) {
  }
};

const safeSAdd = async (key, members) => {
  try {
    if (!members.length) return;
    await redisClient.sadd(key, ...members);
  } catch (_error) {
  }
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
  } catch (_error) {
  }
};

class BillingService {
  assertInvoiceAccess(auth, invoice) {
    if (auth.role === 'admin') return;
    if (auth.role === 'doctor' && String(invoice.doctorId) === String(auth.userId)) return;
    if (auth.role === 'patient' && String(invoice.patientId) === String(auth.userId)) return;
    throw new ApiError('Forbidden: cannot access this invoice', 403);
  }

  async createInvoice({ auth, payload }) {
    if (!['admin', 'doctor'].includes(auth.role)) {
      throw new ApiError('Forbidden: insufficient permissions', 403);
    }

    if (auth.role === 'doctor' && String(payload.doctorId) !== String(auth.userId)) {
      throw new ApiError('Doctors can only create invoices for themselves', 403);
    }

    try {
      const amount = Number(payload.amount || 0);
      const commissionRate = Number(payload.commissionRate ?? 0.1);
      const platformCommissionAmount = Number((amount * commissionRate).toFixed(2));
      const doctorPayoutAmount = Number((amount - platformCommissionAmount).toFixed(2));

      const created = await BillingModel.create({
        appointmentId: payload.appointmentId,
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        amount,
        commissionRate,
        platformCommissionAmount,
        doctorPayoutAmount,
        currency: (payload.currency || 'INR').toUpperCase(),
        paymentStatus: 'pending',
      });

      await this.invalidateListCaches({
        patientId: String(created.patientId),
        doctorId: String(created.doctorId),
      });

      return {
        invoice: {
          invoiceId: created.invoiceId,
          appointmentId: created.appointmentId,
          patientId: created.patientId,
          doctorId: created.doctorId,
          amount: created.amount,
          commissionRate: created.commissionRate,
          platformCommissionAmount: created.platformCommissionAmount,
          doctorPayoutAmount: created.doctorPayoutAmount,
          currency: created.currency,
          paymentStatus: created.paymentStatus,
          createdAt: created.createdAt,
        },
      };
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError('Invoice already exists for this appointment', 409);
      }
      throw error;
    }
  }

  async listInvoices({ auth, query }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
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
      BillingModel.find(filter)
        .select('invoiceId appointmentId patientId doctorId amount commissionRate platformCommissionAmount doctorPayoutAmount currency paymentStatus paidAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BillingModel.countDocuments(filter),
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

  async markPaid({ auth, payload }) {
    if (!['admin', 'doctor', 'patient'].includes(auth.role)) {
      throw new ApiError('Forbidden: insufficient permissions', 403);
    }

    const existing = await BillingModel.findOne({ invoiceId: payload.invoiceId })
      .select('invoiceId doctorId patientId paymentStatus')
      .lean();

    if (!existing) {
      throw new ApiError('Invoice not found', 404);
    }

    this.assertInvoiceAccess(auth, existing);

    if (existing.paymentStatus === 'paid') {
      return {
        invoice: {
          invoiceId: existing.invoiceId,
          paymentStatus: existing.paymentStatus,
        },
      };
    }

    if (auth.role === 'patient' && !payload.paymentMethod) {
      throw new ApiError('paymentMethod is required for patient payments', 400);
    }

    const updated = await BillingModel.findOneAndUpdate(
      { invoiceId: payload.invoiceId },
      {
        $set: {
          paymentStatus: 'paid',
          paymentMethod: payload.paymentMethod || existing.paymentMethod || 'upi',
          transactionRef: payload.transactionRef || existing.transactionRef || null,
          paidAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )
      .select('invoiceId paymentStatus paymentMethod transactionRef paidAt doctorId patientId')
      .lean();

    await this.invalidateListCaches({
      patientId: String(updated.patientId),
      doctorId: String(updated.doctorId),
    });

    return { invoice: updated };
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
      safeSMembers(registryKey('doctor', doctorId)),
      safeSMembers(registryKey('patient', patientId)),
    ]);

    await safeDel(Array.from(new Set([...adminKeys, ...doctorKeys, ...patientKeys])));
  }
}

export const billingService = new BillingService();
