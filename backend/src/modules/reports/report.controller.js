import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { reportService } from './report.service.js';
import { getReportFilePath } from './storage.service.js';

export const reportController = {
  upload: asyncHandler(async (req, res) => {
    const data = await reportService.upload({
      auth: req.auth,
      payload: req.body,
      file: req.file,
    });

    return ApiResponse.success(res, data, 'Report uploaded', null, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const query = req.validatedQuery || req.query;

    const data = await reportService.list({
      auth: req.auth,
      query,
    });

    return ApiResponse.success(res, data.items, 'Reports fetched', data.meta);
  }),

  download: asyncHandler(async (req, res) => {
    const report = await reportService.getForDownload({
      auth: req.auth,
      reportId: req.params.reportId,
    });

    if (report.fileUrl) {
      res.setHeader('Content-Disposition', `attachment; filename="${report.originalName}"`);
      return res.redirect(report.fileUrl);
    }

    const filePath = getReportFilePath(report.fileName);

    return res.download(filePath, report.originalName);
  }),
};
