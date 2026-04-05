import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Droplets, PencilLine, ShieldAlert, Stethoscope, UserRound } from 'lucide-react';
import { useMe } from '../../auth/hooks';

const patients = [
  {
    id: 'PAT-201',
    name: 'Riya Patel',
    age: 32,
    gender: 'female',
    bloodGroup: 'A+',
    lastVisit: '2026-03-30',
    doctor: 'Dr. Maya Sharma',
    risk: 'medium',
  },
  {
    id: 'PAT-202',
    name: 'Rahul Joshi',
    age: 45,
    gender: 'male',
    bloodGroup: 'O+',
    lastVisit: '2026-03-29',
    doctor: 'Dr. Arjun Mehta',
    risk: 'low',
  },
  {
    id: 'PAT-203',
    name: 'Meena Das',
    age: 61,
    gender: 'female',
    bloodGroup: 'B-',
    lastVisit: '2026-03-28',
    doctor: 'Dr. Nidhi Verma',
    risk: 'high',
  },
  {
    id: 'PAT-204',
    name: 'Aman Roy',
    age: 27,
    gender: 'male',
    bloodGroup: 'AB+',
    lastVisit: '2026-03-27',
    doctor: 'Dr. Karan Singh',
    risk: 'low',
  },
  {
    id: 'PAT-205',
    name: 'Sara Khan',
    age: 39,
    gender: 'female',
    bloodGroup: 'O-',
    lastVisit: '2026-03-25',
    doctor: 'Dr. Maya Sharma',
    risk: 'medium',
  },
];

const Motion = motion;

export const PatientsPage = () => {
  const meQuery = useMe();
  const role = meQuery.data?.role;
  const canEditPatient = role === 'doctor';

  const [patientRecords, setPatientRecords] = useState(patients);
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [draft, setDraft] = useState(patients[0] || null);
  const [saveMessage, setSaveMessage] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return patientRecords.filter((patient) => {
      const matchesQuery =
        !normalizedQuery ||
        patient.name.toLowerCase().includes(normalizedQuery) ||
        patient.id.toLowerCase().includes(normalizedQuery);

      const matchesRisk = risk === 'all' || patient.risk === risk;

      return matchesQuery && matchesRisk;
    });
  }, [patientRecords, query, risk]);

  const hasSelectedPatientVisible = useMemo(
    () => filtered.some((item) => item.id === selectedPatientId),
    [filtered, selectedPatientId]
  );

  const riskCounts = useMemo(
    () => ({
      high: patientRecords.filter((patient) => patient.risk === 'high').length,
      medium: patientRecords.filter((patient) => patient.risk === 'medium').length,
      low: patientRecords.filter((patient) => patient.risk === 'low').length,
    }),
    [patientRecords]
  );

  const selectPatient = (patient) => {
    setSelectedPatientId(patient.id);
    setDraft(patient);
    setSaveMessage('');
  };

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const savePatientChanges = (event) => {
    event.preventDefault();
    if (!draft) {
      return;
    }

    setPatientRecords((current) => current.map((item) => (item.id === draft.id ? { ...draft } : item)));
    setSaveMessage('Patient details updated successfully.');
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">Patients Registry</h1>
        <p className="mt-1 text-sm text-(--text-soft)">
          Review patient profiles, risk level, and recent clinical activity.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Total Patients</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{patientRecords.length}</p>
        </div>
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">High Risk</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{riskCounts.high}</p>
        </div>
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Medium Risk</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{riskCounts.medium}</p>
        </div>
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Low Risk</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{riskCounts.low}</p>
        </div>
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-[2fr_1fr]"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient by name or ID"
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        />

        <select
          value={risk}
          onChange={(event) => setRisk(event.target.value)}
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        >
          <option value="all">All Risk Levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </Motion.div>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.1fr]">
        <div className="space-y-3">
          {filtered.map((patient, index) => {
            const isSelected = patient.id === selectedPatientId;
            return (
              <Motion.button
                type="button"
                key={patient.id}
                onClick={() => selectPatient(patient)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: index * 0.025 }}
                className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-300/40 bg-linear-to-r from-cyan-500/15 to-blue-500/10 shadow-[0_0_22px_rgba(34,211,238,0.2)]'
                    : 'border-(--border) bg-(--surface) hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_0_16px_rgba(14,165,233,0.16)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <UserRound size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-(--text-strong)">{patient.name}</h2>
                      <p className="text-xs text-(--text-soft)">{patient.id}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                      patient.risk === 'high'
                        ? 'bg-red-500/20 text-red-200'
                        : patient.risk === 'medium'
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-emerald-500/20 text-emerald-200'
                    }`}
                  >
                    {patient.risk}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p className="inline-flex items-center gap-1"><Droplets size={12} className="text-cyan-300" /> {patient.bloodGroup}</p>
                  <p className="capitalize">{patient.gender}, {patient.age}y</p>
                  <p className="inline-flex items-center gap-1"><CalendarClock size={12} className="text-cyan-300" /> {patient.lastVisit}</p>
                  <p className="inline-flex items-center gap-1"><Stethoscope size={12} className="text-cyan-300" /> {patient.doctor}</p>
                </div>
              </Motion.button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-4 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
          {draft && hasSelectedPatientVisible ? (
            <form className="space-y-3" onSubmit={savePatientChanges}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Patient Details</h2>
                {canEditPatient ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-200">
                    <PencilLine size={12} /> Editable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                    <ShieldAlert size={12} /> Read only
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Patient ID</span>
                  <input
                    value={draft.id}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-slate-800/40 px-3 py-2 text-slate-300"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Age</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.age}
                    onChange={(event) => updateField('age', Number(event.target.value || 0))}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Gender</span>
                  <select
                    value={draft.gender}
                    onChange={(event) => updateField('gender', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Blood Group</span>
                  <input
                    value={draft.bloodGroup}
                    onChange={(event) => updateField('bloodGroup', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-slate-300">Last Visit</span>
                  <input
                    type="date"
                    value={draft.lastVisit}
                    onChange={(event) => updateField('lastVisit', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  />
                </label>

                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-slate-300">Primary Doctor</span>
                  <input
                    value={draft.doctor}
                    onChange={(event) => updateField('doctor', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  />
                </label>

                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-slate-300">Risk Level</span>
                  <select
                    value={draft.risk}
                    onChange={(event) => updateField('risk', event.target.value)}
                    disabled={!canEditPatient}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/65 px-3 py-2 text-slate-100 disabled:opacity-70"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
              </div>

              {saveMessage ? <p className="text-sm text-emerald-300">{saveMessage}</p> : null}

              {canEditPatient ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.28)] transition hover:brightness-105"
                >
                  <PencilLine size={15} />
                  Save Changes
                </button>
              ) : null}
            </form>
          ) : (
            <div className="rounded-xl border border-white/10 bg-slate-800/40 px-3 py-10 text-center text-sm text-slate-300">
              Select a patient card to view details.
            </div>
          )}
        </div>
      </section>

      {!filtered.length ? (
        <p className="rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-soft)">
          No patients match current filters.
        </p>
      ) : null}
    </section>
  );
};
