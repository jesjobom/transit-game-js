import test from 'node:test';
import assert from 'node:assert/strict';

import { createPerformanceTracker } from '../../js/app/perf/performance-tracker.js';

test('performance tracker records rolling averages, p95, and max values', () => {
  const tracker = createPerformanceTracker({ windowSize: 4 });

  tracker.record('tick', 2);
  tracker.record('tick', 4);
  tracker.record('tick', 6);
  tracker.record('tick', 8);
  tracker.record('tick', 10);

  const snapshot = tracker.getSnapshot();

  assert.deepEqual(snapshot.tick, {
    samples: 4,
    avgMs: 7,
    p95Ms: 10,
    maxMs: 10,
    latestMs: 10
  });
});

test('performance tracker measure executes the operation and stores the sample', () => {
  const tracker = createPerformanceTracker();

  const result = tracker.measure('render', () => 'ok');
  const snapshot = tracker.getSnapshot();

  assert.equal(result, 'ok');
  assert.equal(snapshot.render.samples, 1);
  assert.ok(snapshot.render.avgMs >= 0);
  assert.ok(snapshot.render.latestMs >= 0);
});

test('performance tracker reset clears previously recorded metrics', () => {
  const tracker = createPerformanceTracker();

  tracker.record('diagnostics', 3);
  tracker.reset();

  assert.deepEqual(tracker.getSnapshot(), {});
});
