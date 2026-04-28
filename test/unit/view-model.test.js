import test from 'node:test';
import assert from 'node:assert/strict';

import {
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
    metrics: { throughputPerTick: 0.25, avgCompletionTicks: 4.5, avgStoppedTicks: 1.25, avgQueueLength: 0.75, avgRoadOccupancy: 0.4 },
    score: { total: 185 }
  });

  assert.deepEqual(metrics[0], { label: 'Tick', value: '9' });
  assert.ok(metrics.some((entry) => entry.label === 'Active' && entry.value === '2'));
  assert.ok(metrics.some((entry) => entry.label === 'Blocked' && entry.value === '3'));
  assert.ok(metrics.some((entry) => entry.label === 'Deadlocks' && entry.value === '1'));
  assert.ok(metrics.some((entry) => entry.label === 'Mode' && entry.value === 'sandbox'));
  assert.ok(metrics.some((entry) => entry.label === 'Throughput/tick' && entry.value === '0.25'));
  assert.ok(metrics.some((entry) => entry.label === 'Score' && entry.value === '185'));
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
