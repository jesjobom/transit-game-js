import { createSeededRng, normalizeSeed } from './rng.js';

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

  if (options.mode === 'procedural') {
    return createProceduralMap(options);
  }

  return createBootstrapMap(options);
}

export function createProceduralMap(options = {}) {
  const mapSeed = normalizeSeed(options.mapSeed ?? options.seed);
  const rng = createSeededRng(mapSeed);
  const procedural = options.procedural ?? {};
  const width = clampOdd(Math.round(procedural.width ?? 15), 9, 25);
  const height = clampOdd(Math.round(procedural.height ?? 13), 9, 25);
  const density = clampNumber(procedural.density ?? 0.6, 0.3, 0.9);
  const signalRate = clampNumber(procedural.signalRate ?? 0.45, 0, 1);
  const verticalCount = clampNumber(Math.round(2 + density * ((width - 3) / 3)), 2, Math.max(2, width - 2));
  const horizontalCount = clampNumber(Math.round(2 + density * ((height - 3) / 3)), 2, Math.max(2, height - 2));
  const verticalColumns = pickSpreadPositions(width, verticalCount, rng);
  const horizontalRows = pickSpreadPositions(height, horizontalCount, rng);
  const roads = [];

  for (const x of verticalColumns) {
    for (let y = 0; y < height; y += 1) {
      roads.push(createRoadCell(x, y, ['north', 'south']));
    }
  }

  for (const y of horizontalRows) {
    for (let x = 0; x < width; x += 1) {
      roads.push(createRoadCell(x, y, ['east', 'west']));
    }
  }

  const intersections = [];
  let lightIndex = 1;
  for (const x of verticalColumns) {
    for (const y of horizontalRows) {
      const hasLight = rng.nextFloat() <= signalRate;
      intersections.push({
        x,
        y,
        ...(hasLight ? { lightId: `proc-light-${lightIndex++}` } : {})
      });
    }
  }

  const spawnPoints = [
    ...verticalColumns.map((x, index) => ({ id: `north-${index + 1}`, x, y: 0, direction: 'south' })),
    ...verticalColumns.map((x, index) => ({ id: `south-${index + 1}`, x, y: height - 1, direction: 'north' })),
    ...horizontalRows.map((y, index) => ({ id: `west-${index + 1}`, x: 0, y, direction: 'east' })),
    ...horizontalRows.map((y, index) => ({ id: `east-${index + 1}`, x: width - 1, y, direction: 'west' }))
  ];

  return normalizeMap({
    id: options.id ?? `procedural-grid-${mapSeed}`,
    mode: 'procedural',
    mapSeed,
    width,
    height,
    roads,
    intersections,
    spawnPoints
  });
}

