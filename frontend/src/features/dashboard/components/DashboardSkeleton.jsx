export const DashboardSkeleton = () => {
  return (
    <div className="space-y-5">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-700/50" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-2xl bg-slate-800/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-800/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-800/60" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-slate-800/60" />
    </div>
  );
};
