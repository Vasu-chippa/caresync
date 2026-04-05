import { useMemo, useState } from 'react';
import { CalendarClock, Clock3, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsList, useRespondAppointment } from '../../appointments/hooks';

const Motion = motion;

export const DoctorMyAppointmentsPage = () => {
  const [status, setStatus] = useState('all');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  const params = useMemo(() => {
    if (status === 'all') {
      return { page: 1, limit: 30 };
    }

    return { page: 1, limit: 30, status };
  }, [status]);

  const appointmentsQuery = useAppointmentsList(params);
  const respondMutation = useRespondAppointment();

  const decideAppointment = async (appointmentId, action) => {
    setFeedback('');
    try {
      await respondMutation.mutateAsync({ appointmentId, action });
      setFeedback(
        action === 'accept'
          ? `Appointment ${appointmentId} accepted successfully.`
          : `Appointment ${appointmentId} rejected successfully.`
      );
    } catch (error) {
      setFeedback(error.message || 'Failed to update appointment.');
    }
  };

  const goToPrescription = (item) => {
    navigate(`/prescriptions?appointmentId=${encodeURIComponent(item.appointmentId)}&patientId=${encodeURIComponent(item.patientId)}`);
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/80 via-slate-900/75 to-cyan-950/45 p-5 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <CalendarClock size={20} className="text-cyan-300" />
          My Appointments
        </h1>
        <p className="mt-1 text-sm text-slate-300">Appointments assigned to your account only.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-300/15 bg-slate-900/55 p-3">
        <ListFilter size={15} className="text-cyan-300" />
        {['all', 'booked', 'accepted', 'completed', 'cancelled'].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
              status === value
                ? 'bg-cyan-300/15 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.2)]'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {feedback ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {feedback}
        </div>
      ) : null}

      {appointmentsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-14 animate-pulse rounded-xl bg-slate-800/65" />
          ))}
        </div>
      ) : appointmentsQuery.isError ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {appointmentsQuery.error.message}
        </div>
      ) : (
        <div className="grid gap-3">
          {(appointmentsQuery.data?.items || []).map((item, index) => (
            <Motion.article
              key={item.appointmentId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="rounded-xl border border-cyan-300/15 bg-slate-900/60 p-4 shadow-[0_0_18px_rgba(15,23,42,0.45)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{item.appointmentId}</p>
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-xs uppercase tracking-wide text-cyan-100">
                  {item.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={14} className="text-cyan-300" />
                  {item.timeSlot}
                </span>
                <span>{item.date}</span>
                <span className="text-slate-400">Patient: {item.patientId}</span>
              </div>

              {item.status === 'booked' ? (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => decideAppointment(item.appointmentId, 'accept')}
                    disabled={respondMutation.isPending}
                    className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-60"
                  >
                    {respondMutation.isPending ? 'Saving...' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    onClick={() => decideAppointment(item.appointmentId, 'reject')}
                    disabled={respondMutation.isPending}
                    className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
                  >
                    {respondMutation.isPending ? 'Saving...' : 'Reject'}
                  </button>
                </div>
              ) : null}

              {(item.status === 'accepted' || item.status === 'completed') ? (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {item.status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => decideAppointment(item.appointmentId, 'complete')}
                      disabled={respondMutation.isPending}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-60"
                    >
                      {respondMutation.isPending ? 'Saving...' : 'Mark Completed'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => goToPrescription(item)}
                    className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    Create Prescription
                  </button>
                </div>
              ) : null}
            </Motion.article>
          ))}

          {(appointmentsQuery.data?.items || []).length === 0 ? (
            <div className="rounded-xl border border-cyan-300/15 bg-slate-900/55 px-4 py-8 text-center text-sm text-slate-300">
              No appointments found for this filter.
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};
