export function shouldRefreshAtTick(currentTick, lastTick, intervalTicks = 1, force = false) {
  if (force) {
    return true;
  }

  if (!Number.isFinite(intervalTicks) || intervalTicks <= 1) {
    return true;
  }

  if (!Number.isFinite(lastTick) || lastTick < 0) {
    return true;
  }

  return currentTick - lastTick >= intervalTicks;
}

export function captureOverlayMetricsSnapshot(metrics = {}) {
  return {
    cellStatsByKey: structuredClone(metrics.cellStatsByKey ?? {}),
    intersectionThroughputByKey: structuredClone(metrics.intersectionThroughputByKey ?? {})
  };
}

export function createRenderThrottleCache() {
  return {
    overlayTick: -1,
    overlayMetrics: null,
    summaryTick: -1,
    summaryLines: [],
    diagnosticsTick: -1,
    diagnostics: {
      metrics: [],
      lights: [],
      events: []
    },
    inspectionTick: -1,
    inspectionLines: []
  };
}
