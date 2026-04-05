import { motion } from 'framer-motion';

export const SlotPicker = ({ slots, selectedSlot, onSelect }) => {
  if (!slots?.length) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
        Doctor not available for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot, index) => (
        <motion.button
          key={slot}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
          onClick={() => onSelect(slot)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            selectedSlot === slot
              ? 'border-transparent bg-(--brand) text-white'
              : 'border-(--border) bg-(--surface) text-(--text-strong)'
          }`}
        >
          {slot}
        </motion.button>
      ))}
    </div>
  );
};
