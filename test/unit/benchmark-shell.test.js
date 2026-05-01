import test from 'node:test';
import assert from 'node:assert/strict';

import { createBenchmarkShell } from '../../js/app/benchmark/benchmark-shell.js';

test('createBenchmarkShell summarizes render and light benchmark signals', () => {
  const shell = createBenchmarkShell();
  const lines = shell.summarize({
    benchmark: { mode: 'benchmark' },
    metrics: {
      ticksSimulated: 60,
      completedTrips: 12,
      throughputPerTick: 0.2,
      avgCompletionTicks: 5.5,
      fairnessScore: 0.75,
      lightChanges: 7
    },
    runtimePerformance: {
      render: {
        avgMs: 6.2,
        p95Ms: 9.4
      }
    },
    score: { total: 240 }
  });

  assert.match(lines.join('\n'), /Light changes: 7/);
  assert.match(lines.join('\n'), /Render avg ms: 6.20/);
  assert.match(lines.join('\n'), /Render p95 ms: 9.40/);
});
