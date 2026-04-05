import { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  FileWarning,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { GlassPanel } from '../components/GlassPanel';
import { useAdminAnalytics } from '../../analytics/hooks';
import { useAppointmentsList } from '../../appointments/hooks';
import { useInvoices } from '../../billing/hooks';
import { useDoctors } from '../../doctors/hooks';

export const AdminDashboardPage = () => {
  const analyticsQuery = useAdminAnalytics(14);
  const appointmentsParams = useMemo(() => ({ page: 1, limit: 50 }), []);
  const invoicesParams = useMemo(() => ({ page: 1, limit: 50 }), []);

  const appointmentsQuery = useAppointmentsList(appointmentsParams);
  const invoicesQuery = useInvoices(invoicesParams);
  const doctorsQuery = useDoctors();

  const isLoading = analyticsQuery.isLoading || appointmentsQuery.isLoading || invoicesQuery.isLoading || doctorsQuery.isLoading;
  const error = analyticsQuery.error || appointmentsQuery.error || invoicesQuery.error || doctorsQuery.error;

  const doctorMap = useMemo(() => {
    return new Map((doctorsQuery.data || []).map((doctor) => [String(doctor.id || doctor._id), doctor]));
  }, [doctorsQuery.data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error.message}</div>;
  }

  const appointments = appointmentsQuery.data?.items || [];
  const invoices = invoicesQuery.data?.items || [];
  const analytics = analyticsQuery.data || {};
  const today = new Date().toISOString().slice(0, 10);
  const appointmentsToday = appointments.filter((item) => item.date === today && item.status !== 'cancelled').length;
  const paidInvoices = invoices.filter((item) => item.paymentStatus === 'paid').length;
  const pendingInvoices = invoices.filter((item) => item.paymentStatus !== 'paid').length;
  const pieColors = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b'];

  const stats = [
    {
      title: 'Total Patients',
      value: analytics.summary?.totalPatients || 0,
      subtitle: 'Verified users in system',
      icon: UserRound,
      tone: 'cyan',
    },
    {
      title: 'Total Doctors',
      value: analytics.summary?.totalDoctors || 0,
      subtitle: 'Credentialed staff',
      icon: Users,
      tone: 'violet',
    },
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(analytics.summary?.totalRevenue || 0),
      subtitle: 'Paid invoices only',
      icon: CircleDollarSign,
      tone: 'emerald',
    },
    {
      title: 'Appointments Today',
      value: appointmentsToday,
      subtitle: 'Live system count',
      icon: CalendarClock,
      tone: 'amber',
    },
  ];

  const usageData = [
    { name: 'Paid', value: paidInvoices },
    { name: 'Pending', value: pendingInvoices },
    { name: 'Appointments', value: appointments.length },
    { name: 'Doctors', value: analytics.summary?.totalDoctors || 0 },
  ].filter((item) => item.value > 0);

  const doctorUtilization = (analytics.charts?.doctorUtilization || []).map((item) => ({
    ...item,
    doctorName: doctorMap.get(String(item.doctorId))?.name || String(item.doctorId),
  }));

  const recentOperations = [
    ...appointments.slice(0, 3).map((item) => `Appointment ${item.appointmentId} ${item.status}`),
    ...invoices.slice(0, 2).map((item) => `Invoice ${item.invoiceId} ${item.paymentStatus}`),
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/85 via-slate-900/75 to-emerald-950/45 p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        <h1 className="text-2xl font-semibold text-slate-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-300">Live system analytics for revenue, operations, and utilization.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <MetricCard key={item.title} {...item} index={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <GlassPanel>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <CircleDollarSign size={16} className="text-emerald-300" />
            Revenue Analytics
          </h2>
          <p className="text-xs text-slate-400">Live appointments by day from analytics</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.charts?.appointmentsPerDay || []}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#34d399" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <BarChart3 size={16} className="text-cyan-300" />
            Department Performance
          </h2>
          <p className="text-xs text-slate-400">Top doctors by utilization from live analytics</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorUtilization.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="doctorName" type="category" stroke="#94a3b8" width={110} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Bar dataKey="utilizationPercent" fill="#22d3ee" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">System Usage</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Pie data={usageData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={48}>
                  {usageData.map((item, idx) => (
                    <Cell key={item.name} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Recent Operations</h2>
          <div className="mt-3 space-y-2">
            {recentOperations.length ? recentOperations.map((log) => (
              <div key={log} className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2 text-sm text-slate-200">
                {log}
              </div>
            )) : <div className="rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2 text-sm text-slate-300">No live operations yet.</div>}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel>
            <h2 className="text-lg font-semibold text-slate-100">System Summary</h2>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Verified users', value: analytics.summary?.totalUsers || 0 },
                { label: 'Verified doctors', value: analytics.summary?.totalDoctors || 0 },
                { label: 'Verified patients', value: analytics.summary?.totalPatients || 0 },
                { label: 'Paid invoices', value: paidInvoices },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/45 px-3 py-2 text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-semibold text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <AlertTriangle size={16} className="text-amber-300" />
              Utilization Notes
            </h2>
            <div className="mt-3 space-y-2">
              {doctorUtilization.length ? doctorUtilization.slice(0, 3).map((doctor) => (
                <div key={doctor.doctorId} className="rounded-lg border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-sm text-slate-200">
                  <div className="flex items-start gap-2">
                    <FileWarning size={14} className="mt-0.5 shrink-0 text-amber-300" />
                    <span>{doctor.doctorName}: {doctor.utilizationPercent}% utilization</span>
                  </div>
                </div>
              )) : <div className="rounded-lg border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-sm text-slate-200">No doctor utilization data yet.</div>}
              <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Analytics reflects live database records only.
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};


