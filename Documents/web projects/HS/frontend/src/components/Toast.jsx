import { m as motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  type = 'info', // 'success', 'error', 'info'
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}) => {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'border-green-500/50 bg-green-500/10',
      textColor: 'text-green-300',
      iconColor: 'text-green-400',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'border-red-500/50 bg-red-500/10',
      textColor: 'text-red-300',
      iconColor: 'text-red-400',
    },
    info: {
      icon: Info,
      bgColor: 'border-blue-500/50 bg-blue-500/10',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  if (autoClose) {
    setTimeout(onClose, duration);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`rounded-lg border p-4 flex items-center gap-3 ${config.bgColor} ${config.textColor}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
