import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '../../dashboard/components/DashboardSkeleton';
import { useDoctors } from '../../doctors/hooks';

const Motion = motion;

export const DoctorsPage = () => {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [status, setStatus] = useState('all');
  const doctorsQuery = useDoctors();

  const doctors = useMemo(() => doctorsQuery.data || [], [doctorsQuery.data]);

  const specialties = useMemo(
    () => ['all', ...Array.from(new Set(doctors.map((doctor) => doctor.specialization || doctor.specialty).filter(Boolean)))],
    [doctors]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const doctorId = String(doctor.id || doctor._id || '');
      const doctorSpecialty = doctor.specialization || doctor.specialty || '';
      const doctorStatus = doctor.status || (doctor.isVerified ? 'active' : 'inactive');

      const matchesQuery =
        !normalizedQuery ||
        doctor.name?.toLowerCase().includes(normalizedQuery) ||
        doctorId.toLowerCase().includes(normalizedQuery);

      const matchesSpecialty = specialty === 'all' || doctorSpecialty === specialty;
      const matchesStatus = status === 'all' || doctorStatus === status;

      return matchesQuery && matchesSpecialty && matchesStatus;
    });
  }, [doctors, query, specialty, status]);

  const activeCount = doctors.filter((doctor) => (doctor.status || (doctor.isVerified ? 'active' : 'inactive')) === 'active').length;

  if (doctorsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (doctorsQuery.isError) {
    return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{doctorsQuery.error.message}</div>;
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-(--text-strong)">Doctors Directory</h1>
        <p className="mt-1 text-sm text-(--text-soft)">
          Browse specialists, track availability, and manage assignment readiness.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Total Doctors</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{doctors.length}</p>
        </div>
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Active Doctors</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
          <p className="text-sm text-(--text-soft)">Specialties</p>
          <p className="mt-1 text-2xl font-semibold text-(--text-strong)">{specialties.length - 1}</p>
        </div>
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 md:grid-cols-3"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search doctor by name or ID"
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        />

        <select
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        >
          {specialties.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'All Specialties' : item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
      </Motion.div>

      <section className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-(--surface-muted) text-left text-(--text-soft)">
              <tr>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Next Available</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doctor) => (
                <tr key={doctor.id || doctor._id} className="border-t border-(--border)">
                  <td className="px-4 py-3">
                    <p className="font-medium text-(--text-strong)">{doctor.name}</p>
                    <p className="text-xs text-(--text-soft)">{doctor.id || doctor._id}</p>
                  </td>
                  <td className="px-4 py-3">{doctor.specialization || doctor.specialty || 'General'}</td>
                  <td className="px-4 py-3">{doctor.experienceYears || doctor.experience || 0} yrs</td>
                  <td className="px-4 py-3">{doctor.rating || 'N/A'}</td>
                  <td className="px-4 py-3">{doctor.nextAvailable || 'Live scheduling only'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-(--surface-muted) px-2 py-1 text-xs capitalize">
                      {doctor.status || (doctor.isVerified ? 'active' : 'inactive')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="p-4 text-sm text-(--text-soft)">No doctors match current filters.</p> : null}
      </section>
    </section>
  );
};
