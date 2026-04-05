import { motion } from 'framer-motion';

export const MiniBarChart = ({ data, colorClass = 'bg-(--brand)' }) => {
  if (!data?.length) {
    return <div className="h-40 rounded-xl bg-(--surface-muted)" />;
  }

  const max = Math.max(...data.map((item) => item.count || item.utilizationPercent || 0), 1);

  return (
    <div className="flex h-40 items-end gap-2 overflow-x-auto">
      {data.map((item, index) => {
        const value = item.count ?? item.utilizationPercent ?? 0;
        const heightPercent = Math.max((value / max) * 100, 4);

        return (
          <div key={`${index}-${item.date || item.doctorId || value}`} className="min-w-8 flex-1 text-center">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: `${heightPercent}%` }}
              transition={{ delay: index * 0.03 }}
              className={`mx-auto w-full rounded-t-md ${colorClass}`}
            />
            <p className="mt-1 truncate text-[10px] text-(--text-soft)">{item.date || item.doctorId?.slice(-4) || '-'}</p>
          </div>
        );
      })}
    </div>
  );
};
