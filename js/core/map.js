import { normalizeSeed } from './rng.js';

const DIRECTION_VECTORS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

export function createMapDefinition(options = {}) {
  if (options.mode === 'custom' && options.map) {
    return normalizeMap(options.map);
  }

  return createBootstrapMap(options);
}

export function createBootstrapMap(options = {}) {
  const mapSeed = normalizeSeed(options.mapSeed ?? options.seed);
  const width = 5;
  const height = 5;
  const roads = [];

  for (let x = 0; x < width; x += 1) {
    roads.push(createRoadCell(x, 2));
  }

  for (let y = 0; y < height; y += 1) {
    if (y !== 2) {
      roads.push(createRoadCell(2, y));
    }
  }

  return normalizeMap({
    id: options.id ?? 'bootstrap-grid',
    mode: options.mode ?? 'fixed',
    mapSeed,
    width,
    height,
    roads,
    intersections: [{ x: 2, y: 2, lightId: 'main-crossing' }],
    spawnPoints: [
      { id: 'west-entry', x: 0, y: 2, direction: 'east' },
      { id: 'east-entry', x: 4, y: 2, direction: 'west' },
      { id: 'north-entry', x: 2, y: 0, direction: 'south' },
      { id: 'south-entry', x: 2, y: 4, direction: 'north' }
    ]
  });
}

export function normalizeMap(map) {
  const roadsByKey = Object.create(null);

  for (const road of map.roads || []) {
    roadsByKey[toPositionKey(road.x, road.y)] = {
      x: road.x,
      y: road.y,
      type: road.type ?? 'road'
    };
  }

  return {
    id: map.id ?? 'map',
    mode: map.mode ?? 'fixed',
    mapSeed: normalizeSeed(map.mapSeed),
    width: map.width,
    height: map.height,
    roads: Object.values(roadsByKey),
    roadsByKey,
    intersections: Array.isArray(map.intersections) ? structuredClone(map.intersections) : [],
    spawnPoints: Array.isArray(map.spawnPoints) ? structuredClone(map.spawnPoints) : []
  };
}

export function getCell(map, x, y) {
  return map.roadsByKey[toPositionKey(x, y)] ?? null;
}

export function isRoad(map, x, y) {
  return Boolean(getCell(map, x, y));
}

export function getNextPosition(position, direction) {
  const delta = DIRECTION_VECTORS[direction];

  if (!delta) {
    throw new Error(`Unknown direction: ${direction}`);
  }

  return {
    x: position.x + delta.x,
    y: position.y + delta.y
  };
}

export function isInsideMap(map, x, y) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

export function toPositionKey(x, y) {
  return `${x},${y}`;
}

function createRoadCell(x, y) {
  return { x, y, type: 'road' };
}
