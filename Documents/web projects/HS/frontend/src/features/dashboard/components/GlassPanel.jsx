import { motion } from 'framer-motion';

const Motion = motion;

export const GlassPanel = ({ children, className = '' }) => {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`rounded-2xl border border-cyan-300/20 bg-slate-900/45 p-5 shadow-[0_8px_30px_rgba(2,6,23,0.45),0_0_24px_rgba(34,211,238,0.12)] backdrop-blur-sm ${className}`}
    >
      {children}
    </Motion.section>
  );
};
