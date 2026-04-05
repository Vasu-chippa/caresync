import { useMemo, useState } from 'react';
import { BadgeIndianRupee, Building2, HandCoins, Star, Wallet } from 'lucide-react';
import { useAdminEarnings } from '../hooks';

export const AdminEarningsPage = () => {
  const [days, setDays] = useState(30);
  const earningsQuery = useAdminEarnings(days);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const summary = earningsQuery.data?.summary;
  const items = earningsQuery.data?.items || [];

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-emerald-300/20 bg-linear-to-r from-slate-950/85 via-slate-900/75 to-emerald-950/45 p-5 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
        <h1 className="text-2xl font-semibold text-slate-100">Earnings</h1>
        <p className="mt-1 text-sm text-slate-300">Platform revenue, doctor payouts, commission split, and doctor performance.</p>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface) p-3">
        <label className="text-sm text-(--text-soft)">Range</label>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm text-(--text-strong)"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {earningsQuery.isLoading ? (
        <div className="space-y-2 rounded-2xl border border-(--border) bg-(--surface) p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-12 animate-pulse rounded-lg bg-(--surface-muted)" />
          ))}
        </div>
      ) : earningsQuery.isError ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {earningsQuery.error.message}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs uppercase tracking-widest text-(--text-soft)">Gross Revenue</p>
              <p className="mt-2 text-2xl font-bold text-(--text-strong)">{currencyFormatter.format(summary?.totalGrossEarnings || 0)}</p>
              <p className="mt-1 text-xs text-(--text-soft)">All paid operations</p>
            </article>
            <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs uppercase tracking-widest text-(--text-soft)">Platform Commission</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">{currencyFormatter.format(summary?.totalPlatformCommission || 0)}</p>
              <p className="mt-1 text-xs text-(--text-soft)">Default 10% per paid operation</p>
            </article>
            <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs uppercase tracking-widest text-(--text-soft)">Doctor Payout</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">{currencyFormatter.format(summary?.totalDoctorPayout || 0)}</p>
              <p className="mt-1 text-xs text-(--text-soft)">Net amount for doctors</p>
            </article>
            <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
              <p className="text-xs uppercase tracking-widest text-(--text-soft)">Operations</p>
              <p className="mt-2 text-2xl font-bold text-(--text-strong)">{summary?.totalOps || 0}</p>
              <p className="mt-1 text-xs text-(--text-soft)">{summary?.doctorsWithPaidOps || 0} doctors with paid operations</p>
            </article>
          </div>

          <section className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-(--surface-muted) text-left text-(--text-soft)">
                  <tr>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Ops</th>
                    <th className="px-4 py-3">Gross</th>
                    <th className="px-4 py-3">Commission</th>
                    <th className="px-4 py-3">Doctor Gets</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.doctorId} className="border-t border-(--border)">
                      <td className="px-4 py-3">
                        <p className="font-medium text-(--text-strong)">{item.doctorName}</p>
                        <p className="text-xs text-(--text-soft)">{item.doctorEmail || 'No email'}</p>
                      </td>
                      <td className="px-4 py-3">{item.noOfOps}</td>
                      <td className="px-4 py-3">{currencyFormatter.format(item.grossEarnings)}</td>
                      <td className="px-4 py-3 text-cyan-300">{currencyFormatter.format(item.platformCommission)}</td>
                      <td className="px-4 py-3 text-emerald-300">{currencyFormatter.format(item.doctorPayout)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-300">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {item.averageRating || 0} ({item.totalReviews || 0})
                        </span>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-(--text-soft)">No paid operations found for this range.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            <article className="rounded-xl border border-(--border) bg-(--surface) p-3 text-xs text-(--text-soft)">
              <p className="mb-2 flex items-center gap-2 text-sm text-(--text-strong)"><Building2 size={15} /> Platform</p>
              Commission is collected into platform wallet first.
            </article>
            <article className="rounded-xl border border-(--border) bg-(--surface) p-3 text-xs text-(--text-soft)">
              <p className="mb-2 flex items-center gap-2 text-sm text-(--text-strong)"><HandCoins size={15} /> Doctor Settlement</p>
              Doctor payout is stored per paid operation and ready for settlement.
            </article>
            <article className="rounded-xl border border-(--border) bg-(--surface) p-3 text-xs text-(--text-soft)">
              <p className="mb-2 flex items-center gap-2 text-sm text-(--text-strong)"><Wallet size={15} /> Financial Safety</p>
              Each operation is tied to appointmentId and invoiceId for audit traceability.
            </article>
            <article className="rounded-xl border border-(--border) bg-(--surface) p-3 text-xs text-(--text-soft)">
              <p className="mb-2 flex items-center gap-2 text-sm text-(--text-strong)"><BadgeIndianRupee size={15} /> INR Ready</p>
              All calculations are presented in INR with commission and payout split.
            </article>
          </section>
        </>
      )}
    </section>
  );
};
