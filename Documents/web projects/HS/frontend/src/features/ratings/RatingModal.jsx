import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateRating } from './hooks';
import { StarRating } from './components';

const Motion = motion;

export const RatingModal = ({ doctorId, appointmentId, isOpen, onClose, onSuccess }) => {
  const createRatingMutation = useCreateRating();
  const [ratings, setRatings] = useState({
    overallRating: 5,
    professionalism: 5,
    bedideManner: 5,
    clearExplanations: 5,
  });
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');

    try {
      if (!appointmentId) {
        setFeedback('Appointment reference is required to submit rating.');
        return;
      }

      await createRatingMutation.mutateAsync({
        doctorId,
        appointmentId,
        overallRating: ratings.overallRating,
        professionalism: ratings.professionalism,
        bedideManner: ratings.bedideManner,
        clearExplanations: ratings.clearExplanations,
        comment,
        isAnonymous,
      });

      setFeedback('Rating submitted successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error) {
      setFeedback(error.message || 'Failed to submit rating');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <Motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-slate-900/95 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
      >
        <div className="sticky top-0 border-b border-cyan-300/10 bg-slate-950/95 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 transition"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-3 text-xs text-cyan-100">
            Appointment: <span className="font-semibold">{appointmentId || 'N/A'}</span>
          </div>
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Overall Rating *
            </label>
            <p className="mt-1 text-xs text-slate-400">How would you rate your overall experience?</p>
            <div className="mt-3">
              <StarRating
                rating={ratings.overallRating}
                size="lg"
                interactive
                onChange={(val) => setRatings((prev) => ({ ...prev, overallRating: val }))}
              />
            </div>
          </div>

          {/* Individual Criteria */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: 'professionalism', label: 'Professionalism', desc: 'Professional conduct' },
              { key: 'bedideManner', label: 'Bedside Manner', desc: 'Patient care & empathy' },
              { key: 'clearExplanations', label: 'Clear Explanations', desc: 'Understanding clarity' },
            ].map((criterion) => (
              <div key={criterion.key}>
                <label className="block text-sm font-medium text-slate-300">{criterion.label}</label>
                <p className="mt-0.5 text-xs text-slate-400">{criterion.desc}</p>
                <div className="mt-2">
                  <StarRating
                    rating={ratings[criterion.key]}
                    size="md"
                    interactive
                    onChange={(val) => setRatings((prev) => ({ ...prev, [criterion.key]: val }))}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Share your experience... (max 500 characters)"
              className="mt-2 w-full rounded-lg border border-cyan-300/20 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/40 transition resize-none"
              rows={4}
            />
            <p className="mt-1 text-xs text-slate-400">{comment.length}/500</p>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-cyan-300/30"
            />
            <label htmlFor="anonymous" className="text-sm text-slate-300">
              Post as anonymous
            </label>
          </div>

          {/* Feedback */}
          {feedback && (
            <p className={`text-sm rounded-lg p-3 ${
              feedback.includes('successfully')
                ? 'bg-green-400/10 text-green-300'
                : 'bg-red-400/10 text-red-300'
            }`}>
              {feedback}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800/50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRatingMutation.isPending}
              className="flex-1 rounded-lg bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:opacity-60 hover:bg-cyan-300 transition"
            >
              {createRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
};
