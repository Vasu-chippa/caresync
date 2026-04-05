import { apiClient } from '../../api/client';

export const reportsApi = {
  uploadReport(formData) {
    return apiClient
      .post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data.data);
  },

  listReports(params) {
    return apiClient.get('/reports', { params }).then((res) => ({
      items: res.data.data,
      meta: res.data.meta,
    }));
  },

  async downloadReport(reportId, fallbackFileName = 'report') {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });

    const fileNameHeader = response.headers['content-disposition'];
    const matched = fileNameHeader?.match(/filename="?([^";]+)"?/i);
    const fileName = matched?.[1] || fallbackFileName;

    const url = window.URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },
};
