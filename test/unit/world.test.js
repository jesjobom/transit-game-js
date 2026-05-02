import test from 'node:test';
import assert from 'node:assert/strict';

import { addWorldEvent, captureReplayFrame, createWorldState, maybeCaptureReplayFrame, nextRandomFloat, shouldCaptureReplayFrame } from '../../js/core/world.js';

test('createWorldState builds the Sprint 8 structure with defaults', () => {
  const world = createWorldState();

  assert.equal(world.version, 'next-sprint-8');
  assert.equal(world.tick, 0);
  assert.equal(world.mapId, 'bootstrap-grid');
  assert.equal(world.map.id, 'bootstrap-grid');
  assert.equal(world.map.roads.length, 67);
  assert.equal(world.map.spawnPoints.length, 8);
  assert.equal(world.map.roadsByKey['6,5'].laneCount, 8);
  assert.equal(world.config.tickRate, 10);
  assert.equal(world.config.maxVehicles, 240);
  assert.equal(world.config.rules.freeRightOnRed, false);
  assert.equal(world.config.benchmark.mode, 'sandbox');
  assert.equal(world.config.replay.enabled, true);
  assert.equal(world.config.replay.captureEveryTicks, 1);
  assert.equal(world.config.routing.allowReverse, false);
  assert.deepEqual(world.entities.vehicles, []);
  assert.equal(world.metrics.ticksSimulated, 0);
  assert.equal(world.metrics.movedVehicles, 0);
  assert.equal(world.metrics.completedTripTicks, 0);
  assert.deepEqual(world.metrics.completedTripDurations, []);
  assert.equal(world.metrics.turnsTaken, 0);
  assert.equal(world.metrics.stoppedTicksTotal, 0);
  assert.equal(world.metrics.queueLengthAccumulated, 0);
  assert.equal(world.metrics.roadOccupancyAccumulated, 0);
  assert.deepEqual(world.metrics.intersectionThroughputByKey, {});
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
    benchmark: { enabled: true, mode: 'benchmark', spawnRate: 0.5 },
    lightsConfig: { phaseDurationTicks: 9 },
    replay: { enabled: false, captureEveryTicks: 3 }
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
  assert.equal(world.config.lights.phaseDurationTicks, 9);
  assert.ok(world.entities.lights.every((light) => light.remainingTicks === 9));
  assert.equal(world.config.replay.enabled, false);
  assert.equal(world.config.replay.captureEveryTicks, 3);
});

test('createWorldState auto-creates procedural lights for generated intersections', () => {
  const world = createWorldState({
    mapMode: 'procedural',
    mapSeed: 4242,
    procedural: { width: 17, height: 15, density: 0.7, signalRate: 0.5 }
  });

  const litIntersections = world.map.intersections.filter((intersection) => intersection.lightId);
  assert.ok(litIntersections.length > 0);
  assert.ok(world.entities.lights.some((light) => light.id === litIntersections[0].lightId));
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

test('captureReplayFrame stores serializable timeline snapshots', () => {
  const world = createWorldState({
    vehicles: [{ id: 'vehicle-a', x: 0, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }]
  });
  world.tick = 3;
  world.status = 'running';
  world.scenarioId = 'baseline-benchmark';
  world.scenarioName = 'Baseline benchmark grid';

  const frame = captureReplayFrame(world);

  assert.equal(world.replay.frames.length, 1);
  assert.equal(frame.tick, 3);
  assert.equal(frame.entities.vehicles[0].id, 'vehicle-a');
  assert.equal(frame.scenarioId, 'baseline-benchmark');
});

test('replay capture can be disabled explicitly', () => {
  const world = createWorldState({ replay: { enabled: false, captureEveryTicks: 2 } });
  world.tick = 4;
  world.status = 'running';

  assert.equal(shouldCaptureReplayFrame(world), false);
  assert.equal(maybeCaptureReplayFrame(world), null);
  assert.equal(world.replay.frames.length, 0);
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
