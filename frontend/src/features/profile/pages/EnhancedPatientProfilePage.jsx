import { useEffect, useMemo, useState } from 'react';
import { Mail, Shield, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMe, useUpdateProfile } from '../../auth/hooks';

const Motion = motion;
const DEFAULT_AVATAR = '/default-avatar.svg';

export const EnhancedPatientProfilePage = () => {
  const meQuery = useMe();
  const updateProfileMutation = useUpdateProfile();
  const user = meQuery.data;

  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setName(user.name || '');
    setPreviewUrl(user.avatarPath || '');
  }, [user]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const avatarSrc = useMemo(() => previewUrl || user?.avatarPath || DEFAULT_AVATAR, [previewUrl, user?.avatarPath]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    try {
      const payload = new FormData();
      payload.append('name', name);
      if (selectedFile) {
        payload.append('avatar', selectedFile);
      }

      await updateProfileMutation.mutateAsync(payload);
      setSelectedFile(null);
      setFeedback('Profile updated successfully.');
      setEditMode(false);
    } catch (error) {
      setFeedback(error.message || 'Failed to update profile.');
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-800/70" />
      </div>
    );
  }

  if (meQuery.isError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{meQuery.error.message}</p>;
  }

  return (
    <section className="space-y-6">
      {/* Hero Section with Avatar */}
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-linear-to-br from-slate-950/90 via-slate-900/80 to-blue-950/40 p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
      >
        <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[200px_1fr]">
          {/* Avatar */}
          <Motion.div
            whileHover={{ scale: 1.05 }}
            className="flex justify-center md:justify-start"
          >
            <div className="relative">
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-48 w-48 rounded-2xl border-4 border-cyan-300/30 object-cover shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              />
              {editMode && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cyan-300/30 bg-slate-900/95 px-2 py-1 text-xs text-cyan-300 hover:border-cyan-300/50 hover:bg-slate-800/95 transition"
                >
                  <span>📷</span>
                  Change
                </label>
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                disabled={!editMode}
                className="hidden"
              />
            </div>
          </Motion.div>

          {/* Profile Info */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-cyan-300">My Account</p>
              {editMode ? (
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-cyan-300/30 bg-slate-900/50 px-4 py-2 text-3xl font-bold text-slate-100 outline-none focus:border-cyan-300/50"
                  placeholder="Your name"
                />
              ) : (
                <h1 className="text-4xl font-bold text-slate-100">{name || user?.name || 'Patient'}</h1>
              )}
              <p className="mt-2 text-lg text-slate-300">Patient • Active member</p>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Mail size={16} className="text-cyan-300" /> {user?.email}</p>
              <p className="flex items-center gap-2"><Shield size={16} className="text-cyan-300" /> {user?.isVerified ? 'Verified' : 'Verification pending'}</p>
              <p className="flex items-center gap-2"><UserRound size={16} className="text-cyan-300" /> Member since {new Date(user?.createdAt).toLocaleDateString('en-IN')}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!editMode ? (
                <Motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditMode(true)}
                  type="button"
                  className="rounded-lg bg-cyan-400 px-6 py-2 font-semibold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Edit Profile
                </Motion.button>
              ) : (
                <>
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="rounded-lg bg-cyan-400 px-6 py-2 font-semibold text-slate-950 disabled:opacity-60"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Motion.button>
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setName(user?.name || '');
                      setSelectedFile(null);
                      setPreviewUrl(user?.avatarPath || '');
                    }}
                    className="rounded-lg border border-slate-600 px-6 py-2 font-semibold text-slate-300 hover:bg-slate-800/50 transition"
                  >
                    Cancel
                  </Motion.button>
                </>
              )}
            </div>

            {feedback && (
              <p className={`text-sm ${feedback.includes('successfully') ? 'text-cyan-200' : 'text-red-300'}`}>
                {feedback}
              </p>
            )}
          </div>
        </form>
      </Motion.div>

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-sm uppercase tracking-widest text-slate-400">Account Status</p>
          <p className="mt-3 text-2xl font-bold text-cyan-300">
            {user?.isVerified ? '✓ Verified' : 'Pending'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Email {user?.isVerified ? 'confirmed' : 'verification required'}</p>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-sm uppercase tracking-widest text-slate-400">Role</p>
          <p className="mt-3 text-2xl font-bold text-cyan-300">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</p>
          <p className="mt-1 text-xs text-slate-400">Healthcare consumer</p>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
        >
          <p className="text-sm uppercase tracking-widest text-slate-400">Member Since</p>
          <p className="mt-3 text-sm font-bold text-cyan-300">
            {new Date(user?.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
            })}
          </p>
          <p className="mt-1 text-xs text-slate-400">Active member</p>
        </Motion.div>
      </div>

      {/* Quick Actions */}
      <Motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Motion.a
            whileHover={{ scale: 1.05 }}
            href="/appointments/book"
            className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-center text-sm font-medium text-cyan-300 hover:border-cyan-300/50 transition"
          >
            📅 Book Appointment
          </Motion.a>
          <Motion.a
            whileHover={{ scale: 1.05 }}
            href="/prescriptions"
            className="rounded-lg border border-purple-300/30 bg-purple-400/10 px-4 py-3 text-center text-sm font-medium text-purple-300 hover:border-purple-300/50 transition"
          >
            💊 My Prescriptions
          </Motion.a>
          <Motion.a
            whileHover={{ scale: 1.05 }}
            href="/appointments/my-appointments"
            className="rounded-lg border border-green-300/30 bg-green-400/10 px-4 py-3 text-center text-sm font-medium text-green-300 hover:border-green-300/50 transition"
          >
            📋 My Appointments
          </Motion.a>
          <Motion.a
            whileHover={{ scale: 1.05 }}
            href="/billing/invoices"
            className="rounded-lg border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-center text-sm font-medium text-orange-300 hover:border-orange-300/50 transition"
          >
            💳 My Bills
          </Motion.a>
        </div>
      </Motion.section>
    </section>
  );
};
