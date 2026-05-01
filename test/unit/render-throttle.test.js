import test from 'node:test';
import assert from 'node:assert/strict';

import { captureOverlayMetricsSnapshot, createRenderThrottleCache, shouldRefreshAtTick } from '../../js/app/perf/render-throttle.js';

test('shouldRefreshAtTick respects intervals and force refresh', () => {
  assert.equal(shouldRefreshAtTick(5, -1, 2, false), true);
  assert.equal(shouldRefreshAtTick(5, 4, 2, false), false);
  assert.equal(shouldRefreshAtTick(6, 4, 2, false), true);
  assert.equal(shouldRefreshAtTick(5, 5, 2, true), true);
});

test('captureOverlayMetricsSnapshot clones only overlay-related metrics', () => {
  const metrics = {
    cellStatsByKey: { '1,1': { blockedTicks: 2 } },
    intersectionThroughputByKey: { '1,1': 3 },
    deadlocks: 9
  };

  const snapshot = captureOverlayMetricsSnapshot(metrics);
  metrics.cellStatsByKey['1,1'].blockedTicks = 99;

  assert.deepEqual(snapshot, {
    cellStatsByKey: { '1,1': { blockedTicks: 2 } },
    intersectionThroughputByKey: { '1,1': 3 }
  });
});

test('createRenderThrottleCache starts empty and reusable', () => {
  assert.deepEqual(createRenderThrottleCache(), {
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
  });
});
