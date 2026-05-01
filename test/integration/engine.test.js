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

test('engine getReport refreshes live benchmark metrics after ticks advance', () => {
  const world = createWorldState({
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0,
      durationTicks: 20
    }
  });
  const engine = createEngine(world);

  const initialReport = engine.getReport();
  assert.equal(initialReport.tick, 0);
  assert.equal(initialReport.metrics.ticksSimulated, 0);

  engine.tick();

  const refreshedReport = engine.getReport();
  assert.equal(refreshedReport.tick, 1);
  assert.equal(refreshedReport.metrics.ticksSimulated, 1);
  assert.notStrictEqual(refreshedReport, initialReport);
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
  assert.ok(world.entities.vehicles[0].color);
  assert.notDeepEqual(world.entities.vehicles[0].color, world.entities.vehicles[1].color);
  assert.equal(world.events.at(-1).type, 'vehicleSpawned');
});

test('engine moves vehicles forward and completes trips at map exits', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 11, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();
  assert.equal(world.entities.vehicles[0].x, 12);
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
      { id: 'vehicle-1', x: 7, y: 5, direction: 'west', status: 'active', spawnedAtTick: 0 }
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

  assert.equal(world.entities.vehicles[0].x, 7);
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
      { id: 'vehicle-1', x: 6, y: 5, direction: 'north', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.entities.vehicles[0].direction, 'west');
  assert.deepEqual({ x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y }, { x: 5, y: 5 });
  assert.equal(world.metrics.turnsTaken, 1);
  assert.equal(world.events[0].type, 'vehicleTurned');
});

