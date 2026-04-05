import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Motion = motion;

export const StarRating = ({ rating, size = 'md', interactive = false, onChange = null }) => {
  const sizeMap = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  };

  const starSize = sizeMap[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Motion.button
          key={star}
          whileHover={interactive ? { scale: 1.15 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
          onClick={() => interactive && onChange?.(star)}
          disabled={!interactive}
          className={`transition ${interactive ? 'cursor-pointer' : ''}`}
        >
          <Star
            size={starSize}
            className={`${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-600'
            } transition`}
          />
        </Motion.button>
      ))}
    </div>
  );
};

export const RatingCard = ({ rating, showComment = true }) => {
  if (!rating) return null;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-cyan-300/15 bg-slate-900/40 p-4 hover:border-cyan-300/30 transition"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-100">{rating.patientName}</p>
          <p className="text-xs text-slate-500">
            {new Date(rating.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-yellow-300">{rating.overallRating}</span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-800/50 p-2">
          <p className="text-slate-400">Professionalism</p>
          <StarRating rating={rating.professionalism} size="xs" />
        </div>
        <div className="rounded-lg bg-slate-800/50 p-2">
          <p className="text-slate-400">Bedside Manner</p>
          <StarRating rating={rating.bedideManner} size="xs" />
        </div>
        <div className="rounded-lg bg-slate-800/50 p-2">
          <p className="text-slate-400">Explanations</p>
          <StarRating rating={rating.clearExplanations} size="xs" />
        </div>
      </div>

      {showComment && rating.comment && (
        <p className="text-sm text-slate-300 italic">\"{rating.comment}\"</p>
      )}
    </Motion.div>
  );
};

export const RatingStats = ({ stats }) => {
  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="rounded-xl border border-cyan-300/15 bg-slate-900/40 p-6 text-center">
        <p className="text-slate-400">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-cyan-300/15 bg-slate-900/40 p-4 text-center"
      >
        <p className="text-xs uppercase tracking-widest text-slate-400">Overall</p>
        <p className="mt-2 text-4xl font-bold text-cyan-300">{stats.averageRating}</p>
        <p className="mt-1 text-xs text-slate-500">{stats.totalReviews} reviews</p>
      </Motion.div>

      {[
        { label: 'Professionalism', value: stats.averageProfessionalism },
        { label: 'Bedside Manner', value: stats.averageBedideManner },
        { label: 'Clear Explanations', value: stats.averageClearExplanations },
      ].map((stat, idx) => (
        <Motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (idx + 1) * 0.1 }}
          className="rounded-xl border border-cyan-300/15 bg-slate-900/40 p-4"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-cyan-300">{stat.value}</p>
            <StarRating rating={Math.round(stat.value)} size="sm" />
          </div>
        </Motion.div>
      ))}
    </div>
  );
};
