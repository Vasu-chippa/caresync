import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, User, Sparkles } from 'lucide-react';
import { authApi } from '../api';

const roleHomePath = {
  admin: '/admin',
  doctor: '/doctor',
  patient: '/patient',
};

const Motion = motion;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const requestOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await authApi.requestRegisterOtp({ email });
      setStep(2);
      setMessage('OTP sent. Check your email and complete registration.');
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeRegistration = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await authApi.verifyRegisterOtp({ email, otp, name, password, role });
      const loginData = await authApi.login({ email, password });
      navigate(roleHomePath[loginData?.user?.role] || '/', { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl rounded-2xl border border-cyan-300/30 bg-slate-900/75 p-6 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
    >
      <h1 className="text-2xl font-semibold text-(--text-strong)">Create account</h1>
      <p className="mt-1 text-sm text-slate-300">Register with OTP verification and role-based access.</p>

      <label className="mt-5 block text-sm">
        <span className="mb-1 block">Register as</span>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      {step === 1 ? (
        <form className="mt-6 space-y-4" onSubmit={requestOtp}>
          <label className="block text-sm">
            <span className="mb-1 block">Email</span>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-9 py-2 text-slate-100"
                placeholder="name@hospital.com"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.45)] transition hover:brightness-105 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={completeRegistration}>
          <label className="block text-sm">
            <span className="mb-1 block">OTP</span>
            <input
              required
              value={otp}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(digitsOnly);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-3 py-2 text-slate-100"
              placeholder="6-digit code"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block">Full name</span>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-400" />
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-9 py-2 text-slate-100"
                placeholder="Your name"
              />
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block">Password</span>
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-400" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-cyan-300/20 bg-slate-800/75 px-9 py-2 text-slate-100"
                placeholder="Minimum 8 characters"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.45)] transition hover:brightness-105 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}

      {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}
      {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
    </Motion.div>
  );
};