test('engine samples replay frames based on the configured capture cadence', () => {
  const world = createWorldState({
    seed: 3,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0,
      durationTicks: 5
    },
    replay: {
      captureEveryTicks: 2
    }
  });
  const engine = createEngine(world);

  world.replay.frames = [];
  engine.runTicks(5);

  assert.deepEqual(world.replay.frames.map((frame) => frame.tick), [2, 4, 5]);
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


test('engine allows free right on red when the rule is enabled', () => {
  const world = createWorldState({
    seed: 12,
    rules: {
      freeRightOnRed: true
    },
    routing: {
      straightWeight: 0,
      leftWeight: 0,
      rightWeight: 1,
      allowReverse: false
    },
    vehicles: [
      { id: 'vehicle-1', x: 7, y: 5, direction: 'west', status: 'active', spawnedAtTick: 0 }
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

  assert.deepEqual(
    { x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y, direction: world.entities.vehicles[0].direction },
    { x: 6, y: 5, direction: 'west' }
  );
  assert.equal(world.metrics.blockedMoves, 0);

  engine.tick();

  assert.deepEqual(
    { x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y, direction: world.entities.vehicles[0].direction },
    { x: 6, y: 4, direction: 'north' }
  );
});

test('engine enforces four-way stop with a one-tick stop before entering uncontrolled intersections', () => {
  const world = createWorldState({
    rules: {
      fourWayStop: true
    },
    mapMode: 'custom',
    map: {
      id: 'four-way-stop-test',
      width: 3,
      height: 3,
      roads: [
        { x: 1, y: 0, allowedDirections: ['south'] },
        { x: 1, y: 1, allowedDirections: ['north', 'south', 'east', 'west'] },
        { x: 1, y: 2, allowedDirections: ['north'] }
      ],
      intersections: [{ x: 1, y: 1 }],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-1', x: 1, y: 0, direction: 'south', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();
  assert.deepEqual({ x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y }, { x: 1, y: 0 });
  assert.equal(world.events[0].payload.reason, 'four-way-stop');

  engine.tick();
  assert.deepEqual({ x: world.entities.vehicles[0].x, y: world.entities.vehicles[0].y }, { x: 1, y: 1 });
});

test('engine prevents entering an intersection when the exit lane is blocked and do-not-block-intersection is enabled', () => {
  const world = createWorldState({
    rules: {
      doNotBlockIntersection: true
    },
    mapMode: 'custom',
    map: {
      id: 'do-not-block-test',
      width: 4,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'] },
        { x: 1, y: 0, allowedDirections: ['east'] },
        { x: 2, y: 0, allowedDirections: ['east'] },
        { x: 3, y: 0, allowedDirections: ['east'] }
      ],
      intersections: [{ x: 2, y: 0 }],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-front', x: 3, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-back', x: 1, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  const blockedEvent = world.events.find((event) => event.payload.vehicleId === 'vehicle-back');
  assert.equal(blockedEvent.payload.reason, 'would-block-intersection');
  assert.deepEqual(
    { x: world.entities.vehicles.find((entry) => entry.id === 'vehicle-back').x, y: world.entities.vehicles.find((entry) => entry.id === 'vehicle-back').y },
    { x: 1, y: 0 }
  );
});


test('engine detects deadlocks after repeated fully blocked ticks', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'deadlock-test',
      width: 2,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'] },
        { x: 1, y: 0, allowedDirections: ['east'] }
      ],
      intersections: [{ x: 1, y: 0, lightId: 'deadlock-light' }],
      spawnPoints: []
    },
    lights: [
      {
        id: 'deadlock-light',
        phaseIndex: 0,
        remainingTicks: 10,
        phases: [
          { name: 'north-south', durationTicks: 10, allowedDirections: ['north', 'south'] }
        ]
      }
    ],
    vehicles: [
      { id: 'stuck', x: 0, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();
  engine.tick();
  engine.tick();

  assert.equal(world.metrics.deadlocks, 1);
  assert.ok(world.events.some((event) => event.type === 'deadlockDetected'));
});

test('engine records intersection throughput for metrics when vehicles enter intersections', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 5, y: 5, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.equal(world.metrics.intersectionThroughputByKey['6,5'], 1);
});


test('engine allows same-direction vehicles to use parallel lanes on multi-lane roads', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'parallel-lanes-test',
      width: 2,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'], laneCounts: { east: 2 } },
        { x: 1, y: 0, allowedDirections: ['east'], laneCounts: { east: 2 } }
      ],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-a', x: 0, y: 0, direction: 'east', laneIndex: 0, status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-b', x: 0, y: 0, direction: 'east', laneIndex: 1, status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  assert.deepEqual(
    world.entities.vehicles.map((vehicle) => ({ id: vehicle.id, x: vehicle.x, laneIndex: vehicle.laneIndex })),
    [
      { id: 'vehicle-a', x: 1, laneIndex: 0 },
      { id: 'vehicle-b', x: 1, laneIndex: 1 }
    ]
  );
});

test('engine remaps lanes through narrowing roads and blocks merge conflicts', () => {
  const world = createWorldState({
    mapMode: 'custom',
    map: {
      id: 'merge-conflict-test',
      width: 3,
      height: 1,
      roads: [
        { x: 0, y: 0, allowedDirections: ['east'], laneCounts: { east: 2 } },
        { x: 1, y: 0, allowedDirections: ['east'], laneCounts: { east: 2 } },
        { x: 2, y: 0, allowedDirections: ['east'], laneCounts: { east: 1 } }
      ],
      spawnPoints: []
    },
    vehicles: [
      { id: 'vehicle-front', x: 1, y: 0, direction: 'east', laneIndex: 0, status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-back', x: 1, y: 0, direction: 'east', laneIndex: 1, status: 'active', spawnedAtTick: 0 }
    ]
  });
  const engine = createEngine(world);

  engine.tick();

  const front = world.entities.vehicles.find((vehicle) => vehicle.id === 'vehicle-front');
  const back = world.entities.vehicles.find((vehicle) => vehicle.id === 'vehicle-back');
  assert.equal(front.x, 2);
  assert.equal(front.laneIndex, 0);
  assert.equal(back.x, 1);
  assert.equal(back.laneIndex, 1);
  const blocked = world.events.find((event) => event.type === 'vehicleBlocked' && event.payload.vehicleId === 'vehicle-back');
  assert.equal(blocked.payload.reason, 'lane-occupied');
});
