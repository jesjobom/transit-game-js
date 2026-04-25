import { createSeededRng, normalizeSeed } from './rng.js';

const DEFAULT_RULES = {
  freeRightOnRed: false,
  fourWayStop: false,
  doNotBlockIntersection: false
};

const DEFAULT_BENCHMARK = {
  enabled: false,
  durationTicks: 0,
  spawnRate: 0
};

export function createWorldState(options = {}) {
  const seed = normalizeSeed(options.seed);
  const rng = createSeededRng(seed);

  const world = {
    version: 'next-sprint-1',
    tick: 0,
    seed,
    rng,
    rngState: rng.getState(),
    mapId: options.mapId ?? 'bootstrap-grid',
    status: 'idle',
    config: {
      tickRate: options.tickRate ?? 10,
      maxVehicles: options.maxVehicles ?? 25,
      rules: {
        ...DEFAULT_RULES,
        ...(options.rules || {})
      },
      benchmark: {
        ...DEFAULT_BENCHMARK,
        ...(options.benchmark || {})
      }
    },
    entities: {
      vehicles: Array.isArray(options.vehicles) ? structuredClone(options.vehicles) : [],
      lights: Array.isArray(options.lights) ? structuredClone(options.lights) : []
    },
    metrics: {
      completedTrips: 0,
      collisions: 0,
      deadlocks: 0,
      ticksSimulated: 0,
      spawnedVehicles: 0
    },
    events: []
  };

  syncWorldRngState(world);
  return world;
}

export function syncWorldRngState(world) {
  world.rngState = world.rng.getState();
  return world.rngState;
}

export function nextRandomFloat(world) {
  const value = world.rng.nextFloat();
  syncWorldRngState(world);
  return value;
}

export function addWorldEvent(world, type, payload = {}) {
  const event = {
    tick: world.tick,
    type,
    payload
  };

  world.events.push(event);
  return event;
}
