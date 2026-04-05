const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

const format = (level, message, meta) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  return JSON.stringify(payload);
};

export const logger = {
  info(message, meta = {}) {
    console.log(format(levels.info, message, meta));
  },
  warn(message, meta = {}) {
    console.warn(format(levels.warn, message, meta));
  },
  error(message, meta = {}) {
    console.error(format(levels.error, message, meta));
  },
};
