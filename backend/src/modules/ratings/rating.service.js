import { ApiError } from '../../utils/ApiError.js';
import { RatingModel } from './rating.model.js';
import { UserModel } from '../auth/auth.model.js';
import { AppointmentModel } from '../appointments/appointment.model.js';

class RatingService {
  async createRating({ patientId, payload }) {
    const { doctorId, appointmentId, overallRating, professionalism, bedideManner, clearExplanations, comment, isAnonymous } = payload;

    // Check if doctor exists
    const doctor = await UserModel.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new ApiError('Doctor not found', 404);
    }

    const appointment = await AppointmentModel.findOne({
      appointmentId,
      doctorId,
      patientId,
      status: 'completed',
    })
      .select('appointmentId')
      .lean();

    if (!appointment) {
      throw new ApiError('You can only rate after a completed appointment with this doctor', 400);
    }

    // Check if patient already rated this appointment
    const existingRating = await RatingModel.findOne({
      appointmentId,
      patientId,
    });

    if (existingRating) {
      throw new ApiError('You have already rated this completed appointment', 400);
    }

    const rating = await RatingModel.create({
      doctorId,
      patientId,
      appointmentId,
      overallRating,
      professionalism,
      bedideManner,
      clearExplanations,
      comment,
      isAnonymous,
    });

    return this._formatRating(rating);
  }

  async updateRating({ ratingId, patientId, payload }) {
    const rating = await RatingModel.findById(ratingId);

    if (!rating) {
      throw new ApiError('Rating not found', 404);
    }

    if (String(rating.patientId) !== String(patientId)) {
      throw new ApiError('Unauthorized to update this rating', 403);
    }

    Object.assign(rating, payload);
    await rating.save();

    return this._formatRating(rating);
  }

  async deleteRating({ ratingId, patientId }) {
    const rating = await RatingModel.findById(ratingId);

    if (!rating) {
      throw new ApiError('Rating not found', 404);
    }

    if (String(rating.patientId) !== String(patientId)) {
      throw new ApiError('Unauthorized to delete this rating', 403);
    }

    await RatingModel.deleteOne({ _id: ratingId });

    return { success: true };
  }

  async getRatingsByDoctor({ doctorId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const ratings = await RatingModel.find({ doctorId })
      .skip(skip)
      .limit(limit)
      .populate('patientId', 'name avatarPath')
      .lean()
      .sort({ createdAt: -1 });

    const total = await RatingModel.countDocuments({ doctorId });

    return {
      items: ratings.map((rating) => this._formatRating(rating)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDoctorStats({ doctorId }) {
    const ratings = await RatingModel.find({ doctorId }).lean();

    if (ratings.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        averageProfessionalism: 0,
        averageBedideManner: 0,
        averageClearExplanations: 0,
      };
    }

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      totalReviews: ratings.length,
      averageRating: parseFloat(avg(ratings.map((r) => r.overallRating)).toFixed(2)),
      averageProfessionalism: parseFloat(avg(ratings.map((r) => r.professionalism)).toFixed(2)),
      averageBedideManner: parseFloat(avg(ratings.map((r) => r.bedideManner)).toFixed(2)),
      averageClearExplanations: parseFloat(avg(ratings.map((r) => r.clearExplanations)).toFixed(2)),
    };
  }

  _formatRating(rating) {
    const plainRating = rating.toObject ? rating.toObject() : rating;
    return {
      ratingId: String(plainRating._id),
      doctorId: String(plainRating.doctorId),
      patientId: plainRating.isAnonymous ? null : String(plainRating.patientId),
      patientName: plainRating.isAnonymous ? 'Anonymous' : plainRating.patientId?.name || 'Unknown',
      appointmentId: plainRating.appointmentId ? String(plainRating.appointmentId) : null,
      overallRating: plainRating.overallRating,
      professionalism: plainRating.professionalism,
      bedideManner: plainRating.bedideManner,
      clearExplanations: plainRating.clearExplanations,
      comment: plainRating.comment,
      isAnonymous: plainRating.isAnonymous,
      createdAt: plainRating.createdAt,
    };
  }
}

export const ratingService = new RatingService();
