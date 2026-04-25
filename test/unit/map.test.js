import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createBootstrapMap,
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

test('createBootstrapMap builds a larger city-style grid with many turning opportunities', () => {
  const map = createBootstrapMap({ mapSeed: 20260425 });

  assert.equal(map.id, 'bootstrap-grid');
  assert.equal(map.width, 9);
  assert.equal(map.height, 9);
  assert.equal(map.roads.length, 45);
  assert.equal(map.spawnPoints.length, 12);
  assert.equal(map.intersections.length, 9);
  assert.deepEqual(getIntersection(map, 4, 4), { x: 4, y: 4, lightId: 'main-crossing' });
});

test('map helpers resolve roads and movement correctly', () => {
  const map = createBootstrapMap();

  assert.ok(isRoad(map, 4, 0));
  assert.ok(isRoad(map, 0, 4));
  assert.equal(getCell(map, 1, 1), null);
  assert.deepEqual(getNextPosition({ x: 0, y: 4 }, 'east'), { x: 1, y: 4 });
  assert.equal(isInsideMap(map, 8, 8), true);
  assert.equal(isInsideMap(map, 9, 8), false);
});

test('intersection helpers expose available directions and turning relations', () => {
  const map = createBootstrapMap();

  assert.deepEqual(getIntersection(map, 4, 4), { x: 4, y: 4, lightId: 'main-crossing' });
  assert.deepEqual(getAvailableDirections(map, 4, 4), ['north', 'east', 'south', 'west']);
  assert.equal(turnLeft('north'), 'west');
  assert.equal(turnRight('north'), 'east');
  assert.equal(reverseDirection('north'), 'south');
});
