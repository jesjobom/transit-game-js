import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canTravelDirection,
  createBootstrapMap,
  getAllowedDirections,
  getAvailableDirections,
  getCell,
  getIntersection,
  getNextPosition,
  isInsideMap,
  isRoad,
  reverseDirection,
  turnLeft,
  turnRight
} from '../../js/core/map.js';

test('createBootstrapMap builds a larger city-style grid with directional roads', () => {
  const map = createBootstrapMap({ mapSeed: 20260425 });

  assert.equal(map.id, 'bootstrap-grid');
  assert.equal(map.width, 9);
  assert.equal(map.height, 9);
  assert.equal(map.roads.length, 45);
  assert.equal(map.spawnPoints.length, 6);
  assert.equal(map.intersections.length, 9);
  assert.deepEqual(getIntersection(map, 4, 4), { x: 4, y: 4, lightId: 'main-crossing' });
});

test('map helpers resolve roads, directionality, and movement correctly', () => {
  const map = createBootstrapMap();

  assert.ok(isRoad(map, 4, 0));
  assert.ok(isRoad(map, 0, 4));
  assert.equal(getCell(map, 1, 1), null);
  assert.deepEqual(getNextPosition({ x: 0, y: 2 }, 'east'), { x: 1, y: 2 });
  assert.equal(isInsideMap(map, 8, 8), true);
  assert.equal(isInsideMap(map, 9, 8), false);
  assert.deepEqual(getAllowedDirections(map, 4, 4), ['north', 'west']);
  assert.equal(canTravelDirection(map, 4, 4, 'west'), true);
  assert.equal(canTravelDirection(map, 4, 4, 'east'), false);
});

test('intersection helpers expose only lane-compatible directions and turning relations', () => {
  const map = createBootstrapMap();

  assert.deepEqual(getIntersection(map, 4, 4), { x: 4, y: 4, lightId: 'main-crossing' });
  assert.deepEqual(getAvailableDirections(map, 4, 4), ['north', 'west']);
  assert.equal(turnLeft('north'), 'west');
  assert.equal(turnRight('north'), 'east');
  assert.equal(reverseDirection('north'), 'south');
});
