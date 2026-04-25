import { createMapDefinition } from './map.js';
import { createSeededRng, normalizeSeed } from './rng.js';

const DEFAULT_RULES = {
  freeRightOnRed: false,
  fourWayStop: false,
  doNotBlockIntersection: false
};

const DEFAULT_BENCHMARK = {
  enabled: false,
  durationTicks: 0,
  spawnRate: 0,
  mode: 'sandbox'
};

const DEFAULT_ROUTING = {
  straightWeight: 0.5,
  leftWeight: 0.25,
  rightWeight: 0.25,
  allowReverse: false
};

export function createWorldState(options = {}) {
  const simulationSeed = normalizeSeed(options.seed);
  const mapSeed = normalizeSeed(options.mapSeed ?? simulationSeed);
  const rng = createSeededRng(simulationSeed);
  const map = createMapDefinition({
    id: options.mapId ?? 'bootstrap-grid',
    mode: options.mapMode,
    seed: mapSeed,
    mapSeed,
    map: options.map
  });

  const world = {
    version: 'next-sprint-6',
    tick: 0,
    seed: simulationSeed,
    simulationSeed,
    mapSeed,
    rng,
    rngState: rng.getState(),
    mapId: map.id,
    map,
    status: 'idle',
    config: {
      tickRate: options.tickRate ?? 10,
      maxVehicles: options.maxVehicles ?? 25,
      routing: {
        ...DEFAULT_ROUTING,
        ...(options.routing || {})
      },
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
      spawnedVehicles: 0,
      movedVehicles: 0,
      blockedMoves: 0,
      completedTripTicks: 0,
      turnsTaken: 0
    },
    report: null,
    events: []
  };

  syncWorldRngState(world);
  addWorldEvent(world, 'mapGenerated', {
    mapId: world.map.id,
    mapSeed: world.map.mapSeed,
    roadCount: world.map.roads.length
  });

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
