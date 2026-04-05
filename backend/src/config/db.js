import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDatabase = async () => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
};
