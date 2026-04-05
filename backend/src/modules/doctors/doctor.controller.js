import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { doctorService } from './doctor.service.js';

export const doctorController = {
  list: asyncHandler(async (_req, res) => {
    const data = await doctorService.listDoctors();
    return ApiResponse.success(res, data.items, 'Doctors fetched');
  }),

  me: asyncHandler(async (req, res) => {
    const data = await doctorService.getMyProfile(req.auth.userId);
    return ApiResponse.success(res, data, 'Doctor profile fetched');
  }),

  updateMe: asyncHandler(async (req, res) => {
    const data = await doctorService.updateMyProfile({
      userId: req.auth.userId,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Doctor profile updated');
  }),
};
