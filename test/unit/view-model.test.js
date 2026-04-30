import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBenchmarkComparisonLines,
  buildBenchmarkHistoryLines,
  buildCellInspectionLines,
  buildLightPhaseSummary,
  buildLiveMetrics,
  buildRecentEventSummary,
  buildSimulationSummary
} from '../../js/app/ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from '../../js/app/version.js';
import { createWorldState } from '../../js/core/world.js';

test('buildSimulationSummary includes version, seeds, status, and benchmark summary', () => {
  const world = createWorldState();
  world.tick = 7;
  world.status = 'running';
  world.entities.vehicles = [{ id: 'vehicle-1' }];

  const lines = buildSimulationSummary(world, ['Score: 12']);

  assert.equal(lines[0], `Version: ${APP_VERSION} (${BUILD_TAG})`);
  assert.match(lines.join('\n'), /Mode:/);
  assert.match(lines.join('\n'), /Simulation seed:/);
  assert.match(lines.join('\n'), /Map seed:/);
  assert.match(lines.join('\n'), /Tick: 7/);
  assert.match(lines.join('\n'), /Status: running/);
  assert.match(lines.join('\n'), /Active vehicles: 1/);
  assert.match(lines.join('\n'), /Score: 12/);
});

test('buildLiveMetrics exposes key live counters and score', () => {
  const world = createWorldState();
  world.tick = 9;
  world.status = 'running';
  world.config.benchmark.mode = 'sandbox';
  world.metrics.spawnedVehicles = 4;
  world.metrics.movedVehicles = 11;
  world.metrics.blockedMoves = 3;
  world.metrics.completedTrips = 2;
  world.metrics.turnsTaken = 5;
  world.entities.vehicles = [{ id: 'v1' }, { id: 'v2' }];

  world.metrics.deadlocks = 1;

  const metrics = buildLiveMetrics(world, {
    metrics: { throughputPerTick: 0.25, avgCompletionTicks: 4.5, avgStoppedTicks: 1.25, avgQueueLength: 0.75, avgRoadOccupancy: 0.4, fairnessScore: 0.6 },
    score: { total: 185 }
  });

  assert.deepEqual(metrics[0], { label: 'Tick', value: '9' });
  assert.ok(metrics.some((entry) => entry.label === 'Active' && entry.value === '2'));
  assert.ok(metrics.some((entry) => entry.label === 'Blocked' && entry.value === '3'));
  assert.ok(metrics.some((entry) => entry.label === 'Deadlocks' && entry.value === '1'));
  assert.ok(metrics.some((entry) => entry.label === 'Mode' && entry.value === 'sandbox'));
  assert.ok(metrics.some((entry) => entry.label === 'Throughput/tick' && entry.value === '0.25'));
  assert.ok(metrics.some((entry) => entry.label === 'Fairness' && entry.value === '0.60'));
  assert.ok(metrics.some((entry) => entry.label === 'Score' && entry.value === '185'));
});

