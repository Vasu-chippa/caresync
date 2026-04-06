import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  CLIENT_URL: Joi.string().uri().required(),
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().allow('').optional(),
  USE_IN_MEMORY_REDIS: Joi.boolean().truthy('true').falsy('false').default(false),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  ANALYTICS_CACHE_TTL_SECONDS: Joi.number().integer().min(300).max(600).default(600),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().email().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
}).unknown();

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

if (!value.USE_IN_MEMORY_REDIS && !value.REDIS_URL) {
  throw new Error('Environment validation failed: REDIS_URL is required when USE_IN_MEMORY_REDIS is false');
}

export const env = value;
