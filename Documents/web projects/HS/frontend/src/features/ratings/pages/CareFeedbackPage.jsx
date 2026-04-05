import { useMemo, useState } from 'react';
import { CalendarClock, MessageSquareHeart, Star } from 'lucide-react';
import { useAppointmentsList } from '../../appointments/hooks';
import { useDoctors } from '../../doctors/hooks';
import { RatingModal } from '../RatingModal';

export const CareFeedbackPage = () => {
  const completedAppointmentsQuery = useAppointmentsList({ page: 1, limit: 50, status: 'completed' });
  const doctorsQuery = useDoctors();
  const [ratingModalPayload, setRatingModalPayload] = useState(null);
  const [ratedAppointmentIds, setRatedAppointmentIds] = useState(() => new Set());

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const doctorMap = useMemo(
    () => new Map((doctorsQuery.data || []).map((doctor) => [String(doctor.id || doctor._id), doctor])),
    [doctorsQuery.data]
  );

  const completedAppointments = completedAppointmentsQuery.data?.items || [];

  const onRatingSuccess = () => {
    if (!ratingModalPayload?.appointmentId) {
      return;
    }

    setRatedAppointmentIds((prev) => {
      const next = new Set(prev);
      next.add(String(ratingModalPayload.appointmentId));
      return next;
    });
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-yellow-400/25 bg-linear-to-r from-slate-950/85 via-slate-900/75 to-yellow-950/40 p-5 shadow-[0_0_26px_rgba(250,204,21,0.15)]">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <MessageSquareHeart size={20} className="text-yellow-300" />
          Care Feedback Hub
        </h1>
        <p className="mt-1 text-sm text-slate-300">Rate doctors after completed appointments to help improve patient care quality.</p>
      </header>

      {completedAppointmentsQuery.isLoading || doctorsQuery.isLoading ? (
        <div className="space-y-2 rounded-2xl border border-(--border) bg-(--surface) p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-12 animate-pulse rounded-lg bg-(--surface-muted)" />
          ))}
        </div>
      ) : completedAppointmentsQuery.isError ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {completedAppointmentsQuery.error.message}
        </div>
      ) : (
        <div className="grid gap-3">
          {completedAppointments.map((appointment) => {
            const doctor = doctorMap.get(String(appointment.doctorId));
            const alreadyRated = ratedAppointmentIds.has(String(appointment.appointmentId));

            return (
              <article
                key={appointment.appointmentId}
                className="rounded-xl border border-(--border) bg-(--surface) p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-(--text-strong)">{appointment.appointmentId}</p>
                    <p className="text-xs text-(--text-soft)">
                      {doctor?.name || 'Doctor'} • {doctor?.specialization || 'Specialist'}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                    Completed
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-(--text-soft)">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock size={12} className="text-cyan-300" />
                    {appointment.date} {appointment.timeSlot}
                  </span>
                  <span>
                    Fee: {currencyFormatter.format(doctor?.appointmentFee || appointment.appointmentFee || 0)}
                  </span>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={alreadyRated}
                    onClick={() => {
                      setRatingModalPayload({
                        appointmentId: appointment.appointmentId,
                        doctorId: String(appointment.doctorId),
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-yellow-400/35 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-300 disabled:opacity-50"
                  >
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {alreadyRated ? 'Rated' : 'Rate Doctor'}
                  </button>
                </div>
              </article>
            );
          })}

          {completedAppointments.length === 0 ? (
            <div className="rounded-xl border border-(--border) bg-(--surface) px-4 py-10 text-center text-sm text-(--text-soft)">
              No completed appointments yet. You can submit ratings here after your consultation is marked complete.
            </div>
          ) : null}
        </div>
      )}

      <RatingModal
        isOpen={Boolean(ratingModalPayload)}
        appointmentId={ratingModalPayload?.appointmentId}
        doctorId={ratingModalPayload?.doctorId}
        onClose={() => setRatingModalPayload(null)}
        onSuccess={onRatingSuccess}
      />
    </section>
  );
};
