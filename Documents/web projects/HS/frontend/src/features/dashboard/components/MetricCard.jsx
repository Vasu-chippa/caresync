import { motion } from 'framer-motion';

const Motion = motion;

export const MetricCard = ({ icon: Icon, title, value, subtitle, tone = 'cyan', index = 0 }) => {
  const toneClasses = {
    cyan: 'from-cyan-400/20 to-cyan-500/5 text-cyan-200',
    emerald: 'from-emerald-400/20 to-emerald-500/5 text-emerald-200',
    amber: 'from-amber-400/20 to-amber-500/5 text-amber-200',
    rose: 'from-rose-400/20 to-rose-500/5 text-rose-200',
    violet: 'from-violet-400/20 to-violet-500/5 text-violet-200',
  };

  return (
    <Motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.4)] transition hover:scale-[1.015] hover:shadow-[0_0_24px_rgba(56,189,248,0.28)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <div
          className={`rounded-xl bg-gradient-to-br p-2 ${toneClasses[tone] || toneClasses.cyan}`}
          title={title}
        >
          {Icon ? <Icon size={18} /> : null}
        </div>
      </div>
    </Motion.article>
  );
};
