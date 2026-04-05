import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, Sparkles } from 'lucide-react';
import { authApi } from '../api';

const roleHomePath = {
  admin: '/admin',
  doctor: '/doctor',
  patient: '/patient',
};

const Motion = motion;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fromPath = location.state?.from?.pathname;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await authApi.login({ email, password });
      const role = data?.user?.role;

      if (role && role !== loginAs) {
        await authApi.logout().catch(() => {});
        setErrorMessage(`This account is registered as ${role}. Please select ${role} in Login as.`);
        return;
      }

      const fallbackPath = roleHomePath[role] || '/';
      navigate(fromPath || fallbackPath, { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] rounded-3xl border border-cyan-300/20 bg-slate-950/80 p-4 shadow-[0_0_36px_rgba(34,211,238,0.12)] md:p-6">
      <div className="grid min-h-[78vh] grid-cols-1 overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950 md:grid-cols-[1fr_1fr]">
        <div className="relative hidden overflow-hidden md:block">
          <img src="/loginimage.png" alt="Medical professional" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/20 via-cyan-950/25 to-blue-950/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_42%)]" />

          <Motion.div
            className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl"
            animate={{ x: [0, 45, 0], y: [0, 20, 0], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Motion.div
            className="absolute right-6 top-20 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 25, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
          <Motion.div
            className="absolute -bottom-10 left-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
            animate={{ y: [0, -35, 0], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />



          <div className="absolute inset-x-0 bottom-0 p-8">
            <div className="max-w-md rounded-xl border border-white/15 bg-slate-900/35 p-4 text-cyan-100 backdrop-blur-sm" />
        </div>
      </div>

        <Motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 p-6"
        >
          <div className="w-full max-w-md rounded-2xl border border-cyan-300/25 bg-slate-900/70 p-6 shadow-[0_0_24px_rgba(56,189,248,0.22)] backdrop-blur-sm">
            <h1 className="text-3xl font-semibold text-slate-100">Login</h1>
            <p className="mt-1 text-sm text-slate-300">Log in to your account.</p>

            <label className="mt-5 block text-sm">
              <span className="mb-1 block">Login as</span>
              <select
                value={loginAs}
                onChange={(event) => setLoginAs(event.target.value)}
                className="w-full rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block">Email</span>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-9 py-2 text-slate-100 outline-none focus:border-cyan-300"
                    placeholder="name@hospital.com"
                  />
                </div>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block">Password</span>
                <div className="relative">
                  <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-9 py-2 text-slate-100 outline-none focus:border-cyan-300"
                    placeholder="Enter your password"
                  />
                </div>
              </label>

              <div className="text-right">
                <button type="button" className="text-xs text-cyan-300 hover:text-cyan-200">
                  Forgot Password?
                </button>
              </div>

              {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.45)] transition hover:brightness-105 disabled:opacity-60"
              >
                <Sparkles size={16} />
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-cyan-300 hover:text-cyan-200">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </Motion.div>
      </div>
    </div>
  );
};
