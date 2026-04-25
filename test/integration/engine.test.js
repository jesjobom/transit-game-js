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
      mode: 'benchmark',
      spawnRate: 1,
      durationTicks: 20
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
      { id: 'vehicle-1', x: 7, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();
  assert.equal(world.entities.vehicles[0].x, 8);
  assert.equal(world.metrics.movedVehicles, 1);

  engine.tick();
  assert.equal(world.entities.vehicles.length, 0);
  assert.equal(world.metrics.completedTrips, 1);
  assert.equal(world.metrics.completedTripTicks, 2);
  assert.equal(world.events.at(-1).type, 'vehicleExited');
});

test('engine blocks movement that violates road direction on a custom one-way map', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'one-way-test',
      width: 3,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'] },
        { x: 1, y: 0, allowedDirections: ['east'] },
        { x: 2, y: 0, allowedDirections: ['east'] }
      ],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-1', x: 1, y: 0, direction: 'west', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.entities.vehicles[0].x, 1);
  assert.equal(world.metrics.blockedMoves, 1);
  assert.equal(world.events[0].type, 'vehicleBlocked');
  assert.equal(world.events[0].payload.reason, 'invalid-direction');
});

test('engine respects traffic light direction gating at controlled intersections', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 5, y: 4, direction: 'west', status: 'active', spawnedAtTick: 0 }
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

  assert.equal(world.entities.vehicles[0].x, 5);
  assert.equal(world.metrics.blockedMoves, 1);
  assert.equal(world.events[0].type, 'vehicleBlocked');
  assert.equal(world.events[0].payload.reason, 'red-light');
  assert.equal(world.events[0].payload.blockedByLightId, 'main-crossing');
  assert.equal(world.events[0].payload.blockedByPhase, 'north-south');
});

test('engine blocks same-lane movement with an explicit occupancy reason', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'lane-occupancy-test',
      width: 3,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'] },
        { x: 1, y: 0, allowedDirections: ['east'] },
        { x: 2, y: 0, allowedDirections: ['east'] }
      ],
      intersections: [
        { x: 2, y: 0, lightId: 'end-light' }
      ],
      spawnPoints: []
    },
    lights: [
      {
        id: 'end-light',
        phaseIndex: 0,
        remainingTicks: 5,
        phases: [
          { name: 'north-south', durationTicks: 5, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 5, allowedDirections: ['east', 'west'] }
        ]
      }
    ],
    vehicles: [
      { id: 'vehicle-front', x: 1, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-back', x: 0, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  const blockedEvents = world.events.filter((event) => event.type === 'vehicleBlocked');
  assert.equal(blockedEvents.length, 2);
  assert.equal(blockedEvents[0].payload.reason, 'red-light');
  assert.equal(blockedEvents[1].payload.reason, 'lane-occupied');
  assert.equal(blockedEvents[1].payload.blockingVehicleId, 'vehicle-front');
});

test('engine allows opposite-direction vehicles to share a bidirectional road cell in separate lanes', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'bidirectional-lane-test',
      width: 3,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east', 'west'] },
        { x: 1, y: 0, allowedDirections: ['east', 'west'] },
        { x: 2, y: 0, allowedDirections: ['east', 'west'] }
      ],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-east', x: 0, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-west', x: 2, y: 0, direction: 'west', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  const positions = world.entities.vehicles.map((vehicle) => ({
    id: vehicle.id,
    x: vehicle.x,
    y: vehicle.y,
    direction: vehicle.direction
  }));

  assert.deepEqual(positions, [
    { id: 'vehicle-east', x: 1, y: 0, direction: 'east' },
    { id: 'vehicle-west', x: 1, y: 0, direction: 'west' }
  ]);
  assert.equal(world.metrics.movedVehicles, 2);
  assert.equal(world.metrics.blockedMoves, 0);
});

test('engine can turn vehicles at intersections deterministically', () => {
  const world = createWorldState({
    seed: 8,
    routing: {
      straightWeight: 0,
      leftWeight: 1,
      rightWeight: 0,
      allowReverse: false
    },
    vehicles: [
      { id: 'vehicle-1', x: 4, y: 4, direction: 'north', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.entities.vehicles[0].direction, 'west');
  assert.deepEqual({ x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y }, { x: 3, y: 4 });
  assert.equal(world.metrics.turnsTaken, 1);
  assert.equal(world.events[0].type, 'vehicleTurned');
});

test('engine finalizes benchmark report when duration is reached', () => {
  const world = createWorldState({
    seed: 2,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 1,
      durationTicks: 2
    }
  });
  const engine = createEngine(world);

  engine.runTicks(5);

  assert.equal(world.tick, 2);
  assert.equal(world.status, 'completed');
  assert.ok(world.report);
  assert.equal(world.report.metrics.ticksSimulated, 2);
  assert.equal(world.events.at(-1).type, 'benchmarkCompleted');
});
