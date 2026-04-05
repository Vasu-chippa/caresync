import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMe } from '../../auth/hooks';
import { useCreatePrescription, usePrescriptionList, useUpdatePrescription } from '../hooks';
import { PatientPrescriptionsPage } from './PatientPrescriptionsPage';

const Motion = motion;
const MEDICINE_SUGGESTIONS = [
  'Paracetamol',
  'Ibuprofen',
  'Azithromycin',
  'Amoxicillin',
  'Cetirizine',
  'Pantoprazole',
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Omeprazole',
  'Dolo 650',
  'Vitamin D3',
];

export const PrescriptionsPage = () => {
  const meQuery = useMe();
  const [searchParams] = useSearchParams();
  const appointmentIdFromQuery = searchParams.get('appointmentId') || '';
  const patientIdFromQuery = searchParams.get('patientId') || '';

  const me = meQuery.data;
  const defaultDoctorId = me?.role === 'doctor' ? String(me.id) : '';

  const [form, setForm] = useState({
    appointmentId: appointmentIdFromQuery,
    patientId: patientIdFromQuery,
    doctorId: defaultDoctorId,
    diagnosis: '',
    advice: '',
    medicines: [
      {
        medicine: '',
        dosage: '',
        frequency: '',
        durationDays: 5,
        time: '',
        notes: '',
      },
    ],
  });
  const [feedback, setFeedback] = useState('');
  const [editingPrescriptionId, setEditingPrescriptionId] = useState('');

  const params = useMemo(() => ({ page: 1, limit: 10 }), []);
  const listQuery = usePrescriptionList(params);
  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();

  if (meQuery.isLoading) {
    return <div className="p-4 text-sm text-(--text-soft)">Loading prescriptions...</div>;
  }

  if (meQuery.data?.role === 'patient') {
    return <PatientPrescriptionsPage />;
  }

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMedicineField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => (i === index ? { ...medicine, [key]: value } : medicine)),
    }));
  };

  const addMedicineRow = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicine: '',
          dosage: '',
          frequency: '',
          durationDays: 5,
          time: '',
          notes: '',
        },
      ],
    }));
  };

  const removeMedicineRow = (index) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const onCreate = async () => {
    setFeedback('');

    const resolvedDoctorId = (form.doctorId || (me?.role === 'doctor' ? me.id : '') || '').trim();

    if (!editingPrescriptionId) {
      if (!form.appointmentId.trim()) {
        setFeedback('Appointment ID is required to create a prescription.');
        return;
      }

      if (!form.patientId.trim()) {
        setFeedback('Patient ID is required to create a prescription.');
        return;
      }

      const duplicate = (listQuery.data?.items || []).find(
        (item) => String(item.appointmentId) === String(form.appointmentId.trim())
      );
      if (duplicate) {
        setFeedback('A prescription already exists for this appointment. Open it in edit mode instead.');
        return;
      }
    }

    if (!form.diagnosis.trim()) {
      setFeedback('Diagnosis is required.');
      return;
    }

    const normalizedMedicines = form.medicines.map((medicine) => ({
      medicine: medicine.medicine.trim(),
      dosage: medicine.dosage.trim(),
      frequency: medicine.frequency.trim(),
      durationDays: Number(medicine.durationDays),
      time: medicine.time || '',
      notes: medicine.notes?.trim() || '',
    }));

    const medicinesForSubmit = normalizedMedicines.filter((medicine) =>
      medicine.medicine || medicine.dosage || medicine.frequency || medicine.notes || medicine.time
    );

    if (medicinesForSubmit.length === 0) {
      setFeedback('At least one medicine is required.');
      return;
    }

    const invalidMedicine = medicinesForSubmit.find(
      (medicine) => !medicine.medicine || !medicine.dosage || !medicine.frequency || !Number.isFinite(medicine.durationDays) || medicine.durationDays < 1
    );

    if (invalidMedicine) {
      setFeedback('Each medicine must include name, dosage, frequency and valid duration days.');
      return;
    }

    try {
      const payload = {
        diagnosis: form.diagnosis.trim(),
        medicines: medicinesForSubmit.map((medicine) => ({
          medicine: medicine.medicine,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          durationDays: medicine.durationDays,
          time: medicine.time || undefined,
          notes: medicine.notes || undefined,
        })),
        advice: form.advice?.trim() || undefined,
      };

      if (editingPrescriptionId) {
        await updateMutation.mutateAsync({
          prescriptionId: editingPrescriptionId,
          payload,
        });
        setFeedback('Prescription updated successfully.');
      } else {
        await createMutation.mutateAsync({
          appointmentId: form.appointmentId.trim(),
          patientId: form.patientId.trim(),
          doctorId: resolvedDoctorId,
          ...payload,
        });
        setFeedback('Prescription created successfully.');
      }

      setForm((prev) => ({
        appointmentId: prev.appointmentId,
        patientId: prev.patientId,
        doctorId: prev.doctorId,
        diagnosis: '',
        advice: '',
        medicines: [
          {
            medicine: '',
            dosage: '',
            frequency: '',
            durationDays: 5,
            time: '',
            notes: '',
          },
        ],
      }));
      setEditingPrescriptionId('');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const startEdit = (item) => {
    setEditingPrescriptionId(item.prescriptionId);
    setFeedback('');
    setForm({
      appointmentId: item.appointmentId || '',
      patientId: String(item.patientId || ''),
      doctorId: String(item.doctorId || ''),
      diagnosis: item.diagnosis || '',
      advice: item.advice || '',
      medicines: (item.medicines || []).map((medicine) => ({
        medicine: medicine.medicine || '',
        dosage: medicine.dosage || '',
        frequency: medicine.frequency || '',
        durationDays: medicine.durationDays || 5,
        time: medicine.time || '',
        notes: medicine.notes || '',
      })),
    });
  };

  const cancelEdit = () => {
    setEditingPrescriptionId('');
    setFeedback('Edit cancelled.');
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">Prescriptions</h1>
        <p className="text-sm text-(--text-soft)">Doctor and admin can create prescriptions.</p>
      </header>

      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-2xl border border-(--border) bg-(--surface) p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-(--text-soft)">Appointment ID</span>
            <input
              value={form.appointmentId}
              onChange={(event) => updateField('appointmentId', event.target.value)}
              disabled={Boolean(editingPrescriptionId)}
              className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-(--text-soft)">Patient ID</span>
            <input
              value={form.patientId}
              onChange={(event) => updateField('patientId', event.target.value)}
              disabled={Boolean(editingPrescriptionId)}
              className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-(--text-soft)">Doctor ID</span>
            <input
              value={form.doctorId}
              onChange={(event) => updateField('doctorId', event.target.value)}
              disabled={me?.role === 'doctor' || Boolean(editingPrescriptionId)}
              className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong) disabled:opacity-60"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-(--text-soft)">Diagnosis</span>
            <input
              value={form.diagnosis}
              onChange={(event) => updateField('diagnosis', event.target.value)}
              className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-(--text-strong)">Medicines</h3>
            <button
              type="button"
              onClick={addMedicineRow}
              className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100"
            >
              Add Medicine
            </button>
          </div>

          {form.medicines.map((medicine, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-(--border) bg-(--surface-muted) p-3 md:grid-cols-3">
              <label className="text-xs">
                <span className="mb-1 block text-(--text-soft)">Medicine Name</span>
                <input
                  list="medicine-suggestions"
                  value={medicine.medicine}
                  onChange={(event) => updateMedicineField(index, 'medicine', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-(--text-soft)">Dosage</span>
                <input
                  value={medicine.dosage}
                  onChange={(event) => updateMedicineField(index, 'dosage', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-(--text-soft)">Frequency</span>
                <input
                  value={medicine.frequency}
                  onChange={(event) => updateMedicineField(index, 'frequency', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-(--text-soft)">Duration (Days)</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={medicine.durationDays}
                  onChange={(event) => updateMedicineField(index, 'durationDays', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-(--text-soft)">Reminder Time (HH:mm)</span>
                <input
                  type="time"
                  value={medicine.time}
                  onChange={(event) => updateMedicineField(index, 'time', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>
              <label className="text-xs md:col-span-1">
                <span className="mb-1 block text-(--text-soft)">Notes</span>
                <input
                  value={medicine.notes}
                  onChange={(event) => updateMedicineField(index, 'notes', event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-transparent px-2 py-2 text-(--text-strong)"
                />
              </label>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeMedicineRow(index)}
                  disabled={form.medicines.length === 1}
                  className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <datalist id="medicine-suggestions">
            {MEDICINE_SUGGESTIONS.map((medicine) => (
              <option key={medicine} value={medicine} />
            ))}
          </datalist>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-(--text-soft)">Doctor Advice</span>
          <textarea
            rows={3}
            value={form.advice}
            onChange={(event) => updateField('advice', event.target.value)}
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-(--text-strong)"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onCreate}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full rounded-lg bg-(--brand) px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : editingPrescriptionId
                ? 'Update Prescription'
                : 'Create Prescription'}
          </button>
        </div>

        {editingPrescriptionId ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="w-full rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200"
          >
            Cancel Edit
          </button>
        ) : null}
      </Motion.div>

      {feedback ? (
        <div className="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-soft)">
          {feedback}
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--border) bg-(--surface) p-4">
        <h2 className="text-lg font-semibold text-(--text-strong)">Recent Prescriptions</h2>

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
              <div key={item.prescriptionId} className="rounded-lg border border-(--border) px-3 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-(--text-strong)">{item.prescriptionId}</p>
                    <p className="text-(--text-soft)">{item.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-(--text-soft)">{new Date(item.createdAt).toLocaleString()}</p>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};
