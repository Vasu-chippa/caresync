import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { appointmentService } from './appointment.service.js';

export const appointmentController = {
  getAvailability: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;

    const data = await appointmentService.getDoctorAvailability({
      doctorId: query.doctorId,
      date: query.date,
    });

    return ApiResponse.success(res, data, 'Availability fetched');
  }),

  book: asyncHandler(async (req, res) => {
    const data = await appointmentService.book({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Appointment booked', null, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;

    const data = await appointmentService.list({
      auth: req.auth,
      query,
    });

    return ApiResponse.success(res, data.items, 'Appointments fetched', data.meta);
  }),

  reschedule: asyncHandler(async (req, res) => {
    const data = await appointmentService.reschedule({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Appointment rescheduled');
  }),

  respond: asyncHandler(async (req, res) => {
    const data = await appointmentService.respond({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Appointment decision saved');
  }),

  cancel: asyncHandler(async (req, res) => {
    const data = await appointmentService.cancel({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Appointment cancelled');
  }),
};
