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
  const width = 9;
  const height = 9;
  const roads = [];
  const roadColumns = [2, 4, 6];
  const roadRows = [2, 4, 6];

  for (const y of roadRows) {
    for (let x = 0; x < width; x += 1) {
      roads.push(createRoadCell(x, y, ['east', 'west']));
    }
  }

  for (const x of roadColumns) {
    for (let y = 0; y < height; y += 1) {
      roads.push(createRoadCell(x, y, ['north', 'south']));
    }
  }

  return normalizeMap({
    id: options.id ?? 'bootstrap-grid',
    mode: options.mode ?? 'fixed',
    mapSeed,
    width,
    height,
    roads,
    intersections: [
      { x: 2, y: 2 },
      { x: 4, y: 2, lightId: 'north-crossing' },
      { x: 6, y: 2 },
      { x: 2, y: 4, lightId: 'west-crossing' },
      { x: 4, y: 4, lightId: 'main-crossing' },
      { x: 6, y: 4, lightId: 'east-crossing' },
      { x: 2, y: 6 },
      { x: 4, y: 6, lightId: 'south-crossing' },
      { x: 6, y: 6 }
    ],
    spawnPoints: [
      { id: 'north-west-entry', x: 2, y: 0, direction: 'south' },
      { id: 'north-main-entry', x: 4, y: 0, direction: 'south' },
      { id: 'north-east-entry', x: 6, y: 0, direction: 'south' },
      { id: 'south-west-entry', x: 2, y: 8, direction: 'north' },
      { id: 'south-main-entry', x: 4, y: 8, direction: 'north' },
      { id: 'south-east-entry', x: 6, y: 8, direction: 'north' },
      { id: 'west-north-entry', x: 0, y: 2, direction: 'east' },
      { id: 'west-main-entry', x: 0, y: 4, direction: 'east' },
      { id: 'west-south-entry', x: 0, y: 6, direction: 'east' },
      { id: 'east-north-entry', x: 8, y: 2, direction: 'west' },
      { id: 'east-main-entry', x: 8, y: 4, direction: 'west' },
      { id: 'east-south-entry', x: 8, y: 6, direction: 'west' }
    ]
  });
}

export function normalizeMap(map) {
  const roadsByKey = Object.create(null);
  const intersections = Array.isArray(map.intersections) ? structuredClone(map.intersections) : [];
  const intersectionsByKey = Object.create(null);

  for (const road of map.roads || []) {
    const key = toPositionKey(road.x, road.y);
    const existing = roadsByKey[key];
    const allowedDirections = uniqueDirections([...(existing?.allowedDirections || []), ...(road.allowedDirections || [])]);

    roadsByKey[key] = buildRoadCell({
      x: road.x,
      y: road.y,
      type: road.type ?? 'road',
      allowedDirections
    });
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

export function getAllowedDirections(map, x, y) {
  return getCell(map, x, y)?.allowedDirections ?? [];
}

export function getLaneDirections(map, x, y) {
  return getCell(map, x, y)?.laneDirections ?? [];
}

export function getLaneKey(direction) {
  return `lane-${direction}`;
}

export function getDirectionOffset(direction) {
  return {
    north: { x: -8, y: 0 },
    south: { x: 8, y: 0 },
    east: { x: 0, y: 8 },
    west: { x: 0, y: -8 }
  }[direction] ?? { x: 0, y: 0 };
}

export function canTravelDirection(map, x, y, direction) {
  return getAllowedDirections(map, x, y).includes(direction);
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
  return getAllowedDirections(map, x, y).filter((direction) => {
    const next = getNextPosition({ x, y }, direction);
    return isInsideMap(map, next.x, next.y) && isRoad(map, next.x, next.y) && canTravelDirection(map, next.x, next.y, direction);
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

function createRoadCell(x, y, allowedDirections) {
  return buildRoadCell({ x, y, type: 'road', allowedDirections: uniqueDirections(allowedDirections) });
}

function buildRoadCell({ x, y, type, allowedDirections }) {
  const laneDirections = allowedDirections.map((direction) => ({
    key: getLaneKey(direction),
    direction,
    offset: getDirectionOffset(direction)
  }));

  return {
    x,
    y,
    type,
    allowedDirections,
    laneDirections,
    laneCount: laneDirections.length
  };
}

function uniqueDirections(directions) {
  return DIRECTION_ORDER.filter((direction) => directions.includes(direction));
}
