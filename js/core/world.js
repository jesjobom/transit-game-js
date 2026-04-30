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
    version: 'next-sprint-8',
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
      vehicles: Array.isArray(options.vehicles) ? structuredClone(options.vehicles).map((vehicle) => hydrateVehicle(worldLike(simulationSeed), vehicle)) : [],
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
      completedTripDurations: [],
      turnsTaken: 0,
      stoppedTicksTotal: 0,
      queueLengthAccumulated: 0,
      roadOccupancyAccumulated: 0,
      intersectionThroughputByKey: {},
      deadlockStreak: 0,
      inDeadlock: false
    },
    report: null,
    historySaved: false,
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

export function createVehicleColor(world, token) {
  const hue = hashString(`${world.simulationSeed}:${token}:h`) % 360;
  const saturation = 60 + (hashString(`${world.simulationSeed}:${token}:s`) % 21);
  const lightness = 48 + (hashString(`${world.simulationSeed}:${token}:l`) % 14);

  return {
    fill: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    shadow: `hsl(${hue}, ${Math.max(42, saturation - 14)}%, ${Math.max(28, lightness - 18)}%)`,
    highlight: `hsl(${hue}, ${Math.min(95, saturation + 8)}%, ${Math.min(84, lightness + 18)}%)`
  };
}

export function hydrateVehicle(world, vehicle) {
  return {
    ...vehicle,
    color: vehicle.color ?? createVehicleColor(world, vehicle.id ?? `${vehicle.x},${vehicle.y},${vehicle.direction}`)
  };
}

function worldLike(simulationSeed) {
  return { simulationSeed };
}

function hashString(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}
