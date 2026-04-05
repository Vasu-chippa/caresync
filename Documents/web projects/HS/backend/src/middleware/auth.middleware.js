import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new ApiError('JWT access secret is not configured', 500);
  }

  return secret;
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const authenticateAccessToken = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new ApiError('Authentication required', 401));
  }

  try {
    const payload = jwt.verify(token, getAccessSecret());

    if (payload.type !== 'access') {
      return next(new ApiError('Invalid token type', 401));
    }

    req.auth = Object.freeze({
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    });

    return next();
  } catch (_error) {
    return next(new ApiError('Invalid or expired access token', 401));
  }
};
