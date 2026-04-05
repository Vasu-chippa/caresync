import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, IndianRupee, Mail, Shield, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMe } from '../../auth/hooks';
import { useDoctorProfile, useUpdateDoctorProfile } from '../hooks';

const Motion = motion;

export const DoctorProfilePage = () => {
  const meQuery = useMe();
  const doctorProfileQuery = useDoctorProfile();
  const updateDoctorProfileMutation = useUpdateDoctorProfile();
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const me = meQuery.data;
  const doctorProfile = doctorProfileQuery.data;
  const [appointmentFee, setAppointmentFee] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (doctorProfile) {
      setAppointmentFee(String(doctorProfile.appointmentFee ?? 0));
    }
  }, [doctorProfile]);

  const feeValue = Number(appointmentFee || doctorProfile?.appointmentFee || 0);
  const feePreview = Number.isFinite(feeValue) ? feeValue : 0;

  if (meQuery.isLoading || doctorProfileQuery.isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-24 animate-pulse rounded-xl bg-slate-800/65" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/65" />
      </div>
    );
  }

  if (meQuery.isError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{meQuery.error.message}</p>;
  }

  if (doctorProfileQuery.isError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{doctorProfileQuery.error.message}</p>;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    const parsedFee = Number(appointmentFee);
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setFeedback('Enter a valid appointment fee in INR.');
      return;
    }

    try {
      await updateDoctorProfileMutation.mutateAsync({
        appointmentFee: Math.round(parsedFee),
      });
      setFeedback('Appointment fee updated successfully.');
    } catch (error) {
      setFeedback(error.message || 'Failed to update appointment fee.');
    }
  };

  return (
    <section className="space-y-5">
      <Motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/80 via-slate-900/70 to-blue-950/40 p-5 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
      >
        <h1 className="text-2xl font-semibold text-slate-100">My Profile</h1>
        <p className="mt-1 text-sm text-slate-300">Manage your doctor account and set the consultation fee patients will see while booking.</p>
      </Motion.header>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Account Details</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2"><UserRound size={15} className="text-cyan-300" /> {me?.name || 'Doctor'}</p>
            <p className="inline-flex items-center gap-2"><Mail size={15} className="text-cyan-300" /> {me?.email || '-'}</p>
            <p className="inline-flex items-center gap-2"><Shield size={15} className="text-cyan-300" /> Role: {me?.role || '-'}</p>
            <p className="inline-flex items-center gap-2"><BadgeCheck size={15} className="text-cyan-300" /> Verified: {me?.isVerified ? 'Yes' : 'No'}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Professional Details</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-400">Specialization:</span> {doctorProfile?.specialization || 'General Medicine'}</p>
            <p><span className="text-slate-400">Qualification:</span> {doctorProfile?.qualification || 'MBBS'}</p>
            <p><span className="text-slate-400">Experience:</span> {doctorProfile?.experienceYears ?? 0} years</p>
            <p><span className="text-slate-400">Doctor ID:</span> {doctorProfile?.id || me?.id || '-'}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Consultation pricing</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">Set your appointment fee in INR</h3>
                <p className="mt-1 text-sm text-slate-400">Patients will see this amount during booking.</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-100">
                <IndianRupee size={14} />
                <span>{currencyFormatter.format(feePreview)}</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <label className="block text-sm text-slate-300">
                Appointment Fee
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 focus-within:border-cyan-300/40">
                  <IndianRupee size={18} className="text-cyan-300" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    inputMode="numeric"
                    value={appointmentFee}
                    onChange={(event) => setAppointmentFee(event.target.value)}
                    className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="8000"
                  />
                </div>
              </label>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Quick picks</p>
                <div className="flex flex-wrap gap-2">
                  {[2000, 5000, 8000, 10000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setAppointmentFee(String(fee))}
                      className="rounded-full border border-cyan-300/20 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                    >
                      {currencyFormatter.format(fee)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Use a whole rupee amount such as {currencyFormatter.format(8000)}. You can update it any time your consultation price changes.
              </p>

              {feedback ? <p className="text-sm text-cyan-200">{feedback}</p> : null}

              <button
                type="submit"
                disabled={updateDoctorProfileMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {updateDoctorProfileMutation.isPending ? 'Saving...' : 'Save Fee'}
              </button>
            </form>
          </div>
        </article>
      </div>
    </section>
  );
};