export function createBootstrapMap(options = {}) {
  const mapSeed = normalizeSeed(options.mapSeed ?? options.seed);
  const width = 13;
  const height = 11;
  const roads = [];

  for (let x = 0; x < width; x += 1) {
    roads.push(createRoadCell(x, 2, ['east', 'west'], { east: 2, west: 2 }));
    roads.push(createRoadCell(x, 8, ['east', 'west'], { east: 2, west: 2 }));
  }

  for (let x = 2; x <= 10; x += 1) {
    roads.push(createRoadCell(x, 5, ['east', 'west'], x >= 4 && x <= 8 ? { east: 2, west: 2 } : null));
  }

  for (let x = 6; x < width; x += 1) {
    roads.push(createRoadCell(x, 4, ['east', 'west']));
  }

  for (let x = 0; x <= 6; x += 1) {
    roads.push(createRoadCell(x, 9, ['east', 'west']));
  }

  for (let y = 0; y < height; y += 1) {
    roads.push(createRoadCell(2, y, ['north', 'south']));
  }

  for (let y = 1; y < height; y += 1) {
    roads.push(createRoadCell(6, y, ['north', 'south'], { north: 2, south: 2 }));
  }

  for (let y = 0; y <= 9; y += 1) {
    roads.push(createRoadCell(10, y, ['north', 'south'], y >= 2 && y <= 8 ? { north: 2, south: 2 } : null));
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
      { x: 6, y: 2, lightId: 'north-crossing' },
      { x: 10, y: 2 },
      { x: 6, y: 4 },
      { x: 10, y: 4 },
      { x: 2, y: 5, lightId: 'west-crossing' },
      { x: 6, y: 5, lightId: 'main-crossing' },
      { x: 10, y: 5, lightId: 'east-crossing' },
      { x: 2, y: 8 },
      { x: 6, y: 8, lightId: 'south-crossing' },
      { x: 10, y: 8 },
      { x: 2, y: 9 },
      { x: 6, y: 9 }
    ],
    spawnPoints: [
      { id: 'north-west-entry', x: 2, y: 0, direction: 'south' },
      { id: 'north-main-entry', x: 10, y: 0, direction: 'south' },
      { id: 'south-west-entry', x: 2, y: 10, direction: 'north' },
      { id: 'south-main-entry', x: 6, y: 10, direction: 'north' },
      { id: 'west-north-entry', x: 0, y: 2, direction: 'east' },
      { id: 'west-south-entry', x: 0, y: 8, direction: 'east' },
      { id: 'east-north-entry', x: 12, y: 2, direction: 'west' },
      { id: 'east-mid-entry', x: 12, y: 4, direction: 'west' }
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
      allowedDirections,
      laneCounts: {
        ...(existing?.laneCountByDirection ?? {}),
        ...(road.laneCountByDirection ?? {}),
        ...(road.laneCounts && typeof road.laneCounts === 'object' ? road.laneCounts : {})
      }
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

export function getLaneKey(direction, laneIndex = 0) {
  return `lane-${direction}-${laneIndex}`;
}

export function getDirectionOffset(direction, laneIndex = 0, laneCount = 1) {
  const crossAxisOffset = getLaneCenterOffset(laneIndex, laneCount);
  return {
    north: { x: -8 + crossAxisOffset, y: 0 },
    south: { x: 8 - crossAxisOffset, y: 0 },
    east: { x: 0, y: 8 - crossAxisOffset },
    west: { x: 0, y: -8 + crossAxisOffset }
  }[direction] ?? { x: 0, y: 0 };
}

export function getLaneCount(map, x, y, direction = null) {
  const cell = getCell(map, x, y);
  if (!cell) {
    return 0;
  }

  if (!direction) {
    return cell.laneCount ?? 0;
  }

  return cell.laneCountByDirection?.[direction] ?? 0;
}

export function resolveLaneIndexForMove(map, fromPosition, toPosition, direction, laneIndex = 0) {
  const fromLaneCount = Math.max(1, getLaneCount(map, fromPosition.x, fromPosition.y, direction));
  const toLaneCount = Math.max(1, getLaneCount(map, toPosition.x, toPosition.y, direction));

  if (fromLaneCount === toLaneCount) {
    return clampLaneIndex(laneIndex, toLaneCount);
  }

  if (fromLaneCount <= 1) {
    return clampLaneIndex(laneIndex, toLaneCount);
  }

  const ratio = laneIndex / (fromLaneCount - 1 || 1);
  return clampLaneIndex(Math.round(ratio * Math.max(0, toLaneCount - 1)), toLaneCount);
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

function createRoadCell(x, y, allowedDirections, laneCounts = null) {
  return buildRoadCell({ x, y, type: 'road', allowedDirections: uniqueDirections(allowedDirections), laneCounts });
}

function buildRoadCell({ x, y, type, allowedDirections, laneCounts = null }) {
  const laneCountByDirection = buildLaneCountByDirection(allowedDirections, laneCounts);
  const laneDirections = allowedDirections.flatMap((direction) => {
    const count = laneCountByDirection[direction] ?? 1;
    return Array.from({ length: count }, (_, laneIndex) => ({
      key: getLaneKey(direction, laneIndex),
      direction,
      laneIndex,
      laneCount: count,
      offset: getDirectionOffset(direction, laneIndex, count)
    }));
  });

  return {
    x,
    y,
    type,
    allowedDirections,
    laneDirections,
    laneCount: laneDirections.length,
    laneCountByDirection
  };
}

function uniqueDirections(directions) {
  return DIRECTION_ORDER.filter((direction) => directions.includes(direction));
}

function buildLaneCountByDirection(allowedDirections, laneCounts) {
  const normalized = {};

  for (const direction of allowedDirections) {
    normalized[direction] = normalizeLaneCountValue(laneCounts, direction);
  }

  return normalized;
}

function normalizeLaneCountValue(laneCounts, direction) {
  if (typeof laneCounts === 'number' && Number.isFinite(laneCounts)) {
    return Math.max(1, Math.round(laneCounts));
  }

  if (laneCounts && typeof laneCounts === 'object' && Number.isFinite(laneCounts[direction])) {
    return Math.max(1, Math.round(laneCounts[direction]));
  }

  return 1;
}

function getLaneCenterOffset(laneIndex, laneCount) {
  if (laneCount <= 1) {
    return 0;
  }

  const spacing = laneCount === 2 ? 5 : 4;
  const centeredIndex = laneIndex - ((laneCount - 1) / 2);
  return centeredIndex * spacing;
}

function clampLaneIndex(laneIndex, laneCount) {
  return Math.max(0, Math.min(Math.max(0, laneCount - 1), Math.round(laneIndex)));
}

function pickSpreadPositions(size, count, rng) {
  const positions = [];
  const step = (size - 1) / (count + 1);

  for (let index = 0; index < count; index += 1) {
    const center = Math.round(step * (index + 1));
    const jitter = Math.round((rng.nextFloat() - 0.5) * Math.max(1, step * 0.5));
    positions.push(clampNumber(center + jitter, 1, size - 2));
  }

  return [...new Set(positions)].sort((left, right) => left - right);
}

function clampOdd(value, min, max) {
  const clamped = clampNumber(value, min, max);
  return clamped % 2 === 0 ? clamped + 1 > max ? clamped - 1 : clamped + 1 : clamped;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
