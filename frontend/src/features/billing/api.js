import { apiClient } from '../../api/client';

export const billingApi = {
  createInvoice(payload) {
    return apiClient.post('/billing/invoices', payload).then((res) => res.data.data);
  },
  listInvoices(params) {
    return apiClient.get('/billing/invoices', { params }).then((res) => ({
      items: res.data.data,
      meta: res.data.meta,
    }));
  },
  markPaid(payload) {
    return apiClient.patch('/billing/invoices/pay', payload).then((res) => res.data.data);
  },
};
