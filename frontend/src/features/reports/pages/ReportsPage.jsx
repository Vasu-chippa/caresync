import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useReports, useUploadReport, useDownloadReport } from '../hooks';

const Motion = motion;

export const ReportsPage = () => {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    reportType: 'lab',
    patientId: '',
    doctorId: '',
    appointmentId: '',
  });
  const [feedback, setFeedback] = useState('');

  const listParams = useMemo(() => ({ page: 1, limit: 10 }), []);
  const reportsQuery = useReports(listParams);
  const uploadMutation = useUploadReport();
  const downloadMutation = useDownloadReport();

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onUpload = async () => {
    if (!file) {
      setFeedback('Please select a file to upload.');
      return;
    }

    setFeedback('');

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('title', form.title);
      payload.append('reportType', form.reportType);
      if (form.patientId) payload.append('patientId', form.patientId);
      if (form.doctorId) payload.append('doctorId', form.doctorId);
      if (form.appointmentId) payload.append('appointmentId', form.appointmentId);

      await uploadMutation.mutateAsync(payload);
      setFeedback('Report uploaded successfully.');
      setFile(null);
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const onDownload = async (reportId, fileName) => {
    setFeedback('');
    try {
      await downloadMutation.mutateAsync({ reportId, fileName });
    } catch (error) {
      setFeedback(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">Reports</h1>
        <p className="text-sm text-(--text-soft)">Upload and download clinical reports securely.</p>
      </header>

      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-2"
      >
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-(--text-soft)">Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-(--text-soft)">Report Type</span>
          <select
            value={form.reportType}
            onChange={(event) => updateField('reportType', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          >
            <option value="lab">Lab</option>
            <option value="radiology">Radiology</option>
            <option value="discharge">Discharge</option>
            <option value="clinical">Clinical</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-(--text-soft)">Patient ID</span>
          <input
            value={form.patientId}
            onChange={(event) => updateField('patientId', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-(--text-soft)">Doctor ID</span>
          <input
            value={form.doctorId}
            onChange={(event) => updateField('doctorId', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-(--text-soft)">Appointment ID</span>
          <input
            value={form.appointmentId}
            onChange={(event) => updateField('appointmentId', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-(--text-soft)">File (PDF, PNG, JPEG)</span>
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-(--border) px-3 py-2 text-sm"
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={onUpload}
            disabled={uploadMutation.isPending}
            className="w-full rounded-lg bg-(--brand) px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Report'}
          </button>
        </div>
      </Motion.div>

      {feedback ? (
        <div className="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-soft)">
          {feedback}
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <h2 className="text-lg font-semibold text-(--text-strong)">Recent Reports</h2>

        {reportsQuery.isLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded-lg bg-(--surface-muted)" />
            ))}
          </div>
        ) : reportsQuery.isError ? (
          <p className="mt-2 text-sm text-red-700">{reportsQuery.error.message}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {reportsQuery.data?.items?.map((item) => (
              <div key={item.reportId} className="rounded-lg border border-(--border) px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-(--text-strong)">{item.title}</p>
                  <button
                    type="button"
                    onClick={() => onDownload(item.reportId, item.originalName)}
                    disabled={downloadMutation.isPending}
                    className="rounded-md border border-(--border) px-2 py-1 text-xs"
                  >
                    Download
                  </button>
                </div>
                <p>{item.reportType} • {item.originalName}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};
