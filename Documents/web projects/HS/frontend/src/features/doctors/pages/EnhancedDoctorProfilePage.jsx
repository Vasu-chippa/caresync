import { useEffect, useMemo, useState } from 'react';
import { Badge, Calendar, Heart, IndianRupee, Mail, MessageSquare, Shield, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMe } from '../../auth/hooks';
import { useDoctorProfile, useUpdateDoctorProfile } from '../hooks';
import { useDoctorRatingStats, useRatingsByDoctor } from '../../ratings/hooks';
import { RatingCard, RatingStats, StarRating } from '../../ratings/components';

const Motion = motion;
const DEFAULT_AVATAR = '/default-avatar.svg';

export const EnhancedDoctorProfilePage = () => {
  const meQuery = useMe();
  const doctorProfileQuery = useDoctorProfile();
  const updateDoctorProfileMutation = useUpdateDoctorProfile();
  const ratingStatsQuery = useDoctorRatingStats(meQuery.data?._id);
  const ratingsQuery = useRatingsByDoctor(meQuery.data?._id);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const me = meQuery.data;
  const doctorProfile = doctorProfileQuery.data;
  const [appointmentFee, setAppointmentFee] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (doctorProfile) {
      setAppointmentFee(String(doctorProfile.appointmentFee ?? 0));
    }
  }, [doctorProfile]);

  if (meQuery.isLoading || doctorProfileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-800/70" />
      </div>
    );
  }

  if (meQuery.isError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{meQuery.error.message}</p>;
  }

  const onSubmitFee = async (event) => {
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
      setEditMode(false);
    } catch (error) {
      setFeedback(error.message || 'Failed to update appointment fee.');
    }
  };

  const stats = ratingStatsQuery.data || {};
  const ratings = ratingsQuery.data?.items || [];

  return (
    <section className="space-y-6">
      {/* Hero Section with Avatar */}
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
              src={me?.avatarPath || DEFAULT_AVATAR}
              alt={me?.name}
              className="h-48 w-48 rounded-2xl border-4 border-cyan-300/30 object-cover shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            />
          </Motion.div>

          {/* Profile Info */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-100">{me?.name || 'Doctor'}</h1>
              <p className="mt-2 text-lg text-cyan-300">{doctorProfile?.specialization || 'Specialist'}</p>
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
                  <p className="text-sm font-bold text-cyan-300">{currencyFormatter.format(doctorProfile?.appointmentFee || 0)}</p>
                  <p className="text-xs text-cyan-200/70">Per consultation</p>
                </div>
              </Motion.div>

              <Motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-400/10 px-4 py-2"
              >
                <Badge size={18} className="text-purple-300" />
                <div>
                  <p className="text-sm font-bold text-purple-300">{doctorProfile?.experienceYears || 0}</p>
                  <p className="text-xs text-purple-200/70">Years exp.</p>
                </div>
              </Motion.div>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Mail size={16} className="text-cyan-300" /> {me?.email}</p>
              <p className="flex items-center gap-2"><Shield size={16} className="text-cyan-300" /> Verified • Active</p>
              <p className="flex items-center gap-2"><Users size={16} className="text-cyan-300" /> ID: {doctorProfile?.id?.slice(0, 8) || me?._id?.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </Motion.div>

      {/* Professional Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Motion.article
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6 backdrop-blur"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Professional Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Specialization</p>
              <p className="mt-1 text-slate-200">{doctorProfile?.specialization || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Qualification</p>
              <p className="mt-1 text-slate-200">{doctorProfile?.qualification || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Experience</p>
              <p className="mt-1 text-slate-200">{doctorProfile?.experienceYears ?? 0} years</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-300/30 bg-purple-400/10 px-3 py-1 text-xs text-purple-200">
                <Badge size={12} className="text-purple-300" />
                {doctorProfile?.experienceYears ?? 0}+ Years Experience
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                Rating {stats.averageRating || 0} ({stats.totalReviews || 0})
              </span>
            </div>
          </div>
        </Motion.article>

        <Motion.article
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6 backdrop-blur"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Consultation Fee</h2>
          <div className="space-y-3">
            {!editMode ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Current fee</p>
                    <p className="mt-2 text-3xl font-bold text-cyan-300">
                      {currencyFormatter.format(doctorProfile?.appointmentFee || 0)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Patients will see this during booking</p>
                  </div>
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode(true)}
                    className="rounded-lg bg-cyan-400/20 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-400/30 transition"
                  >
                    Edit
                  </Motion.button>
                </div>
              </>
            ) : (
              <form onSubmit={onSubmitFee} className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400">New fee (INR)</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-slate-900/50 px-3 py-2">
                    <IndianRupee size={18} className="text-cyan-300" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={appointmentFee}
                      onChange={(event) => setAppointmentFee(event.target.value)}
                      className="w-full bg-transparent text-slate-100 outline-none"
                      placeholder="8000"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={updateDoctorProfileMutation.isPending}
                    className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                  >
                    {updateDoctorProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </Motion.button>
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition"
                  >
                    Cancel
                  </Motion.button>
                </div>
              </form>
            )}
            {feedback && <p className="text-sm text-cyan-200">{feedback}</p>}
          </div>
        </Motion.article>
      </div>

      {/* Ratings Section */}
      {stats.totalReviews > 0 && (
        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Star size={24} className="text-yellow-400" />
            <h2 className="text-2xl font-bold text-slate-100">Patient Ratings & Reviews</h2>
          </div>

          {/* Stats Grid */}
          <RatingStats stats={stats} />

          {/* Individual Ratings */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">Recent Reviews</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {ratings.slice(0, 4).map((rating) => (
                <RatingCard key={rating.ratingId} rating={rating} showComment={true} />
              ))}
            </div>
            {ratings.length === 0 && (
              <p className="text-center text-slate-400">No reviews yet. Your first patient review will appear here.</p>
            )}
          </div>
        </Motion.section>
      )}
    </section>
  );
};
