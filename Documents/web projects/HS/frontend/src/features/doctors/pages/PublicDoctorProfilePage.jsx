import { useMemo, useState } from 'react';
import { Heart, IndianRupee, MapPin, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useDoctors } from '../hooks';
import { useDoctorRatingStats, useRatingsByDoctor } from '../../ratings/hooks';
import { useMe } from '../../auth/hooks';
import { useAppointmentsList } from '../../appointments/hooks';
import { RatingCard, RatingStats, StarRating } from '../../ratings/components';
import { RatingModal } from '../../ratings/RatingModal';

const Motion = motion;
const DEFAULT_AVATAR = '/default-avatar.svg';

export const PublicDoctorProfilePage = () => {
  const { doctorId } = useParams();
  const doctorsQuery = useDoctors();
  const ratingStatsQuery = useDoctorRatingStats(doctorId);
  const ratingsQuery = useRatingsByDoctor(doctorId);
  const meQuery = useMe();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const completedAppointmentsQuery = useAppointmentsList({ page: 1, limit: 50, status: 'completed' });

  const doctor = useMemo(() => {
    return (doctorsQuery.data || []).find((d) => String(d.id || d._id) === String(doctorId));
  }, [doctorsQuery.data, doctorId]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const stats = ratingStatsQuery.data || {};
  const ratings = ratingsQuery.data?.items || [];
  const isPatient = meQuery.data?.role === 'patient';
  const eligibleAppointment = (completedAppointmentsQuery.data?.items || []).find(
    (item) => String(item.doctorId) === String(doctorId)
  );

  if (doctorsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-800/70" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-200">Doctor not found</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Hero Section */}
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-linear-to-br from-slate-950/90 via-slate-900/80 to-blue-950/40 p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
      >
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          {/* Avatar */}
          <Motion.div
            whileHover={{ scale: 1.05 }}
            className="flex justify-center md:justify-start"
          >
            <img
              src={DEFAULT_AVATAR}
              alt={doctor.name}
              className="h-48 w-48 rounded-2xl border-4 border-cyan-300/30 object-cover shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            />
          </Motion.div>

          {/* Profile Info */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-100">{doctor.name}</h1>
              <p className="mt-2 text-lg text-cyan-300">{doctor.specialization}</p>
              <p className="mt-1 text-sm text-slate-300">{doctor.qualification}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              {stats.totalReviews > 0 && (
                <Motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2"
                >
                  <Star size={18} className="fill-yellow-400 text-yellow-400" />
                  <div>
                    <p className="text-sm font-bold text-yellow-300">{stats.averageRating}</p>
                    <p className="text-xs text-yellow-200/70">{stats.totalReviews} reviews</p>
                  </div>
                </Motion.div>
              )}

              <Motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2"
              >
                <IndianRupee size={18} className="text-cyan-300" />
                <div>
                  <p className="text-sm font-bold text-cyan-300">{currencyFormatter.format(doctor.appointmentFee || 0)}</p>
                  <p className="text-xs text-cyan-200/70">Per consultation</p>
                </div>
              </Motion.div>

              <Motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-400/10 px-4 py-2"
              >
                <Users size={18} className="text-purple-300" />
                <div>
                  <p className="text-sm font-bold text-purple-300">{doctor.experienceYears || 0}</p>
                  <p className="text-xs text-purple-200/70">Years experience</p>
                </div>
              </Motion.div>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              <p className="flex items-center gap-2"><MapPin size={16} className="text-cyan-300" /> Healthcare Provider</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Motion.a
                whileHover={{ scale: 1.05 }}
                href={`/appointments/book?doctor=${doctorId}`}
                className="rounded-lg bg-cyan-400 px-6 py-2 font-semibold text-slate-950 hover:bg-cyan-300 transition"
              >
                📅 Book Appointment
              </Motion.a>
              {isPatient && (
                <Motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    if (!eligibleAppointment) {
                      setRatingFeedback('You can rate this doctor after at least one completed appointment.');
                      return;
                    }

                    setRatingFeedback('');
                    setShowRatingModal(true);
                  }}
                  className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-6 py-2 font-semibold text-yellow-300 hover:border-yellow-400/60 hover:bg-yellow-400/20 transition"
                >
                  ⭐ Rate Doctor
                </Motion.button>
              )}
            </div>
            {ratingFeedback ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{ratingFeedback}</p>
            ) : null}
          </div>
        </div>
      </Motion.div>

      {/* Professional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400">Specialization</p>
          <p className="mt-3 text-lg font-semibold text-cyan-300">{doctor.specialization}</p>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400">Qualification</p>
          <p className="mt-3 text-lg font-semibold text-cyan-300">{doctor.qualification}</p>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400">Experience</p>
          <p className="mt-3 text-lg font-semibold text-cyan-300">{doctor.experienceYears || 0} years</p>
        </Motion.div>
      </div>

      {/* Ratings Section */}
      {stats.totalReviews > 0 && (
        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={24} className="text-yellow-400" />
              <h2 className="text-2xl font-bold text-slate-100">Patient Feedback</h2>
            </div>
            {isPatient && (
              <Motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (!eligibleAppointment) {
                    setRatingFeedback('You can rate this doctor after at least one completed appointment.');
                    return;
                  }

                  setRatingFeedback('');
                  setShowRatingModal(true);
                }}
                className="rounded-lg bg-yellow-400/20 px-3 py-1 text-sm font-medium text-yellow-300 hover:bg-yellow-400/30 transition"
              >
                + Add Review
              </Motion.button>
            )}
          </div>

          {/* Stats Grid */}
          <RatingStats stats={stats} />

          {/* Recent Reviews */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">Latest Reviews</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {ratings.slice(0, 4).map((rating) => (
                <RatingCard key={rating.ratingId} rating={rating} showComment={true} />
              ))}
            </div>
            {ratings.length === 0 && (
              <p className="text-center text-slate-400">No reviews yet</p>
            )}
          </div>
        </Motion.section>
      )}

      {/* Rating Modal */}
      <RatingModal
        doctorId={doctorId}
        appointmentId={eligibleAppointment?.appointmentId}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSuccess={() => {
          ratingStatsQuery.refetch();
          ratingsQuery.refetch();
        }}
      />
    </section>
  );
};
