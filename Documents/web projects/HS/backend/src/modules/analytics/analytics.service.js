import { redisClient } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { metrics } from '../../config/metrics.js';
import { UserModel } from '../auth/auth.model.js';
import { AppointmentModel } from '../appointments/appointment.model.js';
import { BillingModel } from '../billing/billing.model.js';
import { RatingModel } from '../ratings/rating.model.js';

const SLOTS_PER_DAY = 12;
const CACHE_TTL_SECONDS = env.ANALYTICS_CACHE_TTL_SECONDS;

const keyAdmin = (days) => `analytics:admin:${days}`;
const keyAdminEarnings = (days) => `analytics:admin:earnings:${days}`;
const keyDoctor = (doctorId, days) => `analytics:doctor:${doctorId}:${days}`;

const safeGet = async (key) => {
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

const safeSet = async (key, value) => {
  try {
    await redisClient.set(key, value, 'EX', CACHE_TTL_SECONDS);
  } catch (_error) {
  }
};

const startDateString = (days) => {
  const now = new Date();
  now.setDate(now.getDate() - (days - 1));
  return now.toISOString().slice(0, 10);
};

class AnalyticsService {
  async getAdminAnalytics({ days }) {
    const cacheKey = keyAdmin(days);
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const fromDate = startDateString(days);

    const [
      totalUsers,
      usersByRole,
      revenueAgg,
      appointmentsPerDay,
      doctorUtilization,
    ] = await Promise.all([
      UserModel.countDocuments({ isVerified: true }),
      UserModel.aggregate([
        { $match: { isVerified: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      BillingModel.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      AppointmentModel.aggregate([
        { $match: { date: { $gte: fromDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      AppointmentModel.aggregate([
        { $match: { date: { $gte: fromDate }, status: { $in: ['booked', 'completed'] } } },
        {
          $group: {
            _id: '$doctorId',
            appointments: { $sum: 1 },
            daysActive: { $addToSet: '$date' },
          },
        },
        {
          $project: {
            doctorId: '$_id',
            appointments: 1,
            daysCount: { $size: '$daysActive' },
            utilizationPercent: {
              $multiply: [
                {
                  $divide: [
                    '$appointments',
                    { $max: [{ $multiply: [{ $size: '$daysActive' }, SLOTS_PER_DAY] }, 1] },
                  ],
                },
                100,
              ],
            },
          },
        },
        { $sort: { utilizationPercent: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const usersBreakdown = usersByRole.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      { admin: 0, doctor: 0, patient: 0 }
    );

    const result = {
      summary: {
        totalUsers,
        totalRevenue: Number(revenueAgg[0]?.totalRevenue || 0),
        totalDoctors: usersBreakdown.doctor,
        totalPatients: usersBreakdown.patient,
      },
      charts: {
        appointmentsPerDay: appointmentsPerDay.map((row) => ({
          date: row._id,
          count: row.count,
        })),
        doctorUtilization: doctorUtilization.map((row) => ({
          doctorId: row.doctorId,
          appointments: row.appointments,
          utilizationPercent: Number((row.utilizationPercent || 0).toFixed(2)),
        })),
      },
      meta: {
        days,
      },
    };

    await safeSet(cacheKey, JSON.stringify(result));
    return result;
  }

  async getDoctorAnalytics({ doctorId, days }) {
    const cacheKey = keyDoctor(doctorId, days);
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const fromDate = startDateString(days);

    const [revenueAgg, appointmentsPerDay, totals] = await Promise.all([
      BillingModel.aggregate([
        {
          $match: {
            doctorId,
            paymentStatus: 'paid',
          },
        },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      AppointmentModel.aggregate([
        {
          $match: {
            doctorId,
            date: { $gte: fromDate },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      AppointmentModel.aggregate([
        {
          $match: {
            doctorId,
            date: { $gte: fromDate },
            status: { $in: ['booked', 'completed'] },
          },
        },
        {
          $group: {
            _id: null,
            totalAppointments: { $sum: 1 },
            daysActive: { $addToSet: '$date' },
          },
        },
      ]),
    ]);

    const totalAppointments = totals[0]?.totalAppointments || 0;
    const daysActive = totals[0]?.daysActive?.length || 0;
    const utilizationPercent = daysActive
      ? Number(((totalAppointments / (daysActive * SLOTS_PER_DAY)) * 100).toFixed(2))
      : 0;

    const result = {
      summary: {
        totalRevenue: Number(revenueAgg[0]?.totalRevenue || 0),
        totalAppointments,
        utilizationPercent,
      },
      charts: {
        appointmentsPerDay: appointmentsPerDay.map((row) => ({
          date: row._id,
          count: row.count,
        })),
      },
      meta: {
        days,
      },
    };

    await safeSet(cacheKey, JSON.stringify(result));
    return result;
  }

  async getAdminEarnings({ days }) {
    const cacheKey = keyAdminEarnings(days);
    const cached = await safeGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const fromDate = startDateString(days);

    const [earningsByDoctor, ratingsByDoctor] = await Promise.all([
      BillingModel.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(`${fromDate}T00:00:00.000Z`) },
          },
        },
        {
          $group: {
            _id: '$doctorId',
            noOfOps: { $sum: 1 },
            grossEarnings: { $sum: '$amount' },
            platformCommission: { $sum: '$platformCommissionAmount' },
            doctorPayout: { $sum: '$doctorPayoutAmount' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        {
          $project: {
            doctorId: '$_id',
            doctorName: { $ifNull: [{ $arrayElemAt: ['$doctor.name', 0] }, 'Unknown Doctor'] },
            doctorEmail: { $ifNull: [{ $arrayElemAt: ['$doctor.email', 0] }, ''] },
            noOfOps: 1,
            grossEarnings: { $round: ['$grossEarnings', 2] },
            platformCommission: { $round: ['$platformCommission', 2] },
            doctorPayout: { $round: ['$doctorPayout', 2] },
            _id: 0,
          },
        },
        { $sort: { grossEarnings: -1 } },
      ]),
      RatingModel.aggregate([
        {
          $group: {
            _id: '$doctorId',
            averageRating: { $avg: '$overallRating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const ratingsMap = new Map(
      ratingsByDoctor.map((item) => [String(item._id), {
        averageRating: Number((item.averageRating || 0).toFixed(2)),
        totalReviews: Number(item.totalReviews || 0),
      }])
    );

    const rows = earningsByDoctor.map((item) => {
      const rating = ratingsMap.get(String(item.doctorId)) || { averageRating: 0, totalReviews: 0 };
      return {
        doctorId: String(item.doctorId),
        doctorName: item.doctorName,
        doctorEmail: item.doctorEmail,
        noOfOps: Number(item.noOfOps || 0),
        grossEarnings: Number(item.grossEarnings || 0),
        platformCommission: Number(item.platformCommission || 0),
        doctorPayout: Number(item.doctorPayout || 0),
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
      };
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.totalOps += row.noOfOps;
        acc.totalGrossEarnings += row.grossEarnings;
        acc.totalPlatformCommission += row.platformCommission;
        acc.totalDoctorPayout += row.doctorPayout;
        return acc;
      },
      {
        totalOps: 0,
        totalGrossEarnings: 0,
        totalPlatformCommission: 0,
        totalDoctorPayout: 0,
      }
    );

    const result = {
      summary: {
        doctorsWithPaidOps: rows.length,
        totalOps: summary.totalOps,
        totalGrossEarnings: Number(summary.totalGrossEarnings.toFixed(2)),
        totalPlatformCommission: Number(summary.totalPlatformCommission.toFixed(2)),
        totalDoctorPayout: Number(summary.totalDoctorPayout.toFixed(2)),
      },
      items: rows,
      meta: {
        days,
      },
    };

    await safeSet(cacheKey, JSON.stringify(result));
    return result;
  }
}

export const analyticsService = new AnalyticsService();