test('buildBenchmarkHistoryLines and buildBenchmarkComparisonLines summarize saved benchmark runs', () => {
  const snapshots = [
    {
      id: 'run-a',
      scenarioName: 'Baseline benchmark grid',
      simulationSeed: 123,
      mapSeed: 456,
      mapId: 'baseline-benchmark',
      metrics: { completedTrips: 12, throughputPerTick: 0.2, avgCompletionTicks: 5.5, avgStoppedTicks: 1.3, avgQueueLength: 0.8, deadlocks: 1, fairnessScore: 0.5 },
      score: { total: 240 }
    },
    {
      id: 'run-b',
      scenarioName: 'Baseline benchmark grid',
      simulationSeed: 789,
      mapSeed: 987,
      mapId: 'baseline-benchmark',
      metrics: { completedTrips: 15, throughputPerTick: 0.25, avgCompletionTicks: 4.75, avgStoppedTicks: 0.9, avgQueueLength: 0.55, deadlocks: 0, fairnessScore: 0.9 },
      score: { total: 315 }
    }
  ];

  const historyLines = buildBenchmarkHistoryLines(snapshots);
  const comparisonLines = buildBenchmarkComparisonLines({
    left: snapshots[0],
    right: snapshots[1],
    scoreDelta: 75,
    completedTripsDelta: 3,
    throughputDelta: 0.05,
    avgCompletionTicksDelta: -0.75,
    avgStoppedTicksDelta: -0.4,
    avgQueueLengthDelta: -0.25,
    deadlocksDelta: -1,
    fairnessDelta: 0.4
  });

  assert.match(historyLines[0], /score=240/);
  assert.match(historyLines[0], /fairness=0.50/);
  assert.match(historyLines[1], /seed=789/);
  assert.match(comparisonLines[0], /^A:/);
  assert.match(comparisonLines[1], /^B:/);
  assert.match(comparisonLines[2], /\+75/);
  assert.match(comparisonLines[4], /\+0.050/);
  assert.match(comparisonLines[8], /-1/);
  assert.match(comparisonLines[9], /\+0.40/);
});

test('buildCellInspectionLines summarizes selected cell state and analytics', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 2, y: 0, direction: 'south', status: 'active', spawnedAtTick: 0 }
    ]
  });
  world.metrics.cellStatsByKey['2,0'] = {
    occupancyTicks: 4,
    blockedTicks: 2,
    passThroughCount: 5
  };
  world.metrics.intersectionThroughputByKey['2,0'] = 3;

  const lines = buildCellInspectionLines(world, { x: 2, y: 0 });

  assert.match(lines[0], /2,0/);
  assert.match(lines[1], /road|intersection/);
  assert.match(lines[3], /1/);
  assert.match(lines[4], /4/);
  assert.match(lines[7], /3/);
});


test('buildCellInspectionLines summarizes selected vehicle state, intent, and trail', () => {
  const world = createWorldState({
    vehicles: [
      {
        id: 'vehicle-7',
        x: 4,
        y: 3,
        direction: 'east',
        status: 'active',
        spawnedAtTick: 2,
        debug: {
          intent: 'wait',
          note: 'red-light',
          lastUpdatedTick: 8,
          recentPositions: [
            { x: 2, y: 3, tick: 6, direction: 'east' },
            { x: 3, y: 3, tick: 7, direction: 'east' },
            { x: 4, y: 3, tick: 8, direction: 'east' }
          ]
        }
      }
    ]
  });

  const lines = buildCellInspectionLines(world, { x: 4, y: 3 }, 'vehicle-7');

  assert.match(lines[0], /vehicle-7/);
  assert.match(lines[3], /wait/);
  assert.match(lines[4], /red-light/);
  assert.match(lines[6], /2,3@t6/);
  assert.match(lines[6], /4,3@t8/);
});

test('buildLightPhaseSummary and buildRecentEventSummary summarize diagnostics', () => {
  const world = createWorldState({
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 1,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      }
    ]
  });

  world.events = [
    { tick: 3, type: 'vehicleBlocked', payload: { vehicleId: 'vehicle-1', x: 2, y: 4, reason: 'red-light', blockedByLightId: 'main-crossing', blockedByPhase: 'east-west' } },
    { tick: 4, type: 'lightChanged', payload: { lightId: 'main-crossing', phaseName: 'east-west' } }
  ];

  const lightLines = buildLightPhaseSummary(world);
  const eventLines = buildRecentEventSummary(world);

  assert.deepEqual(lightLines, ['main-crossing: east-west (2)']);
  assert.match(eventLines[0], /vehicleBlocked/);
  assert.match(eventLines[0], /vehicle-1 @ 2,4/);
  assert.match(eventLines[0], /reason=red-light/);
  assert.match(eventLines[0], /light=main-crossing\/east-west/);
  assert.match(eventLines[1], /main-crossing → east-west/);
});
