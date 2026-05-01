export function createBenchmarkShell() {
  return {
    status: 'ready',
    summarize(report) {
      if (!report) {
        return ['Benchmark report unavailable'];
      }

      return [
        `Benchmark mode: ${report.benchmark.mode}`,
        `Duration: ${report.metrics.ticksSimulated} ticks`,
        `Completed trips: ${report.metrics.completedTrips}`,
        `Throughput/tick: ${report.metrics.throughputPerTick.toFixed(3)}`,
        `Avg completion ticks: ${report.metrics.avgCompletionTicks.toFixed(2)}`,
        `Light changes: ${report.metrics.lightChanges ?? 0}`,
        `Render avg ms: ${formatPerf(report.runtimePerformance?.render?.avgMs)}`,
        `Render p95 ms: ${formatPerf(report.runtimePerformance?.render?.p95Ms)}`,
        `Fairness: ${Number(report.metrics.fairnessScore ?? 1).toFixed(2)}`,
        `Score: ${report.score.total}`
      ];
    }
  };
}

function formatPerf(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}
