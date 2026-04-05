import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLogout, useMe } from '../../features/auth/hooks';

const dashboardPathByRole = {
  admin: '/admin',
  doctor: '/doctor',
  patient: '/patient',
};

const linksByRole = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/patients', label: 'Patients' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/prescriptions', label: 'Prescriptions' },
    { to: '/billing', label: 'Billing' },
    { to: '/reports', label: 'Reports' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/prescriptions', label: 'Prescriptions' },
    { to: '/doctor/profile', label: 'My Profile' },
    { to: '/reports', label: 'Reports' },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/billing', label: 'Billing' },
    { to: '/patient/feedback', label: 'Care Feedback' },
    { to: '/prescriptions', label: 'Prescriptions' },
    { to: '/reports', label: 'Reports' },
  ],
};

export const TopNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const meQuery = useMe({ enabled: !isPublicAuthPage });
  const logoutMutation = useLogout();

  const user = meQuery.data;
  const role = user?.role;
  const links = role ? linksByRole[role] || [] : [];

  const onLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-300/20 bg-(--surface)/95 shadow-[0_0_24px_rgba(34,211,238,0.14)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Link to={role ? dashboardPathByRole[role] || '/' : '/'} className="text-lg font-semibold text-(--text-strong) flex items-center gap-2">
          <img src="/caresync.png" alt="CareSyncr" className="h-6 w-6" />
          CareSyncr Console
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {!role ? (
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-(--brand-muted) text-(--brand) shadow-[0_0_18px_rgba(94,234,212,0.3)]'
                    : 'text-(--text-soft) hover:bg-(--surface-muted) hover:shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                }`
              }
            >
              Home
            </NavLink>
          ) : null}
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-(--brand-muted) text-(--brand) shadow-[0_0_18px_rgba(94,234,212,0.3)]'
                    : 'text-(--text-soft) hover:bg-(--surface-muted) hover:shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user?.name ? (
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.25)]">
              {role}
            </span>
            <span className="rounded-lg bg-(--surface-muted) px-3 py-2 text-sm text-(--text-strong)">
              {user.name}
            </span>
            <button
              type="button"
              onClick={onLogout}
              disabled={logoutMutation.isPending}
              className="rounded-lg border border-(--border) px-3 py-2 text-sm text-(--text-soft) transition hover:bg-(--surface-muted) hover:shadow-[0_0_16px_rgba(56,189,248,0.25)] disabled:opacity-60"
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-(--text-soft) hover:bg-(--surface-muted)">
              Login
            </Link>
            <Link to="/register" className="rounded-lg bg-(--brand) px-3 py-2 text-sm font-medium text-white">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
