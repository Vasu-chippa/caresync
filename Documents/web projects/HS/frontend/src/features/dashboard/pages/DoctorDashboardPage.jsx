import { useMemo } from 'react';
import { Bell, CalendarClock, ClipboardCheck, Stethoscope, Star, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { MetricCard } from '../components/MetricCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useDoctorAnalytics } from '../../analytics/hooks';
import { useAppointmentsList } from '../../appointments/hooks';
import { usePrescriptionList } from '../../prescriptions/hooks';
import { useMe } from '../../auth/hooks';
import { useDoctorRatingStats } from '../../ratings/hooks';

const Motion = motion;

export const DoctorDashboardPage = () => {
  const meQuery = useMe();
  const analyticsQuery = useDoctorAnalytics(14);
  const appointmentsParams = useMemo(() => ({ page: 1, limit: 12, status: 'booked' }), []);
  const prescriptionsParams = useMemo(() => ({ page: 1, limit: 12 }), []);

  const appointmentsQuery = useAppointmentsList(appointmentsParams);
  const prescriptionsQuery = usePrescriptionList(prescriptionsParams);
  const ratingStatsQuery = useDoctorRatingStats(meQuery.data?._id);

  const isLoading = analyticsQuery.isLoading || appointmentsQuery.isLoading || prescriptionsQuery.isLoading;
  const error = analyticsQuery.error || appointmentsQuery.error || prescriptionsQuery.error;

  const prescriptions = useMemo(() => prescriptionsQuery.data?.items || [], [prescriptionsQuery.data]);
  const bookedAppointments = useMemo(() => appointmentsQuery.data?.items || [], [appointmentsQuery.data]);
  const today = new Date().toISOString().slice(0, 10);

  const prescriptionsOverTime = useMemo(() => {
    const counts = new Map();

    for (const item of prescriptions) {
      if (!item.createdAt) continue;
      const month = new Date(item.createdAt).toLocaleString('en-US', { month: 'short' });
      counts.set(month, (counts.get(month) || 0) + 1);
    }

    return Array.from(counts, ([week, consultations]) => ({ week, consultations }));
  }, [prescriptions]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error.message}</div>;
  }

  const appointmentsToday = bookedAppointments.filter((item) => item.date === today).length;
  const completedConsultations = bookedAppointments.filter((item) => item.status === 'completed').length;
  const pendingCases = bookedAppointments.filter((item) => ['booked', 'accepted'].includes(item.status)).length;

  const stats = [
    {
      title: 'Appointments (14d)',
      value: analyticsQuery.data?.summary?.totalAppointments || 0,
      subtitle: 'Tracked from live analytics',
      icon: Users,
      tone: 'cyan',
    },
    {
      title: "Today's Appointments",
      value: appointmentsToday,
      subtitle: 'Booked for today',
      icon: CalendarClock,
      tone: 'emerald',
    },
    {
      title: 'Prescriptions',
      value: prescriptionsQuery.data?.meta?.total || prescriptions.length,
      subtitle: 'Created in system',
      icon: ClipboardCheck,
      tone: 'violet',
    },
    {
      title: 'Rating',
      value: ratingStatsQuery.data?.averageRating || 'N/A',
      subtitle: ratingStatsQuery.data?.totalReviews ? `${ratingStatsQuery.data.totalReviews} reviews` : 'No reviews yet',
      icon: Star,
      tone: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/80 via-slate-900/75 to-violet-950/45 p-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
        <h1 className="text-2xl font-semibold text-slate-100">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-300">Live workload, appointments, and prescriptions from the system.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <MetricCard key={item.title} {...item} index={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Appointments Per Day</h2>
          <p className="text-xs text-slate-400">Live appointment counts from analytics</p>
          <div className="mt-4 h-64 min-h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={220} debounce={100}>
              <BarChart data={analyticsQuery.data?.charts?.appointmentsPerDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Prescriptions Trend</h2>
          <p className="text-xs text-slate-400">Recent prescriptions grouped by month</p>
          <div className="mt-4 h-64 min-h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={220} debounce={100}>
              <LineChart data={prescriptionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Line dataKey="consultations" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_1fr]">
        {ratingStatsQuery.data && ratingStatsQuery.data.totalReviews > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-6 md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-lg font-semibold text-slate-100">Patient Ratings</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-3">
                <p className="text-xs text-yellow-200/70">Overall Rating</p>
                <p className="mt-1 text-3xl font-bold text-yellow-300">{ratingStatsQuery.data.averageRating}</p>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: Math.round(ratingStatsQuery.data.averageRating) }).map((_, i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Reviews</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-300">{ratingStatsQuery.data.totalReviews}</p>
              </div>

              <Motion.a
                whileHover={{ scale: 1.05 }}
                href="/doctor/profile"
                className="block rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-center text-sm font-medium text-cyan-300 hover:border-cyan-300/50 transition"
              >
                View All Reviews
              </Motion.a>
            </div>
          </Motion.div>
        )}

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Booked Appointments</h2>
          <div className="mt-3 space-y-2">
            {bookedAppointments.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-slate-800/35 px-3 py-4 text-sm text-slate-300">
                No booked appointments assigned to you right now.
              </div>
            ) : (
              bookedAppointments.map((slot) => (
                <div key={slot.appointmentId} className="rounded-lg border border-white/10 bg-slate-800/45 p-3">
                  <p className="text-xs text-cyan-300">{slot.date} · {slot.timeSlot}</p>
                  <p className="text-sm font-medium text-slate-100">{slot.appointmentId}</p>
                  <p className="text-xs text-slate-400">Status: {slot.status}</p>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Recent Prescriptions</h2>
          <div className="mt-3 space-y-2">
            {prescriptions.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-slate-800/35 px-3 py-4 text-sm text-slate-300">
                No prescriptions created yet.
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div key={prescription.prescriptionId} className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-100">{prescription.prescriptionId}</p>
                  <p className="text-xs text-slate-400">{prescription.diagnosis || 'No diagnosis recorded'}</p>
                  <p className="text-xs text-slate-500">{prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : ''}</p>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Bell size={16} className="text-amber-300" />
            Workload Snapshot
          </h2>
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            <div className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2">Completed consultations: {completedConsultations}</div>
            <div className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2">Open cases: {pendingCases}</div>
            <div className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2">Analytics window: {analyticsQuery.data?.meta?.days || 14} days</div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};


