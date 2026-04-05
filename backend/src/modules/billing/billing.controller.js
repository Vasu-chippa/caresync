import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { billingService } from './billing.service.js';

export const billingController = {
  createInvoice: asyncHandler(async (req, res) => {
    const data = await billingService.createInvoice({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Invoice created', null, 201);
  }),

  listInvoices: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;

    const data = await billingService.listInvoices({
      auth: req.auth,
      query,
    });

    return ApiResponse.success(res, data.items, 'Invoices fetched', data.meta);
  }),

  markPaid: asyncHandler(async (req, res) => {
    const data = await billingService.markPaid({
      auth: req.auth,
      payload: req.body,
    });

    return ApiResponse.success(res, data, 'Invoice updated');
  }),
};
