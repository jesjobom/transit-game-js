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

const DEFAULT_REPLAY = {
  enabled: true,
  captureEveryTicks: 1
};

const DEFAULT_LIGHTS = {
  phaseDurationTicks: 5
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
    map: options.map,
    procedural: options.procedural
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
      maxVehicles: options.maxVehicles ?? 240,
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
      },
      replay: {
        ...DEFAULT_REPLAY,
        ...(options.replay || {})
      },
      lights: {
        ...DEFAULT_LIGHTS,
        ...(options.lightsConfig || {})
      }
    },
    entities: {
      vehicles: Array.isArray(options.vehicles) ? structuredClone(options.vehicles).map((vehicle) => hydrateVehicle(worldLike(simulationSeed), vehicle)) : [],
      lights: createLightEntitiesForMap(map, options.lights, options.mapMode, options.lightsConfig?.phaseDurationTicks)
    },
    metrics: {
      completedTrips: 0,
      collisions: 0,
      deadlocks: 0,
      ticksSimulated: 0,
      spawnedVehicles: 0,
      movedVehicles: 0,
      blockedMoves: 0,
      lightChanges: 0,
      completedTripTicks: 0,
      completedTripDurations: [],
      turnsTaken: 0,
      stoppedTicksTotal: 0,
      queueLengthAccumulated: 0,
      roadOccupancyAccumulated: 0,
      intersectionThroughputByKey: {},
      directionalFlow: createDirectionalFlowMetrics(),
      cellStatsByKey: {},
      deadlockStreak: 0,
      inDeadlock: false
    },
    report: null,
    historySaved: false,
    replay: {
      frames: []
    },
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
    originDirection: vehicle.originDirection ?? vehicle.direction,
    laneIndex: Number.isFinite(vehicle.laneIndex) ? vehicle.laneIndex : 0,
    color: vehicle.color ?? createVehicleColor(world, vehicle.id ?? `${vehicle.x},${vehicle.y},${vehicle.direction}`),
    debug: hydrateVehicleDebug(vehicle)
  };
}

function hydrateVehicleDebug(vehicle) {
  const recentPositions = Array.isArray(vehicle.debug?.recentPositions)
    ? vehicle.debug.recentPositions.slice(-6)
    : [{ x: vehicle.x, y: vehicle.y, tick: vehicle.spawnedAtTick ?? 0, direction: vehicle.direction }];

  return {
    intent: vehicle.debug?.intent ?? 'idle',
    note: vehicle.debug?.note ?? 'idle',
    lastUpdatedTick: vehicle.debug?.lastUpdatedTick ?? (vehicle.spawnedAtTick ?? 0),
    recentPositions
  };
}

export function recordDirectionalMetric(world, direction, metricKey, amount = 1) {
  const normalizedDirection = normalizeDirectionKey(direction);
  if (!normalizedDirection) {
    return;
  }

  world.metrics.directionalFlow[normalizedDirection][metricKey] += amount;
}

export function recordCellMetric(world, x, y, metricKey, amount = 1) {
  const key = toWorldPositionKey(x, y);
  const entry = world.metrics.cellStatsByKey[key] ?? createCellMetricEntry();
  entry[metricKey] += amount;
  world.metrics.cellStatsByKey[key] = entry;
}

export function captureReplayFrame(world) {
  const frame = {
    tick: world.tick,
    status: world.status,
    simulationSeed: world.simulationSeed,
    mapSeed: world.mapSeed,
    scenarioId: world.scenarioId,
    scenarioName: world.scenarioName,
    config: structuredClone(world.config),
    map: structuredClone(world.map),
    entities: structuredClone(world.entities),
    metrics: structuredClone(world.metrics),
    events: structuredClone(world.events),
    report: world.report ? structuredClone(world.report) : null
  };

  world.replay.frames.push(frame);
  return frame;
}

export function shouldCaptureReplayFrame(world) {
  if (world.config?.replay?.enabled === false) {
    return false;
  }

  const interval = Math.max(1, Math.round(world.config?.replay?.captureEveryTicks ?? 1));

  if (world.tick === 0 || world.status === 'completed') {
    return true;
  }

  return interval <= 1 || world.tick % interval === 0;
}

export function maybeCaptureReplayFrame(world) {
  if (!shouldCaptureReplayFrame(world)) {
    return null;
  }

  return captureReplayFrame(world);
}

function worldLike(simulationSeed) {
  return { simulationSeed };
}

function createCellMetricEntry() {
  return {
    occupancyTicks: 0,
    blockedTicks: 0,
    passThroughCount: 0
  };
}

function createLightEntitiesForMap(map, lights = [], mapMode, phaseDurationTicks = 5) {
  const normalizedDuration = Math.max(2, Math.min(20, Math.round(phaseDurationTicks)));
  const baseLights = Array.isArray(lights)
    ? structuredClone(lights).map((light) => ({
        ...light,
        remainingTicks: normalizedDuration,
        phases: (light.phases ?? []).map((phase) => ({
          ...phase,
          durationTicks: normalizedDuration
        }))
      }))
    : [];

  if (mapMode !== 'procedural') {
    return baseLights;
  }

  const byId = new Map(baseLights.map((light) => [light.id, light]));

  for (const intersection of map.intersections || []) {
    if (!intersection.lightId || byId.has(intersection.lightId)) {
      continue;
    }

    byId.set(intersection.lightId, {
      id: intersection.lightId,
      phaseIndex: 0,
      remainingTicks: normalizedDuration,
      phases: [
        { name: 'north-south', durationTicks: normalizedDuration, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: normalizedDuration, allowedDirections: ['east', 'west'] }
      ]
    });
  }

  return [...byId.values()];
}

function createDirectionalFlowMetrics() {
  return {
    north: createDirectionalMetricEntry(),
    east: createDirectionalMetricEntry(),
    south: createDirectionalMetricEntry(),
    west: createDirectionalMetricEntry()
  };
}

function createDirectionalMetricEntry() {
  return {
    spawned: 0,
    completed: 0,
    blocked: 0,
    stoppedTicks: 0,
    moved: 0
  };
}

function normalizeDirectionKey(direction) {
  return ['north', 'east', 'south', 'west'].includes(direction) ? direction : null;
}

function toWorldPositionKey(x, y) {
  return `${x},${y}`;
}

function hashString(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}
