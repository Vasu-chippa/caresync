import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

const getSessionMeta = (req) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'] || null,
});

const setRefreshCookie = (res, refreshToken, ttlSeconds) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ttlSeconds * 1000,
    path: '/api/v1/auth',
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
};

export const authController = {
  status: asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      {
        module: 'auth',
        ready: true,
      },
      'Auth module is available'
    );
  }),

  requestRegisterOtp: asyncHandler(async (req, res) => {
    const data = await authService.requestRegisterOtp(req.body);
    return ApiResponse.success(res, data, 'OTP sent successfully', null, 202);
  }),

  verifyRegisterOtp: asyncHandler(async (req, res) => {
    const data = await authService.verifyRegisterOtpAndCreateUser(req.body);
    return ApiResponse.success(res, data, 'Account created successfully', null, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const data = await authService.login({
      ...req.body,
      sessionMeta: getSessionMeta(req),
    });

    setRefreshCookie(res, data.tokens.refreshToken, data.tokens.refreshTokenExpiresInSeconds);

    const response = {
      user: data.user,
      tokens: {
        accessToken: data.tokens.accessToken,
        sessionId: data.tokens.sessionId,
        refreshTokenExpiresInSeconds: data.tokens.refreshTokenExpiresInSeconds,
      },
    };

    return ApiResponse.success(res, response, 'Login successful');
  }),

  refresh: asyncHandler(async (req, res) => {
    const data = await authService.refreshSession({
      refreshToken: req.cookies?.refreshToken || req.body?.refreshToken,
      sessionMeta: getSessionMeta(req),
    });

    setRefreshCookie(res, data.tokens.refreshToken, data.tokens.refreshTokenExpiresInSeconds);

    return ApiResponse.success(
      res,
      {
        tokens: {
          accessToken: data.tokens.accessToken,
          sessionId: data.tokens.sessionId,
          refreshTokenExpiresInSeconds: data.tokens.refreshTokenExpiresInSeconds,
        },
      },
      'Session refreshed'
    );
  }),

  logout: asyncHandler(async (req, res) => {
    const data = await authService.logout({
      refreshToken: req.cookies?.refreshToken || req.body?.refreshToken,
    });

    clearRefreshCookie(res);

    return ApiResponse.success(res, data, 'Logged out successfully');
  }),

  me: asyncHandler(async (req, res) => {
    const data = await authService.getMe(req.auth);
    return ApiResponse.success(res, data, 'Current user profile fetched');
  }),

  updateMe: asyncHandler(async (req, res) => {
    const data = await authService.updateMe({
      auth: req.auth,
      payload: req.body,
      file: req.file,
    });

    return ApiResponse.success(res, data, 'Profile updated successfully');
  }),

  listSessions: asyncHandler(async (req, res) => {
    const data = await authService.listMySessions(req.auth);
    return ApiResponse.success(res, data, 'Active sessions fetched');
  }),

  revokeSession: asyncHandler(async (req, res) => {
    const data = await authService.revokeMySession(req.auth, req.body.sessionId);

    return ApiResponse.success(res, data, 'Session revoked');
  }),

  requestForgotPasswordOtp: asyncHandler(async (req, res) => {
    const data = await authService.requestForgotPasswordOtp(req.body);
    return ApiResponse.success(res, data, 'Password reset OTP sent', null, 202);
  }),

  verifyForgotPasswordOtp: asyncHandler(async (req, res) => {
    const data = await authService.verifyForgotPasswordOtp(req.body);
    return ApiResponse.success(res, data, 'OTP verified successfully');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const data = await authService.resetPassword(req.body);
    return ApiResponse.success(res, data, 'Password reset successful');
  }),
};
