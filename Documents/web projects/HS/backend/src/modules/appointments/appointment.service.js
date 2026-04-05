import { ApiError } from '../../utils/ApiError.js';
import { redisClient } from '../../config/redis.js';
import { metrics } from '../../config/metrics.js';
import { AppointmentModel } from './appointment.model.js';
import { emitNotification } from '../../config/socket.js';
import { UserModel } from '../auth/auth.model.js';
import { DoctorProfileModel } from '../doctors/doctorProfile.model.js';
import { billingService } from '../billing/billing.service.js';
import { emailService } from '../../services/email.service.js';
import { emailTemplates } from '../../services/emailTemplates.service.js';

const DEFAULT_TIME_SLOTS = [
  '09:00-09:30',
  '09:30-10:00',
  '10:00-10:30',
  '10:30-11:00',
  '11:00-11:30',
  '11:30-12:00',
  '12:00-12:30',
  '12:30-13:00',
  '13:00-13:30',
  '13:30-14:00',
  '14:00-14:30',
  '14:30-15:00',
  '15:00-15:30',
  '15:30-16:00',
  '16:00-16:30',
  '16:30-17:00',
  '17:00-17:30',
  '17:30-18:00',
];

const APPOINTMENT_LIST_CACHE_TTL_SECONDS = 30;
const AVAILABILITY_CACHE_TTL_SECONDS = 30;

const adminListRegistryKey = 'appointments:list-registry:admin';
const doctorListRegistryKey = (doctorId) => `appointments:list-registry:doctor:${doctorId}`;
const patientListRegistryKey = (patientId) => `appointments:list-registry:patient:${patientId}`;

const safeRedisGet = async (key) => {
  try {
    const value = await redisClient.get(key);
    if (value) {
      metrics.cacheHit();
    } else {
      metrics.cacheMiss();
    }
    return value;
  } catch (_error) {
    metrics.cacheMiss();
    return null;
  }
};

const safeRedisSet = async (key, value, ttlSeconds) => {
  try {
    await redisClient.set(key, value, 'EX', ttlSeconds);
  } catch (_error) {
  }
};

const safeRedisSAdd = async (key, members) => {
  try {
    if (!members.length) {
      return;
    }
    await redisClient.sadd(key, ...members);
  } catch (_error) {
  }
};

const safeRedisSMembers = async (key) => {
  try {
    return await redisClient.smembers(key);
  } catch (_error) {
    return [];
  }
};

const safeRedisDel = async (keys) => {
  if (!keys.length) {
    return;
  }

  try {
    await redisClient.del(keys);
  } catch (_error) {
  }
};

const formatListCacheKey = ({ role, userId, query }) => {
  return `appointments:list:${role}:${userId}:${JSON.stringify(query)}`;
};

const formatAvailabilityKey = ({ doctorId, date }) => {
  return `appointments:availability:${doctorId}:${date}`;
};

class AppointmentService {
  validateOwnershipForPatient(auth, incomingPatientId) {
    if (auth.role !== 'patient') {
      return incomingPatientId;
    }

    if (incomingPatientId && incomingPatientId !== auth.userId) {
      throw new ApiError('Patients can only act on their own records', 403);
    }

    return auth.userId;
  }

