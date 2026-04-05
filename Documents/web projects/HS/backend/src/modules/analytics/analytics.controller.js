import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  admin: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;
    const data = await analyticsService.getAdminAnalytics({
      days: Number(query.days || 14),
    });

    return ApiResponse.success(res, data, 'Admin analytics fetched');
  }),

  doctor: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;
    const data = await analyticsService.getDoctorAnalytics({
      doctorId: new mongoose.Types.ObjectId(req.auth.userId),
      days: Number(query.days || 14),
    });

    return ApiResponse.success(res, data, 'Doctor analytics fetched');
  }),

  adminEarnings: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;
    const data = await analyticsService.getAdminEarnings({
      days: Number(query.days || 30),
    });

    return ApiResponse.success(res, data, 'Admin earnings fetched');
  }),
};
