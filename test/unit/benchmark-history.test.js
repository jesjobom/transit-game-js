import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBenchmarkComparison,
  createBenchmarkHistoryStore,
  createBenchmarkSnapshot
} from '../../js/app/benchmark/history.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

function createReport(overrides = {}) {
  return {
    simulationSeed: 123,
    mapSeed: 456,
    mapId: 'baseline-benchmark',
    tick: 60,
    benchmark: {
      mode: 'benchmark',
      durationTicks: 60,
      spawnRate: 0.55
    },
    metrics: {
      completedTrips: 12,
      throughputPerTick: 0.2,
      avgCompletionTicks: 5.5,
      avgStoppedTicks: 1.25,
      avgQueueLength: 0.8,
      deadlocks: 0,
      fairnessScore: 0.75,
      lightChanges: 6
    },
    score: {
      total: 240
    },
    runtimePerformance: {
      render: {
        avgMs: 6.2,
        p95Ms: 9.4
      }
    },
    rules: {
      freeRightOnRed: false,
      fourWayStop: false,
      doNotBlockIntersection: true
    },
    ...overrides
  };
}

test('createBenchmarkSnapshot preserves benchmark metadata used for A/B comparisons', () => {
  const snapshot = createBenchmarkSnapshot(createReport(), {
    createdAt: '2026-05-01T10:00:00.000Z',
    scenarioId: 'baseline-benchmark',
    scenarioName: 'Baseline benchmark grid',
    appVersion: 'Sprint 25 (s25-benchmark-history-ab)'
  });

  assert.equal(snapshot.scenarioName, 'Baseline benchmark grid');
  assert.equal(snapshot.simulationSeed, 123);
  assert.equal(snapshot.mapSeed, 456);
  assert.equal(snapshot.metrics.completedTrips, 12);
  assert.equal(snapshot.score.total, 240);
  assert.equal(snapshot.runtimePerformance.render.avgMs, 6.2);
  assert.match(snapshot.id, /baseline-benchmark-grid|baseline-benchmark/);
});

test('createBenchmarkHistoryStore saves snapshots newest-first and builds comparisons', () => {
  const storage = createMemoryStorage();
  const history = createBenchmarkHistoryStore({ storage, storageKey: 'test-history' });

  const older = history.saveReport(createReport(), {
    createdAt: '2026-05-01T10:00:00.000Z',
    scenarioId: 'baseline-benchmark',
    scenarioName: 'Baseline benchmark grid'
  });

  const newer = history.saveReport(createReport({
    simulationSeed: 789,
    mapSeed: 987,
    metrics: {
      completedTrips: 15,
      throughputPerTick: 0.25,
      avgCompletionTicks: 4.75,
      avgStoppedTicks: 0.9,
      avgQueueLength: 0.55,
      deadlocks: 0,
      fairnessScore: 0.9,
      lightChanges: 8
    },
    score: {
      total: 315
    },
    runtimePerformance: {
      render: {
        avgMs: 5.1,
        p95Ms: 7.8
      }
    }
  }), {
    createdAt: '2026-05-01T10:05:00.000Z',
    scenarioId: 'baseline-benchmark',
    scenarioName: 'Baseline benchmark grid'
  });

  const snapshots = history.loadSnapshots();
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].id, newer.id);
  assert.equal(snapshots[1].id, older.id);

  const comparison = history.buildComparison(older.id, newer.id);
  assert.equal(comparison.scoreDelta, 75);
  assert.equal(comparison.completedTripsDelta, 3);
  assert.equal(comparison.deadlocksDelta, 0);
  assert.equal(comparison.lightChangesDelta, 2);
  assert.ok(Math.abs(comparison.fairnessDelta - 0.15) < 1e-9);
  assert.ok(Math.abs(comparison.renderAvgDelta - -1.1) < 1e-9);
});

test('buildBenchmarkComparison returns null when either side is missing', () => {
  assert.equal(buildBenchmarkComparison(null, createBenchmarkSnapshot(createReport())), null);
});
