import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/auth.model.js';
import { DoctorProfileModel } from '../modules/doctors/doctorProfile.model.js';

const adminSeed = {
  name: 'Vasu Admin',
  email: 'chippavasu3@gmail.com',
  password: '12341234',
  role: 'admin',
};

const doctorSeeds = [
  {
    name: 'Doctor One',
    email: 'doctor.one@caresyncr.com',
    password: '12341234',
    role: 'doctor',
    profile: {
      specialization: 'Cardiology',
      experienceYears: 12,
      qualification: 'MBBS, MD Cardiology',
      appointmentFee: 120,
    },
  },
  {
    name: 'Dr. Nisha Verma',
    email: 'nisha.verma@caresyncr.com',
    password: '12341234',
    role: 'doctor',
    profile: {
      specialization: 'Neurology',
      experienceYears: 9,
      qualification: 'MBBS, DM Neurology',
      appointmentFee: 150,
    },
  },
  {
    name: 'Dr. Arjun Rao',
    email: 'arjun.rao@caresyncr.com',
    password: '12341234',
    role: 'doctor',
    profile: {
      specialization: 'Orthopedics',
      experienceYears: 11,
      qualification: 'MBBS, MS Orthopedics',
      appointmentFee: 100,
    },
  },
  {
    name: 'Dr. Meera Nair',
    email: 'meera.nair@caresyncr.com',
    password: '12341234',
    role: 'doctor',
    profile: {
      specialization: 'Pediatrics',
      experienceYears: 7,
      qualification: 'MBBS, MD Pediatrics',
      appointmentFee: 90,
    },
  },
];

const upsertUser = async ({ name, email, password, role }) => {
  let user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    user = new UserModel({
      name,
      email,
      password,
      role,
      isVerified: true,
    });
  } else {
    user.name = name;
    user.password = password;
    user.role = role;
    user.isVerified = true;
  }

  await user.save();
  return user;
};

const run = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    const admin = await upsertUser(adminSeed);
    console.log(`Admin ready: ${admin.email}`);

    for (const doctorSeed of doctorSeeds) {
      const doctorUser = await upsertUser(doctorSeed);

      await DoctorProfileModel.findOneAndUpdate(
        { userId: doctorUser._id },
        {
          $set: {
            specialization: doctorSeed.profile.specialization,
            experienceYears: doctorSeed.profile.experienceYears,
            qualification: doctorSeed.profile.qualification,
            appointmentFee: doctorSeed.profile.appointmentFee,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      console.log(`Doctor ready: ${doctorUser.email}`);
    }
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
