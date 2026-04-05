import { motion } from 'framer-motion';
import { Activity, ArrowRight, Building2, CalendarCheck2, HeartPulse, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Motion = motion;

const featureCards = [
  {
    title: 'Smart Appointments',
    text: 'Real-time booking with conflict detection and timeline-driven care flow.',
    icon: CalendarCheck2,
  },
  {
    title: 'Clinical Intelligence',
    text: 'Dashboards for doctors, patients, and admins with actionable insights.',
    icon: Activity,
  },
  {
    title: 'Secure Operations',
    text: 'Role-based access, hardened sessions, observability, and audit-ready design.',
    icon: ShieldCheck,
  },
];

const rolePill = [
  {
    label: 'Patient Portal',
    icon: HeartPulse,
    color: 'from-cyan-400/35 to-cyan-400/5',
    summary: 'Book appointments, see prescriptions, invoices, and personal reports.',
  },
  {
    label: 'Doctor Workspace',
    icon: Stethoscope,
    color: 'from-violet-400/35 to-violet-400/5',
    summary: 'Manage appointments, write prescriptions, and follow assigned patients.',
  },
  {
    label: 'Admin Command',
    icon: Building2,
    color: 'from-emerald-400/35 to-emerald-400/5',
    summary: 'Oversee users, billing, reports, analytics, and system operations.',
  },
];

export const HomePage = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

      <section className="relative rounded-3xl border border-white/10 bg-linear-to-br from-slate-950/80 via-slate-900/70 to-cyan-950/40 p-8 shadow-[0_0_40px_rgba(34,211,238,0.14)] md:p-12">
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
            Hospital Management Platform
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
            <span className="bg-linear-to-r from-cyan-300 to-cyan-200 bg-clip-text text-transparent">CareSyncr</span>: Your Complete Healthcare Ecosystem
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            Manage patient journeys, clinical workflows, and operations through beautifully orchestrated dashboards designed for speed,
            precision, and trust.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.4)] transition hover:brightness-105"
            >
              Launch CareSyncr
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-white/20 bg-slate-900/60 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40"
            >
              Create Account
            </Link>
          </div>
        </Motion.div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {rolePill.map((item, index) => (
            <Motion.article
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 * index }}
              className={`rounded-2xl border border-white/10 bg-linear-to-br ${item.color} p-4 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-2 text-slate-100">
                <item.icon size={16} />
                <p className="text-sm font-medium">{item.label}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.summary}</p>
            </Motion.article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {featureCards.map((item, index) => (
          <Motion.article
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="group rounded-2xl border border-white/10 bg-slate-900/55 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.45)] transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(56,189,248,0.2)]"
          >
            <div className="mb-4 inline-flex rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
              <item.icon size={18} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.text}</p>
          </Motion.article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/65 p-6 text-center shadow-[0_0_28px_rgba(168,85,247,0.18)]">
        <h2 className="text-2xl font-semibold text-slate-100">Built For Scale, Care, and Clarity</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
          From appointment creation to billing closure, every step is connected to deliver faster decisions and better patient outcomes.
        </p>
      </section>
    </div>
  );
};
