import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBenchmarkMetrics, finalizeBenchmark } from '../../js/core/benchmark.js';
import { createWorldState } from '../../js/core/world.js';

test('buildBenchmarkMetrics derives summary metrics from world state', () => {
  const world = createWorldState();
  world.tick = 10;
  world.metrics.completedTrips = 2;
  world.metrics.spawnedVehicles = 5;
  world.metrics.blockedMoves = 4;
  world.metrics.collisions = 1;
  world.metrics.deadlocks = 0;
  world.metrics.movedVehicles = 7;
  world.metrics.ticksSimulated = 10;
  world.metrics.completedTripTicks = 12;
  world.entities.vehicles = [{ id: 'vehicle-9' }];
  world.metrics.directionalFlow.north.spawned = 4;
  world.metrics.directionalFlow.north.completed = 4;
  world.metrics.directionalFlow.south.spawned = 4;
  world.metrics.directionalFlow.south.completed = 2;

  const metrics = buildBenchmarkMetrics(world);

  assert.equal(metrics.completedTrips, 2);
  assert.equal(metrics.avgCompletionTicks, 6);
  assert.equal(metrics.throughputPerTick, 0.2);
  assert.equal(metrics.blockedMoveRate, 0.4);
  assert.equal(metrics.completionRate, 0.4);
  assert.equal(metrics.activeVehicles, 1);
  assert.equal(metrics.fairnessByDirection.north.completionRate, 1);
  assert.equal(metrics.fairnessByDirection.south.completionRate, 0.5);
  assert.equal(metrics.fairnessScore, 0.5);
});

test('finalizeBenchmark produces a report with metrics and score', () => {
  const world = createWorldState({
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      durationTicks: 12,
      spawnRate: 0.5
    }
  });
  world.metrics.completedTrips = 1;
  world.metrics.spawnedVehicles = 2;
  world.metrics.ticksSimulated = 12;
  world.metrics.completedTripTicks = 4;

  const report = finalizeBenchmark(world);

  assert.equal(report.benchmark.mode, 'benchmark');
  assert.equal(report.metrics.avgCompletionTicks, 4);
  assert.equal(report.metrics.fairnessScore, 1);
  assert.equal(typeof report.score.total, 'number');
  assert.deepEqual(report.rules, world.config.rules);
});
