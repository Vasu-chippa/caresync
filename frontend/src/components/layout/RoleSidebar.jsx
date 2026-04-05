import { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  CalendarCheck2,
  ClipboardList,
  CreditCard,
  HandCoins,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  Stethoscope,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Motion = motion;

const linksByRole = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/earnings', label: 'Earnings', icon: HandCoins },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarCheck2 },
    { to: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/profile', label: 'My Profile', icon: UserRound },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/appointments', label: 'My Appointments', icon: CalendarCheck2 },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/doctor/profile', label: 'My Profile', icon: UserRound },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/appointments', label: 'Appointments', icon: CalendarCheck2 },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/patient/feedback', label: 'Care Feedback', icon: MessageSquareHeart },
    { to: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/profile', label: 'My Profile', icon: UserRound },
  ],
};

const roleTitle = {
  admin: 'Admin Console',
  doctor: 'Doctor Workspace',
  patient: 'Patient Portal',
};

export const RoleSidebar = ({ role, userName, avatarUrl, onLogout, isLoggingOut }) => {
  const [open, setOpen] = useState(false);

  const links = useMemo(() => linksByRole[role] || [], [role]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-slate-900/85 text-cyan-200 shadow-[0_0_18px_rgba(56,189,248,0.35)] backdrop-blur md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-cyan-300/15 bg-linear-to-b from-[#04273b] via-[#06293a] to-[#021926] text-slate-100 shadow-[0_0_35px_rgba(3,105,161,0.35)] transition-transform duration-300 md:static md:z-0 md:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-cyan-300/20 px-5 py-4">
          <Link to={role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient'} className="text-lg font-semibold tracking-wide text-cyan-100 flex items-center gap-2">
            <img src="/caresync.png" alt="CareSyncr" className="h-6 w-6" />
            CareSyncr
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-slate-900/40 text-cyan-200 md:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-cyan-300/10 px-5 py-4">
          <div className="mb-2 flex items-center gap-3">
            <img
              src={avatarUrl || '/default-avatar.svg'}
              alt="Profile"
              className="h-11 w-11 rounded-xl border border-cyan-300/20 object-cover"
            />
            <p className="text-sm font-medium text-slate-100">{userName || 'Hospital User'}</p>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/80">{roleTitle[role] || 'Workspace'}</p>
        </div>

        <Motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 space-y-1 p-3"
        >
          {links.map((item, index) => {
            const Icon = item.icon;
            return (
              <Motion.div
                key={item.to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.035 }}
              >
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.22)]'
                        : 'border-transparent text-slate-200 hover:border-cyan-300/20 hover:bg-slate-900/45 hover:text-cyan-100 hover:shadow-[0_0_14px_rgba(14,165,233,0.22)]'
                    }`
                  }
                >
                  <Icon size={17} className="text-cyan-300 transition group-hover:scale-110 group-hover:text-cyan-200" />
                  <span className="font-medium">{item.label}</span>
                  <Activity size={13} className="ml-auto opacity-0 transition group-hover:opacity-70" />
                </NavLink>
              </Motion.div>
            );
          })}
        </Motion.nav>

        <div className="border-t border-cyan-300/15 p-3">
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-slate-900/45 px-3 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-slate-900/70 hover:shadow-[0_0_14px_rgba(34,211,238,0.24)] disabled:opacity-60"
          >
            <LogOut size={16} />
            {isLoggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
};
