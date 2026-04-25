import { normalizeSeed } from './rng.js';

const DIRECTION_VECTORS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

const DIRECTION_ORDER = ['north', 'east', 'south', 'west'];

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
  const intersections = Array.isArray(map.intersections) ? structuredClone(map.intersections) : [];
  const intersectionsByKey = Object.create(null);

  for (const road of map.roads || []) {
    roadsByKey[toPositionKey(road.x, road.y)] = {
      x: road.x,
      y: road.y,
      type: road.type ?? 'road'
    };
  }

  for (const intersection of intersections) {
    intersectionsByKey[toPositionKey(intersection.x, intersection.y)] = intersection;
  }

  return {
    id: map.id ?? 'map',
    mode: map.mode ?? 'fixed',
    mapSeed: normalizeSeed(map.mapSeed),
    width: map.width,
    height: map.height,
    roads: Object.values(roadsByKey),
    roadsByKey,
    intersections,
    intersectionsByKey,
    spawnPoints: Array.isArray(map.spawnPoints) ? structuredClone(map.spawnPoints) : []
  };
}

export function getCell(map, x, y) {
  return map.roadsByKey[toPositionKey(x, y)] ?? null;
}

export function getIntersection(map, x, y) {
  return map.intersectionsByKey?.[toPositionKey(x, y)] ?? null;
}

export function isRoad(map, x, y) {
  return Boolean(getCell(map, x, y));
}

export function isIntersection(map, x, y) {
  return Boolean(getIntersection(map, x, y));
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

export function getAvailableDirections(map, x, y) {
  return DIRECTION_ORDER.filter((direction) => {
    const next = getNextPosition({ x, y }, direction);
    return isInsideMap(map, next.x, next.y) && isRoad(map, next.x, next.y);
  });
}

export function turnLeft(direction) {
  return DIRECTION_ORDER[(DIRECTION_ORDER.indexOf(direction) + 3) % 4];
}

export function turnRight(direction) {
  return DIRECTION_ORDER[(DIRECTION_ORDER.indexOf(direction) + 1) % 4];
}

export function reverseDirection(direction) {
  return DIRECTION_ORDER[(DIRECTION_ORDER.indexOf(direction) + 2) % 4];
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
