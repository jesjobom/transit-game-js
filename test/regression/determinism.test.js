import test from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../../js/core/engine.js';
import { createWorldState } from '../../js/core/world.js';

function runScenario(seed, mapSeed = seed) {
  const world = createWorldState({
    seed,
    mapSeed,
    maxVehicles: 10,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0.4,
      durationTicks: 8
    },
    routing: {
      straightWeight: 0.45,
      leftWeight: 0.25,
      rightWeight: 0.3,
      allowReverse: false
    },
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      }
    ]
  });

  const engine = createEngine(world);
  engine.runTicks(8);

  return {
    tick: world.tick,
    rngState: world.rngState,
    mapSeed: world.map.mapSeed,
    roadCount: world.map.roads.length,
    spawnedVehicles: world.metrics.spawnedVehicles,
    movedVehicles: world.metrics.movedVehicles,
    completedTrips: world.metrics.completedTrips,
    blockedMoves: world.metrics.blockedMoves,
    turnsTaken: world.metrics.turnsTaken,
    score: world.report?.score.total,
    lightPhase: world.entities.lights[0].phaseIndex,
    lightRemainingTicks: world.entities.lights[0].remainingTicks,
    activeVehicles: world.entities.vehicles.map(({ id, x, y, direction }) => ({ id, x, y, direction }))
  };
}

test('same seed and config produce the same deterministic outcome', () => {
  assert.deepEqual(runScenario(20260425), runScenario(20260425));
});

test('same map seed preserves the generated map characteristics', () => {
  assert.deepEqual(runScenario(20260425, 42).roadCount, runScenario(7, 42).roadCount);
  assert.deepEqual(runScenario(20260425, 42).mapSeed, runScenario(7, 42).mapSeed);
});
