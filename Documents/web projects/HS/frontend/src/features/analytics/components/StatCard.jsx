import { motion } from 'framer-motion';

const Motion = motion;

export const StatCard = ({ label, value, index }) => {
  return (
    <Motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-sm"
    >
      <p className="text-sm text-(--text-soft)">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-(--text-strong)">{value}</p>
    </Motion.article>
  );
};
