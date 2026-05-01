const DEFAULT_WINDOW_SIZE = 120;

export function createPerformanceTracker({ windowSize = DEFAULT_WINDOW_SIZE } = {}) {
  const samplesByMetric = new Map();

  return {
    record(metric, durationMs) {
      if (!metric || !Number.isFinite(durationMs) || durationMs < 0) {
        return null;
      }

      const samples = samplesByMetric.get(metric) ?? [];
      samples.push(durationMs);
      if (samples.length > windowSize) {
        samples.shift();
      }
      samplesByMetric.set(metric, samples);
      return buildMetricSnapshot(samples);
    },
    measure(metric, operation) {
      const startedAt = performance.now();
      const result = operation();
      const durationMs = performance.now() - startedAt;
      this.record(metric, durationMs);
      return result;
    },
    getSnapshot() {
      const metrics = {};
      for (const [metric, samples] of samplesByMetric.entries()) {
        metrics[metric] = buildMetricSnapshot(samples);
      }

      return metrics;
    },
    reset() {
      samplesByMetric.clear();
    }
  };
}

function buildMetricSnapshot(samples = []) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { samples: 0, avgMs: null, p95Ms: null, maxMs: null, latestMs: null };
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  const sorted = [...samples].sort((left, right) => left - right);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

  return {
    samples: samples.length,
    avgMs: total / samples.length,
    p95Ms: sorted[p95Index],
    maxMs: sorted[sorted.length - 1],
    latestMs: samples[samples.length - 1]
  };
}
