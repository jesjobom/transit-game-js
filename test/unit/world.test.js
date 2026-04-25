import test from 'node:test';
import assert from 'node:assert/strict';

import { addWorldEvent, createWorldState, nextRandomFloat } from '../../js/core/world.js';

test('createWorldState builds the Sprint 1 structure with defaults', () => {
  const world = createWorldState();

  assert.equal(world.version, 'next-sprint-1');
  assert.equal(world.tick, 0);
  assert.equal(world.mapId, 'bootstrap-grid');
  assert.equal(world.config.tickRate, 10);
  assert.equal(world.config.rules.freeRightOnRed, false);
  assert.deepEqual(world.entities.vehicles, []);
  assert.equal(world.metrics.ticksSimulated, 0);
});

test('createWorldState merges custom configuration', () => {
  const world = createWorldState({
    seed: 99,
    mapId: 'test-map',
    tickRate: 20,
    rules: { freeRightOnRed: true },
    benchmark: { enabled: true, spawnRate: 0.5 }
  });

  assert.equal(world.seed, 99);
  assert.equal(world.mapId, 'test-map');
  assert.equal(world.config.tickRate, 20);
  assert.equal(world.config.rules.freeRightOnRed, true);
  assert.equal(world.config.benchmark.enabled, true);
  assert.equal(world.config.benchmark.spawnRate, 0.5);
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
