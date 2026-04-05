import { useEffect, useMemo, useState } from 'react';
import { Camera, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMe, useUpdateProfile } from '../../auth/hooks';

const Motion = motion;
const DEFAULT_AVATAR = '/default-avatar.svg';

export const ProfilePage = () => {
  const meQuery = useMe();
  const updateProfileMutation = useUpdateProfile();
  const user = meQuery.data;

  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || '');
    setPreviewUrl(user.avatarUrl || '');
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

  const avatarSrc = useMemo(() => previewUrl || user?.avatarUrl || DEFAULT_AVATAR, [previewUrl, user?.avatarUrl]);

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
    } catch (error) {
      setFeedback(error.message || 'Failed to update profile.');
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="h-52 animate-pulse rounded-2xl bg-slate-800/70" />
      </div>
    );
  }

  if (meQuery.isError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{meQuery.error.message}</p>;
  }

  return (
    <section className="space-y-5">
      <Motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/80 via-slate-900/70 to-cyan-950/45 p-6 shadow-[0_0_30px_rgba(34,211,238,0.14)]"
      >
        <h1 className="text-2xl font-semibold text-slate-100">My Profile</h1>
        <p className="mt-1 text-sm text-slate-300">Manage your account details and profile picture.</p>
      </Motion.header>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <article className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-5 shadow-[0_0_22px_rgba(15,23,42,0.45)]">
          <div className="mx-auto w-fit">
            <div className="relative">
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-40 w-40 rounded-2xl border border-cyan-300/25 object-cover shadow-[0_0_24px_rgba(34,211,238,0.18)]"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cyan-300/25 bg-slate-900/90 px-2 py-1 text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-slate-800"
              >
                <Camera size={13} />
                Upload
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">If no image is uploaded, a default avatar is used.</p>
        </article>

        <article className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-5 shadow-[0_0_22px_rgba(15,23,42,0.45)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-300">Full Name</span>
              <div className="relative">
                <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/70 px-9 py-2 text-slate-100 outline-none focus:border-cyan-300/40"
                />
              </div>
            </label>

            <div className="text-sm">
              <span className="mb-1 block text-slate-300">Email</span>
              <div className="inline-flex w-full items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-slate-200">
                <Mail size={14} className="text-cyan-300" />
                {user?.email || '-'}
              </div>
            </div>

            <div className="text-sm">
              <span className="mb-1 block text-slate-300">Role</span>
              <div className="inline-flex w-full items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-slate-200 capitalize">
                <ShieldCheck size={14} className="text-cyan-300" />
                {user?.role || '-'}
              </div>
            </div>
          </div>

          {feedback ? <p className="mt-4 text-sm text-cyan-200">{feedback}</p> : null}

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:brightness-105 disabled:opacity-60"
          >
            <Save size={15} />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </article>
      </form>
    </section>
  );
};