  async getDoctorAvailability({ doctorId, date }) {
    const cacheKey = formatAvailabilityKey({ doctorId, date });
    const cached = await safeRedisGet(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const takenAppointments = await AppointmentModel.find({
      doctorId,
      date,
      status: { $in: ['booked', 'accepted', 'completed'] },
    })
      .select('timeSlot -_id')
      .lean();

    const taken = new Set(takenAppointments.map((item) => item.timeSlot));
    const availableSlots = DEFAULT_TIME_SLOTS.filter((slot) => !taken.has(slot));

    const result = {
      doctorId,
      date,
      availableSlots,
      totalSlots: DEFAULT_TIME_SLOTS.length,
    };

    await safeRedisSet(cacheKey, JSON.stringify(result), AVAILABILITY_CACHE_TTL_SECONDS);
    return result;
  }

  async book({ auth, payload }) {
    const patientId = this.validateOwnershipForPatient(auth, payload.patientId);

    if (!patientId) {
      throw new ApiError('patientId is required for non-patient roles', 400);
    }

    const availability = await this.getDoctorAvailability({
      doctorId: payload.doctorId,
      date: payload.date,
    });

    if (!availability.availableSlots.includes(payload.timeSlot)) {
      throw new ApiError('Selected time slot is not available', 409);
    }

    const [doctor, patient, doctorProfile] = await Promise.all([
      UserModel.findOne({ _id: payload.doctorId, role: 'doctor', isVerified: true })
        .select('_id name email')
        .lean(),
      UserModel.findById(patientId)
        .select('_id name email')
        .lean(),
      DoctorProfileModel.findOne({ userId: payload.doctorId }).select('appointmentFee').lean(),
    ]);

    if (!doctor) {
      throw new ApiError('Doctor not found or not available', 404);
    }

    if (!patient) {
      throw new ApiError('Patient not found', 404);
    }

    const appointmentFee = Number(doctorProfile?.appointmentFee || 0);

    try {
      const appointment = await AppointmentModel.create({
        patientId,
        doctorId: payload.doctorId,
        date: payload.date,
        timeSlot: payload.timeSlot,
        priority: payload.priority || 'normal',
        status: 'booked',
        appointmentFee,
      });

      try {
        await this.invalidateCachesForMutation({
          doctorId: payload.doctorId,
          date: payload.date,
          patientId,
        });
      } catch (cacheError) {
        // Log but don't block on cache invalidation errors
        console.warn('Cache invalidation error:', cacheError);
      }

      emitNotification({
        userIds: [String(payload.doctorId), String(patientId)],
        notification: {
          type: 'appointment-booked',
          title: 'New appointment booked',
          message: `${appointment.priority === 'emergency' ? 'Emergency ' : ''}appointment booked for ${appointment.date} at ${appointment.timeSlot}`,
          appointmentId: appointment.appointmentId,
          priority: appointment.priority,
          appointmentFee,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          createdAt: appointment.createdAt,
        },
      });

      const template = emailTemplates.appointmentBookedForDoctor({
        doctorName: doctor.name,
        patientName: patient.name,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        appointmentId: appointment.appointmentId,
        priority: appointment.priority,
        appointmentFee,
      });

      emailService.queue({
        to: doctor.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return {
        appointment: {
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status: appointment.status,
          priority: appointment.priority,
          appointmentFee: appointment.appointmentFee,
          createdAt: appointment.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error?.name === 'ValidationError' || error?.name === 'CastError') {
        throw new ApiError('Invalid appointment details', 400);
      }

      if (error?.code === 11000) {
        throw new ApiError('Selected time slot is already booked', 409);
      }

      console.error('Appointment booking error:', error);
      throw new ApiError('Failed to book appointment. Please try again.', 500);
    }
  }

  async list({ auth, query }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) filter.date.$gte = query.dateFrom;
      if (query.dateTo) filter.date.$lte = query.dateTo;
    }

    if (auth.role === 'admin') {
      if (query.doctorId) filter.doctorId = query.doctorId;
      if (query.patientId) filter.patientId = query.patientId;
    }

    if (auth.role === 'doctor') {
      filter.doctorId = auth.userId;
    }

    if (auth.role === 'patient') {
      filter.patientId = auth.userId;
    }

    const cacheKey = formatListCacheKey({
      role: auth.role,
      userId: auth.userId,
      query: { ...query, page, limit },
    });

    const cached = await safeRedisGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [items, total] = await Promise.all([
      AppointmentModel.find(filter)
        .select('appointmentId patientId doctorId date timeSlot status priority appointmentFee createdAt updatedAt')
        .sort({ date: -1, timeSlot: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AppointmentModel.countDocuments(filter),
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

    await safeRedisSet(cacheKey, JSON.stringify(result), APPOINTMENT_LIST_CACHE_TTL_SECONDS);
    await this.registerListCacheKey({
      cacheKey,
      role: auth.role,
      doctorId: auth.role === 'doctor' ? auth.userId : query.doctorId,
      patientId: auth.role === 'patient' ? auth.userId : query.patientId,
    });
    return result;
  }

  async reschedule({ auth, payload }) {
    const appointment = await AppointmentModel.findOne({ appointmentId: payload.appointmentId })
      .select('appointmentId patientId doctorId date timeSlot status')
      .lean();

    if (!appointment) {
      throw new ApiError('Appointment not found', 404);
    }

    if (appointment.status !== 'booked') {
      throw new ApiError('Only booked appointments can be rescheduled', 400);
    }

    this.assertAppointmentAccess(auth, appointment);

    if (appointment.date === payload.date && appointment.timeSlot === payload.timeSlot) {
      throw new ApiError('New slot must be different from current slot', 400);
    }

    const availability = await this.getDoctorAvailability({
      doctorId: String(appointment.doctorId),
      date: payload.date,
    });

    if (!availability.availableSlots.includes(payload.timeSlot)) {
      throw new ApiError('Selected time slot is not available', 409);
    }

    try {
      const updated = await AppointmentModel.findOneAndUpdate(
        { appointmentId: payload.appointmentId, status: 'booked' },
        {
          $set: {
            date: payload.date,
            timeSlot: payload.timeSlot,
            priority: payload.priority || appointment.priority || 'normal',
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        }
      )
        .select('appointmentId patientId doctorId date timeSlot status updatedAt')
        .lean();

      if (!updated) {
        throw new ApiError('Appointment not found', 404);
      }

      await this.invalidateCachesForMutation({
        doctorId: String(appointment.doctorId),
        date: appointment.date,
        patientId: String(appointment.patientId),
      });

      await this.invalidateCachesForMutation({
        doctorId: String(updated.doctorId),
        date: updated.date,
        patientId: String(updated.patientId),
      });

      emitNotification({
        userIds: [String(updated.doctorId), String(updated.patientId)],
        notification: {
          type: 'appointment-rescheduled',
          title: 'Appointment rescheduled',
          message: `Appointment ${updated.appointmentId} moved to ${updated.date} ${updated.timeSlot}`,
          appointmentId: updated.appointmentId,
          priority: updated.priority || 'normal',
          date: updated.date,
          timeSlot: updated.timeSlot,
          createdAt: updated.updatedAt,
        },
      });

      return { appointment: updated };
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError('Selected time slot is already booked', 409);
      }

      throw error;
    }
  }

  async cancel({ auth, payload }) {
    const appointment = await AppointmentModel.findOne({ appointmentId: payload.appointmentId })
      .select('appointmentId patientId doctorId date timeSlot status')
      .lean();

    if (!appointment) {
      throw new ApiError('Appointment not found', 404);
    }

    if (appointment.status !== 'booked') {
      throw new ApiError('Only booked appointments can be cancelled', 400);
    }

    this.assertAppointmentAccess(auth, appointment);

    const cancelled = await AppointmentModel.findOneAndUpdate(
      { appointmentId: payload.appointmentId, status: 'booked' },
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after' }
    )
      .select('appointmentId status updatedAt')
      .lean();

    if (!cancelled) {
      throw new ApiError('Appointment not found', 404);
    }

    await this.invalidateCachesForMutation({
      doctorId: String(appointment.doctorId),
      date: appointment.date,
      patientId: String(appointment.patientId),
    });

    emitNotification({
      userIds: [String(appointment.doctorId), String(appointment.patientId)],
      notification: {
        type: 'appointment-cancelled',
        title: 'Appointment cancelled',
        message: `Appointment ${appointment.appointmentId} was cancelled.`,
        appointmentId: appointment.appointmentId,
        priority: appointment.priority || 'normal',
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        createdAt: cancelled.updatedAt,
      },
    });

    return { appointment: cancelled };
  }

  async respond({ auth, payload }) {
    const appointment = await AppointmentModel.findOne({ appointmentId: payload.appointmentId })
      .select('appointmentId patientId doctorId date timeSlot status priority')
      .lean();

    if (!appointment) {
      throw new ApiError('Appointment not found', 404);
    }

    this.assertAppointmentAccess(auth, appointment);

    if (payload.action === 'accept' || payload.action === 'reject') {
      if (appointment.status !== 'booked') {
        throw new ApiError('Only booked appointments can be accepted/rejected', 400);
      }
    }

    if (payload.action === 'complete' && appointment.status !== 'accepted') {
      throw new ApiError('Only accepted appointments can be marked as completed', 400);
    }

    let nextStatus = 'cancelled';
    if (payload.action === 'accept') {
      nextStatus = 'accepted';
    }
    if (payload.action === 'complete') {
      nextStatus = 'completed';
    }

    const updated = await AppointmentModel.findOneAndUpdate(
      { appointmentId: payload.appointmentId, status: 'booked' },
      { $set: { status: nextStatus } },
      { returnDocument: 'after' }
    )
      .select('appointmentId patientId doctorId date timeSlot status updatedAt priority appointmentFee')
      .lean();

    if (!updated) {
      throw new ApiError('Appointment not found', 404);
    }

    if (nextStatus === 'accepted') {
      const amount = Number(updated.appointmentFee || 0);

      if (amount > 0) {
        await billingService.createInvoice({
          auth,
          payload: {
            appointmentId: updated.appointmentId,
            patientId: String(updated.patientId),
            doctorId: String(updated.doctorId),
            amount,
            currency: 'INR',
          },
        }).catch((error) => {
          if (error?.statusCode === 409) {
            return null;
          }

          throw error;
        });
      }
    }

    await this.invalidateCachesForMutation({
      doctorId: String(updated.doctorId),
      date: updated.date,
      patientId: String(updated.patientId),
    });

    const [doctor, patient] = await Promise.all([
      UserModel.findById(updated.doctorId).select('name email').lean(),
      UserModel.findById(updated.patientId).select('name email').lean(),
    ]);

    if (doctor?.email && patient?.email) {
      const template = emailTemplates.appointmentDecisionForPatient({
        patientName: patient.name,
        doctorName: doctor.name,
        appointmentId: updated.appointmentId,
        date: updated.date,
        timeSlot: updated.timeSlot,
        action: payload.action,
        appointmentFee: Number(updated.appointmentFee || 0),
        currency: 'INR',
      });

      emailService.queue({
        to: patient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (doctor?.email) {
        const doctorTemplate = emailTemplates.appointmentDecisionForDoctor({
          doctorName: doctor.name,
          patientName: patient.name,
          appointmentId: updated.appointmentId,
          date: updated.date,
          timeSlot: updated.timeSlot,
          action: payload.action,
        });

        emailService.queue({
          to: doctor.email,
          subject: doctorTemplate.subject,
          html: doctorTemplate.html,
          text: doctorTemplate.text,
        });
      }
    }

    emitNotification({
      userIds: [String(updated.patientId), String(updated.doctorId)],
      notification: {
        type:
          payload.action === 'accept'
            ? 'appointment-accepted'
            : payload.action === 'complete'
              ? 'appointment-completed'
              : 'appointment-rejected',
        title:
          payload.action === 'accept'
            ? 'Appointment accepted'
            : payload.action === 'complete'
              ? 'Appointment completed'
              : 'Appointment rejected',
        message:
          payload.action === 'accept'
            ? `Appointment ${updated.appointmentId} accepted for ${updated.date} ${updated.timeSlot}`
            : payload.action === 'complete'
              ? `Appointment ${updated.appointmentId} completed. Patient can now submit a rating.`
              : `Appointment ${updated.appointmentId} was rejected by doctor`,
        appointmentId: updated.appointmentId,
        date: updated.date,
        timeSlot: updated.timeSlot,
        priority: updated.priority || 'normal',
        createdAt: updated.updatedAt,
      },
    });

    return { appointment: updated };
  }

  assertAppointmentAccess(auth, appointment) {
    if (auth.role === 'admin') {
      return;
    }

    if (auth.role === 'doctor' && String(appointment.doctorId) === String(auth.userId)) {
      return;
    }

    if (auth.role === 'patient' && String(appointment.patientId) === String(auth.userId)) {
      return;
    }

    throw new ApiError('Forbidden: cannot access this appointment', 403);
  }

  async invalidateCachesForMutation({ doctorId, date, patientId }) {
    const keys = [formatAvailabilityKey({ doctorId, date })];

    const [adminKeys, doctorKeys, patientKeys] = await Promise.all([
      safeRedisSMembers(adminListRegistryKey),
      safeRedisSMembers(doctorListRegistryKey(doctorId)),
      patientId ? safeRedisSMembers(patientListRegistryKey(patientId)) : Promise.resolve([]),
    ]);

    keys.push(...adminKeys, ...doctorKeys, ...patientKeys);

    await safeRedisDel(Array.from(new Set(keys)));
  }

  async registerListCacheKey({ cacheKey, role, doctorId, patientId }) {
    const registryKeys = [adminListRegistryKey];

    if (role === 'doctor' && doctorId) {
      registryKeys.push(doctorListRegistryKey(doctorId));
    }

    if (role === 'patient' && patientId) {
      registryKeys.push(patientListRegistryKey(patientId));
    }

    if (role === 'admin') {
      if (doctorId) {
        registryKeys.push(doctorListRegistryKey(doctorId));
      }
      if (patientId) {
        registryKeys.push(patientListRegistryKey(patientId));
      }
    }

    await Promise.all(registryKeys.map((key) => safeRedisSAdd(key, [cacheKey])));
  }
}

export const appointmentService = new AppointmentService();
