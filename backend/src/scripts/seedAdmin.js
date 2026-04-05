import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/auth.model.js';

const DEFAULT_ADMIN = {
  name: process.env.SEED_ADMIN_NAME || 'Local Admin',
  email: (process.env.SEED_ADMIN_EMAIL || 'admin@caresyncr.local').toLowerCase(),
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
  role: 'admin',
};

const run = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    let user = await UserModel.findOne({ email: DEFAULT_ADMIN.email }).select('+password');

    if (!user) {
      user = new UserModel({
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
        role: DEFAULT_ADMIN.role,
        isVerified: true,
      });
      await user.save();
      console.log(`Seeded admin user: ${DEFAULT_ADMIN.email}`);
    } else {
      user.name = DEFAULT_ADMIN.name;
      user.password = DEFAULT_ADMIN.password;
      user.role = DEFAULT_ADMIN.role;
      user.isVerified = true;
      await user.save();
      console.log(`Updated admin user: ${DEFAULT_ADMIN.email}`);
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
