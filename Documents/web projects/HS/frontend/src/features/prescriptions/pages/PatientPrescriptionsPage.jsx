import { useMemo } from 'react';
import { Pill, Calendar, Clock, FileText, User, Stethoscope } from 'lucide-react';
import { usePrescriptionList } from '../hooks';

export const PatientPrescriptionsPage = () => {
  const params = useMemo(() => ({ page: 1, limit: 20 }), []);
  const listQuery = usePrescriptionList(params);

  if (listQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-lg bg-(--surface-muted)" />
        ))}
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-700">
        Failed to load prescriptions: {listQuery.error.message}
      </div>
    );
  }

  const prescriptions = listQuery.data?.items || [];

  if (!prescriptions.length) {
    return (
      <div className="rounded-lg border border-(--border) bg-(--surface) px-6 py-12 text-center">
        <Pill className="mx-auto h-12 w-12 text-(--text-soft) mb-3" />
        <p className="text-(--text-soft)">No prescriptions yet. Your doctor will add them here.</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">My Prescriptions</h1>
        <p className="mt-1 text-sm text-(--text-soft)">
          View the medication name, dosage, frequency, and when it was prescribed.
        </p>
      </header>

      <div className="space-y-3">
        {prescriptions.map((prescription) => (
          <article key={prescription.prescriptionId} className="rounded-xl border border-(--border) bg-(--surface) p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--border) pb-3">
              <div>
                <h2 className="text-lg font-semibold text-(--text-strong)">{prescription.diagnosis}</h2>
                <p className="mt-1 text-sm text-(--text-soft)">Prescription ID: {prescription.prescriptionId}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-(--text-soft)">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(prescription.createdAt).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(prescription.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {prescription.medicines.map((medicine, index) => (
                <div key={`${prescription.prescriptionId}-${index}`} className="rounded-lg border border-(--border) bg-black/20 p-3">
                  <h3 className="font-medium text-(--text-strong) flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-cyan-300" />
                    {medicine.medicine}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-(--text-soft)">
                    <p className="inline-flex items-center gap-2"><Pill className="h-4 w-4 text-blue-300" /> Dosage: {medicine.dosage || '-'}</p>
                    <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-300" /> Frequency: {medicine.frequency || '-'}</p>
                    <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-300" /> Time: {medicine.time || 'Not specified'}</p>
                    <p className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-300" /> Duration: {medicine.durationDays || '-'} days</p>
                  </div>
                  {medicine.notes ? <p className="mt-2 text-xs text-(--text-soft) italic">Notes: {medicine.notes}</p> : null}
                </div>
              ))}
            </div>

            {prescription.advice ? (
              <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-muted) p-3 text-sm text-(--text-soft)">
                <p className="mb-1 font-medium text-(--text-strong) flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-300" /> Doctor Advice
                </p>
                <p>{prescription.advice}</p>
              </div>
            ) : null}

          </article>
        ))}
      </div>
    </section>
  );
};
