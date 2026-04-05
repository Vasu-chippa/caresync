import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prescriptionService } from './prescription.service.js';

export const prescriptionController = {
  create: asyncHandler(async (req, res) => {
    const data = await prescriptionService.create({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Prescription created', null, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const data = await prescriptionService.update({
      auth: req.auth,
      prescriptionId: req.params.prescriptionId,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Prescription updated', null, 200);
  }),

  list: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;

    const data = await prescriptionService.list({
      auth: req.auth,
      query,
    });

    return ApiResponse.success(res, data.items, 'Prescriptions fetched', data.meta);
  }),

  recordAdherence: asyncHandler(async (req, res) => {
    const data = await prescriptionService.recordAdherence({
      auth: req.auth,
      prescriptionId: req.params.prescriptionId,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Adherence recorded', null, 200);
  }),

  downloadPDF: asyncHandler(async (req, res) => {
    const pdfBuffer = await prescriptionService.downloadPrescriptionPDF({
      auth: req.auth,
      prescriptionId: req.params.prescriptionId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescription_${req.params.prescriptionId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  }),
};
