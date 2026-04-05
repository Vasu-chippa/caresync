import { ApiError } from '../../utils/ApiError.js';
import { UserModel } from '../auth/auth.model.js';
import { DoctorProfileModel } from './doctorProfile.model.js';

class DoctorService {
  async listDoctors() {
    const [doctors, profiles] = await Promise.all([
      UserModel.find({ role: 'doctor', isVerified: true })
        .select('_id name email')
        .sort({ name: 1 })
        .lean(),
      DoctorProfileModel.find({})
        .select('userId specialization experienceYears qualification appointmentFee')
        .lean(),
    ]);

    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    return {
      items: doctors.map((doctor) => {
        const profile = profileMap.get(String(doctor._id));
        return {
          id: String(doctor._id),
          name: doctor.name,
          email: doctor.email,
          specialization: profile?.specialization || 'General Medicine',
          experienceYears: profile?.experienceYears ?? 0,
          qualification: profile?.qualification || 'MBBS',
          appointmentFee: profile?.appointmentFee ?? 0,
        };
      }),
    };
  }

  async getMyProfile(userId) {
    const [user, profile] = await Promise.all([
      UserModel.findById(userId).select('_id name email role isVerified createdAt').lean(),
      DoctorProfileModel.findOne({ userId }).select('userId specialization experienceYears qualification appointmentFee').lean(),
    ]);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return {
      profile: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: profile?.specialization || 'General Medicine',
        experienceYears: profile?.experienceYears ?? 0,
        qualification: profile?.qualification || 'MBBS',
        appointmentFee: profile?.appointmentFee ?? 0,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    };
  }

  async updateMyProfile({ userId, payload }) {
    const updated = await DoctorProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          appointmentFee: payload.appointmentFee,
        },
      },
      { returnDocument: 'after', runValidators: true }
    )
      .select('userId specialization experienceYears qualification appointmentFee')
      .lean();

    if (!updated) {
      throw new ApiError('Doctor profile not found', 404);
    }

    return {
      profile: {
        id: String(updated.userId),
        specialization: updated.specialization,
        experienceYears: updated.experienceYears,
        qualification: updated.qualification,
        appointmentFee: updated.appointmentFee ?? 0,
      },
    };
  }
}

export const doctorService = new DoctorService();
