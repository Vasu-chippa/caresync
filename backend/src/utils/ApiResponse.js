export class ApiResponse {
  static success(res, data = null, message = 'Success', meta = undefined, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
      error: null,
    });
  }

  static error(res, message = 'Request failed', statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      meta: null,
      error: details,
    });
  }
}
