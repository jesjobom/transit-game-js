import test from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../../js/core/engine.js';
import { createWorldState } from '../../js/core/world.js';

test('engine tick advances the world and metrics', () => {
  const world = createWorldState();
  const engine = createEngine(world);

  const tick = engine.tick();

  assert.equal(tick, 1);
  assert.equal(world.tick, 1);
  assert.equal(world.metrics.ticksSimulated, 1);
  assert.equal(world.status, 'running');
});

test('engine spawns vehicles deterministically when benchmark mode is enabled', () => {
  const world = createWorldState({
    seed: 1,
    maxVehicles: 5,
    benchmark: {
      enabled: true,
      spawnRate: 1
    }
  });
  const engine = createEngine(world);

  engine.runTicks(3);

  assert.equal(world.entities.vehicles.length, 3);
  assert.equal(world.metrics.spawnedVehicles, 3);
  assert.equal(world.entities.vehicles[0].status, 'active');
  assert.equal(world.events.at(-1).type, 'vehicleSpawned');
});

test('engine moves vehicles forward and completes trips at map exits', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 3, y: 2, direction: 'east', status: 'active' }
    ]
  });
  const engine = createEngine(world);

  engine.tick();
  assert.equal(world.entities.vehicles[0].x, 4);
  assert.equal(world.metrics.movedVehicles, 1);

  engine.tick();
  assert.equal(world.entities.vehicles.length, 0);
  assert.equal(world.metrics.completedTrips, 1);
  assert.equal(world.events.at(-1).type, 'vehicleExited');
});

test('engine respects traffic light direction gating at controlled intersections', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 1, y: 2, direction: 'east', status: 'active' }
    ],
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 0,
        remainingTicks: 5,
        phases: [
          { name: 'north-south', durationTicks: 5, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 5, allowedDirections: ['east', 'west'] }
        ]
      }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.entities.vehicles[0].x, 1);
  assert.equal(world.metrics.blockedMoves, 1);
  assert.equal(world.events[0].type, 'vehicleBlocked');
});
