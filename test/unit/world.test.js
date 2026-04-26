import test from 'node:test';
import assert from 'node:assert/strict';

import { addWorldEvent, createWorldState, nextRandomFloat } from '../../js/core/world.js';

test('createWorldState builds the Sprint 8 structure with defaults', () => {
  const world = createWorldState();

  assert.equal(world.version, 'next-sprint-8');
  assert.equal(world.tick, 0);
  assert.equal(world.mapId, 'bootstrap-grid');
  assert.equal(world.map.id, 'bootstrap-grid');
  assert.equal(world.map.roads.length, 67);
  assert.equal(world.map.spawnPoints.length, 8);
  assert.equal(world.map.roadsByKey['6,5'].laneCount, 4);
  assert.equal(world.config.tickRate, 10);
  assert.equal(world.config.rules.freeRightOnRed, false);
  assert.equal(world.config.benchmark.mode, 'sandbox');
  assert.equal(world.config.routing.allowReverse, false);
  assert.deepEqual(world.entities.vehicles, []);
  assert.equal(world.metrics.ticksSimulated, 0);
  assert.equal(world.metrics.movedVehicles, 0);
  assert.equal(world.metrics.completedTripTicks, 0);
  assert.equal(world.metrics.turnsTaken, 0);
  assert.equal(world.events[0].type, 'mapGenerated');
});

test('createWorldState merges custom configuration and seeds', () => {
  const world = createWorldState({
    seed: 99,
    mapSeed: 77,
    mapId: 'test-map',
    tickRate: 20,
    routing: { straightWeight: 0.7, allowReverse: true },
    rules: { freeRightOnRed: true },
    benchmark: { enabled: true, mode: 'benchmark', spawnRate: 0.5 }
  });

  assert.equal(world.seed, 99);
  assert.equal(world.simulationSeed, 99);
  assert.equal(world.mapSeed, 77);
  assert.equal(world.mapId, 'test-map');
  assert.equal(world.config.tickRate, 20);
  assert.equal(world.config.routing.straightWeight, 0.7);
  assert.equal(world.config.routing.allowReverse, true);
  assert.equal(world.config.rules.freeRightOnRed, true);
  assert.equal(world.config.benchmark.enabled, true);
  assert.equal(world.config.benchmark.mode, 'benchmark');
  assert.equal(world.config.benchmark.spawnRate, 0.5);
});

test('createWorldState hydrates custom vehicles with persistent individual colors', () => {
  const world = createWorldState({
    seed: 42,
    vehicles: [
      { id: 'vehicle-a', x: 0, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-b', x: 1, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });

  assert.ok(world.entities.vehicles[0].color);
  assert.ok(world.entities.vehicles[1].color);
  assert.notDeepEqual(world.entities.vehicles[0].color, world.entities.vehicles[1].color);
});

test('world random helper updates rng state and addWorldEvent records the current tick', () => {
  const world = createWorldState({ seed: 123 });
  const before = world.rngState;
  const random = nextRandomFloat(world);

  assert.ok(random >= 0 && random < 1);
  assert.notEqual(world.rngState, before);

  world.tick = 5;
  const event = addWorldEvent(world, 'customEvent', { ok: true });

  assert.deepEqual(event, {
    tick: 5,
    type: 'customEvent',
    payload: { ok: true }
  });
});
