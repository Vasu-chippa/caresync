import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CalendarCheck2,
  ClipboardList,
  CreditCard,
  Pill,
  ReceiptText,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassPanel } from '../components/GlassPanel';
import { MetricCard } from '../components/MetricCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useAppointmentsList } from '../../appointments/hooks';
import { usePrescriptionList } from '../../prescriptions/hooks';
import { useInvoices } from '../../billing/hooks';

const Motion = motion;
const pieColors = ['#22d3ee', '#f59e0b', '#10b981', '#a78bfa'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const groupByMonth = (items, field) => {
  const months = new Map();

  for (const item of items) {
    const rawDate = item[field];
    if (!rawDate) continue;

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) continue;

    const key = parsedDate.toLocaleString('en-US', { month: 'short' });
    months.set(key, (months.get(key) || 0) + 1);
  }

  return Array.from(months, ([month, count]) => ({ month, count }));
};

const buildActivityFeed = ({ appointments, prescriptions, invoices }) => {
  const entries = [
    ...appointments.map((item) => ({
      id: item.appointmentId,
      label: `Appointment ${item.appointmentId} ${item.status}`,
      createdAt: item.createdAt,
    })),
    ...prescriptions.map((item) => ({
      id: item.prescriptionId,
      label: `Prescription ${item.prescriptionId}${item.diagnosis ? ` - ${item.diagnosis}` : ''}`,
      createdAt: item.createdAt,
    })),
    ...invoices.map((item) => ({
      id: item.invoiceId,
      label: `Invoice ${item.invoiceId} ${item.paymentStatus}`,
      createdAt: item.createdAt,
    })),
  ];

  return entries
    .filter((item) => item.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5)
    .map((item) => item.label);
};

export const PatientDashboardPage = () => {
  const appointmentsParams = useMemo(() => ({ page: 1, limit: 50 }), []);
  const prescriptionsParams = useMemo(() => ({ page: 1, limit: 50 }), []);
  const invoicesParams = useMemo(() => ({ page: 1, limit: 50 }), []);

  const appointmentsQuery = useAppointmentsList(appointmentsParams);
  const prescriptionsQuery = usePrescriptionList(prescriptionsParams);
  const invoicesQuery = useInvoices(invoicesParams);

  const isLoading = appointmentsQuery.isLoading || prescriptionsQuery.isLoading || invoicesQuery.isLoading;
  const error = appointmentsQuery.error || prescriptionsQuery.error || invoicesQuery.error;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error.message}</div>;
  }

  const appointments = appointmentsQuery.data?.items || [];
  const prescriptions = prescriptionsQuery.data?.items || [];
  const invoices = invoicesQuery.data?.items || [];

  const totalAppointments = appointmentsQuery.data?.meta?.total ?? appointments.length;
  const upcomingAppointments = appointments.filter((item) => {
    const itemDate = new Date(item.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ['booked', 'accepted'].includes(item.status) && itemDate >= today;
  }).length;
  const prescriptionsCount = prescriptionsQuery.data?.meta?.total ?? prescriptions.length;
  const pendingBillAmount = invoices
    .filter((item) => item.paymentStatus !== 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const metrics = [
    {
      title: 'Total Appointments',
      value: totalAppointments,
      subtitle: 'All live records',
      icon: ClipboardList,
      tone: 'cyan',
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments,
      subtitle: 'Booked or accepted',
      icon: CalendarCheck2,
      tone: 'emerald',
    },
    {
      title: 'Prescriptions Count',
      value: prescriptionsCount,
      subtitle: 'Stored in system',
      icon: Pill,
      tone: 'violet',
    },
    {
      title: 'Pending Bills',
      value: formatCurrency(pendingBillAmount),
      subtitle: 'Unpaid invoices only',
      icon: ReceiptText,
      tone: 'amber',
    },
  ];

  const appointmentsOverTime = groupByMonth(appointments, 'date');
  const billingDistribution = [
    { name: 'Paid', value: invoices.filter((item) => item.paymentStatus === 'paid').length },
    { name: 'Pending', value: invoices.filter((item) => item.paymentStatus === 'pending').length },
    { name: 'Cancelled', value: invoices.filter((item) => item.paymentStatus === 'cancelled').length },
  ].filter((item) => item.value > 0);

  const recentActivity = buildActivityFeed({ appointments, prescriptions, invoices });
  const statusBreakdown = [
    { label: 'Booked', value: appointments.filter((item) => item.status === 'booked').length },
    { label: 'Accepted', value: appointments.filter((item) => item.status === 'accepted').length },
    { label: 'Completed', value: appointments.filter((item) => item.status === 'completed').length },
    { label: 'Cancelled', value: appointments.filter((item) => item.status === 'cancelled').length },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-300/20 bg-linear-to-r from-slate-950/80 via-slate-900/75 to-cyan-950/45 p-6 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
        <h1 className="text-2xl font-semibold text-slate-100">Patient Dashboard</h1>
        <p className="mt-1 text-sm text-slate-300">Live appointment, prescription, and billing data from the system.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => (
          <MetricCard key={item.title} {...item} index={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Appointments Over Time</h2>
          <p className="text-xs text-slate-400">Live appointment records grouped by month</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#22d3ee' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Billing Distribution</h2>
          <p className="text-xs text-slate-400">Billing status split from live invoices</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Pie
                  data={billingDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {billingDistribution.map((item, idx) => (
                    <Cell key={item.name} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Recent Activity</h2>
          <div className="mt-3 space-y-2">
            {recentActivity.length ? recentActivity.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
                <Activity size={16} className="text-cyan-300" />
                <span>{item}</span>
              </div>
            )) : <div className="rounded-lg border border-white/10 bg-slate-800/40 px-3 py-2 text-sm text-slate-300">No activity yet.</div>}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Live Status</h2>
          <div className="mt-3 space-y-3">
            {statusBreakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-200">{item.label}</span>
                <span className="ml-auto text-slate-400">{item.value}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Book Appointment', icon: CalendarCheck2, tone: 'hover:shadow-cyan-500/30' },
              { label: 'View Prescriptions', icon: Pill, tone: 'hover:shadow-violet-500/30' },
              { label: 'Pay Bills', icon: CreditCard, tone: 'hover:shadow-emerald-500/30' },
            ].map((action) => (
              <Motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 shadow-lg transition ${action.tone}`}
                title={action.label}
              >
                <span>{action.label}</span>
                <action.icon size={16} className="text-cyan-300" />
              </Motion.button>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};


