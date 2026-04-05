import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { RoleSidebar } from './RoleSidebar';
import { Footer } from './Footer';
import { useLogout, useMe } from '../../features/auth/hooks';

const Motion = motion;

export const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const meQuery = useMe({ enabled: !isAuthPage });
  const logoutMutation = useLogout();
  const user = meQuery.data;
  const role = user?.role;

  const onLogout = async () => {
    await logoutMutation.mutateAsync().catch(() => {});
    navigate('/login', { replace: true });
  };

  if (role && !isAuthPage) {
    return (
      <div className="flex min-h-screen bg-(--bg) text-(--text-soft)">
        <RoleSidebar
          role={role}
          userName={user?.name}
          avatarUrl={user?.avatarUrl}
          onLogout={onLogout}
          isLoggingOut={logoutMutation.isPending}
        />
        <main className="min-w-0 flex-1 px-4 pb-4 pt-16 md:p-6">
          <AnimatePresence mode="wait">
            <Motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </Motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-soft) flex flex-col">
      <TopNavbar />
      <main className="mx-auto w-full max-w-7xl p-4 md:p-6 flex-1">
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </Motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};


