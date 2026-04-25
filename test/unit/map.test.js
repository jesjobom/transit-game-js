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

test('createBootstrapMap builds the expected crossroad layout', () => {
  const map = createBootstrapMap({ mapSeed: 20260425 });

  assert.equal(map.id, 'bootstrap-grid');
  assert.equal(map.width, 5);
  assert.equal(map.height, 5);
  assert.equal(map.roads.length, 9);
  assert.equal(map.spawnPoints.length, 4);
  assert.equal(map.intersections.length, 1);
  assert.deepEqual(map.intersections[0], { x: 2, y: 2, lightId: 'main-crossing' });
});

test('map helpers resolve roads and movement correctly', () => {
  const map = createBootstrapMap();

  assert.ok(isRoad(map, 2, 0));
  assert.ok(isRoad(map, 0, 2));
  assert.equal(getCell(map, 1, 1), null);
  assert.deepEqual(getNextPosition({ x: 0, y: 2 }, 'east'), { x: 1, y: 2 });
  assert.equal(isInsideMap(map, 4, 4), true);
  assert.equal(isInsideMap(map, 5, 4), false);
});

test('intersection helpers expose available directions and turning relations', () => {
  const map = createBootstrapMap();

  assert.deepEqual(getIntersection(map, 2, 2), { x: 2, y: 2, lightId: 'main-crossing' });
  assert.deepEqual(getAvailableDirections(map, 2, 2), ['north', 'east', 'south', 'west']);
  assert.equal(turnLeft('north'), 'west');
  assert.equal(turnRight('north'), 'east');
  assert.equal(reverseDirection('north'), 'south');
});
