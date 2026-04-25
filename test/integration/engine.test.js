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
  assert.equal(world.events.at(-1).type, 'vehicleSpawned');
});

test('engine advances traffic lights and emits transition events', () => {
  const world = createWorldState({
    lights: [
      {
        id: 'test-light',
        phaseIndex: 0,
        remainingTicks: 1,
        phases: [
          { name: 'north-south', durationTicks: 1 },
          { name: 'east-west', durationTicks: 2 }
        ]
      }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.entities.lights[0].phaseIndex, 1);
  assert.equal(world.entities.lights[0].remainingTicks, 2);
  assert.deepEqual(world.events[0], {
    tick: 1,
    type: 'lightChanged',
    payload: {
      lightId: 'test-light',
      phaseIndex: 1,
      phaseName: 'east-west'
    }
  });
});
