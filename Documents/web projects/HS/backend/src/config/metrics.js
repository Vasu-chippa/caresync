const createMetricsState = () => ({
  requestCount: 0,
  errorCount: 0,
  totalLatencyMs: 0,
  cacheHits: 0,
  cacheMisses: 0,
  startedAt: Date.now(),
});

const state = createMetricsState();

export const metrics = {
  request(durationMs) {
    state.requestCount += 1;
    state.totalLatencyMs += durationMs;
  },

  error() {
    state.errorCount += 1;
  },

  cacheHit() {
    state.cacheHits += 1;
  },

  cacheMiss() {
    state.cacheMisses += 1;
  },

  snapshot() {
    const uptimeSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    const avgLatencyMs = state.requestCount
      ? Number((state.totalLatencyMs / state.requestCount).toFixed(2))
      : 0;

    return {
      uptimeSeconds,
      requestCount: state.requestCount,
      errorCount: state.errorCount,
      avgLatencyMs,
      cacheHits: state.cacheHits,
      cacheMisses: state.cacheMisses,
      cacheHitRate:
        state.cacheHits + state.cacheMisses > 0
          ? Number(
              ((state.cacheHits / (state.cacheHits + state.cacheMisses)) * 100).toFixed(2)
            )
          : 0,
      process: {
        memoryRssMb: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)),
      },
    };
  },

  reset() {
    Object.assign(state, createMetricsState());
  },
};
