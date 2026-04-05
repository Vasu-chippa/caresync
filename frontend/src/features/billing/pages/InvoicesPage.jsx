import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMe } from '../../auth/hooks';
import { useCreateInvoice, useInvoices, useMarkInvoicePaid } from '../hooks';

const Motion = motion;

export const InvoicesPage = () => {
  const meQuery = useMe();
  const role = meQuery.data?.role;
  const [form, setForm] = useState({
    appointmentId: '',
    patientId: '',
    doctorId: '',
    amount: '',
    currency: 'INR',
  });
  const [feedback, setFeedback] = useState('');
  const [paymentMethods, setPaymentMethods] = useState({});
  const [transactionRefs, setTransactionRefs] = useState({});
  const inrFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const params = useMemo(() => ({ page: 1, limit: 10 }), []);
  const listQuery = useInvoices(params);
  const createMutation = useCreateInvoice();
  const payMutation = useMarkInvoicePaid();

  if (meQuery.isLoading) {
    return <div className="rounded-2xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-soft)">Loading billing...</div>;
  }

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onCreate = async () => {
    setFeedback('');

    try {
      await createMutation.mutateAsync({
        appointmentId: form.appointmentId,
        patientId: form.patientId,
        doctorId: form.doctorId,
        amount: Number(form.amount),
        currency: form.currency,
      });

      setFeedback('Invoice created successfully.');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const onMarkPaid = async (invoiceId) => {
    setFeedback('');

    const paymentMethod = paymentMethods[invoiceId] || (role === 'patient' ? 'upi' : undefined);
    const transactionRef = transactionRefs[invoiceId] || undefined;

    try {
      await payMutation.mutateAsync({ invoiceId, paymentMethod, transactionRef });
      setFeedback('Payment successful. Invoice marked as paid to company wallet.');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">{role === 'patient' ? 'My Appointment Bills' : 'Billing Invoices'}</h1>
        <p className="text-sm text-(--text-soft)">
          {role === 'patient'
            ? 'View appointment charges and pay only your own bills.'
            : 'Create invoices and track payments.'}
        </p>
      </header>

      {role !== 'patient' ? (
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-2"
        >
          {[
            ['appointmentId', 'Appointment ID'],
            ['patientId', 'Patient ID'],
            ['doctorId', 'Doctor ID'],
            ['amount', 'Amount'],
            ['currency', 'Currency'],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="mb-1 block text-(--text-soft)">{label}</span>
              <input
                value={form[key]}
                onChange={(event) => updateField(key, event.target.value)}
                className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
              />
            </label>
          ))}

          <div className="flex items-end">
            <button
              type="button"
              onClick={onCreate}
              disabled={createMutation.isPending}
              className="w-full rounded-lg bg-(--brand) px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving...' : 'Create Invoice'}
            </button>
          </div>
        </Motion.div>
      ) : null}

      {feedback ? (
        <div className="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-soft)">
          {feedback}
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <h2 className="text-lg font-semibold text-(--text-strong)">Recent Invoices</h2>
        {listQuery.isLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded-lg bg-(--surface-muted)" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <p className="mt-2 text-sm text-red-700">{listQuery.error.message}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {listQuery.data?.items?.map((item) => (
              <div key={item.invoiceId} className="rounded-lg border border-(--border) px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-(--text-strong)">{item.invoiceId}</p>
                  <button
                    type="button"
                    onClick={() => onMarkPaid(item.invoiceId)}
                    disabled={item.paymentStatus === 'paid' || payMutation.isPending}
                    className="rounded-md border border-(--border) px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {item.paymentStatus === 'paid' ? 'Paid' : role === 'patient' ? 'Pay Company' : 'Mark Paid'}
                  </button>
                </div>
                <p>Amount: {item.currency === 'INR' ? inrFormatter.format(item.amount) : `${item.amount} ${item.currency}`}</p>
                <p>Platform Commission: {item.currency === 'INR' ? inrFormatter.format(item.platformCommissionAmount || 0) : `${item.platformCommissionAmount || 0} ${item.currency}`}</p>
                <p>Doctor Payout: {item.currency === 'INR' ? inrFormatter.format(item.doctorPayoutAmount || 0) : `${item.doctorPayoutAmount || 0} ${item.currency}`}</p>
                <p>Status: {item.paymentStatus}</p>
                {item.paymentStatus !== 'paid' && role === 'patient' ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label className="text-xs">
                      <span className="mb-1 block text-(--text-soft)">Payment Method</span>
                      <select
                        value={paymentMethods[item.invoiceId] || 'upi'}
                        onChange={(event) =>
                          setPaymentMethods((prev) => ({
                            ...prev,
                            [item.invoiceId]: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-(--border) bg-transparent px-2 py-1"
                      >
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="netbanking">Net Banking</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    </label>
                    <label className="text-xs">
                      <span className="mb-1 block text-(--text-soft)">Transaction Ref (optional)</span>
                      <input
                        value={transactionRefs[item.invoiceId] || ''}
                        onChange={(event) =>
                          setTransactionRefs((prev) => ({
                            ...prev,
                            [item.invoiceId]: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-(--border) bg-transparent px-2 py-1"
                        placeholder="UPI/Bank reference"
                      />
                    </label>
                  </div>
                ) : null}
                {item.paymentStatus === 'paid' && item.paymentMethod ? (
                  <p className="text-xs text-(--text-soft)">Paid via: {item.paymentMethod}{item.transactionRef ? ` (${item.transactionRef})` : ''}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};
