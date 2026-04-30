import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canTravelDirection,
  createBootstrapMap,
  createProceduralMap,
  getAllowedDirections,
  getAvailableDirections,
  getCell,
  getDirectionOffset,
  getIntersection,
  getLaneDirections,
  getLaneKey,
  getNextPosition,
  isInsideMap,
  isRoad,
  reverseDirection,
  turnLeft,
  turnRight
} from '../../js/core/map.js';

test('createBootstrapMap builds a larger less-symmetric city map with bigger blocks', () => {
  const map = createBootstrapMap({ mapSeed: 20260425 });

  assert.equal(map.id, 'bootstrap-grid');
  assert.equal(map.width, 13);
  assert.equal(map.height, 11);
  assert.equal(map.roads.length, 67);
  assert.equal(map.spawnPoints.length, 8);
  assert.equal(map.intersections.length, 13);
  assert.deepEqual(getIntersection(map, 6, 5), { x: 6, y: 5, lightId: 'main-crossing' });
  assert.equal(getIntersection(map, 10, 9), null);
});

test('createProceduralMap reproduces the same road network for the same mapSeed and params', () => {
  const mapA = createProceduralMap({
    mapSeed: 4242,
    procedural: { width: 17, height: 15, density: 0.7, signalRate: 0.5 }
  });
  const mapB = createProceduralMap({
    mapSeed: 4242,
    procedural: { width: 17, height: 15, density: 0.7, signalRate: 0.5 }
  });

  assert.equal(mapA.mode, 'procedural');
  assert.equal(mapA.width, 17);
  assert.equal(mapA.height, 15);
  assert.deepEqual(mapA.roads, mapB.roads);
  assert.deepEqual(mapA.intersections, mapB.intersections);
  assert.deepEqual(mapA.spawnPoints, mapB.spawnPoints);
  assert.ok(mapA.intersections.length >= 4);
  assert.ok(mapA.spawnPoints.length >= 8);
});

test('map helpers resolve roads, lane directions, and movement correctly', () => {
  const map = createBootstrapMap();

  assert.ok(isRoad(map, 2, 0));
  assert.ok(isRoad(map, 0, 8));
  assert.equal(getCell(map, 1, 1), null);
  assert.deepEqual(getNextPosition({ x: 0, y: 2 }, 'east'), { x: 1, y: 2 });
  assert.equal(isInsideMap(map, 12, 10), true);
  assert.equal(isInsideMap(map, 13, 10), false);
  assert.deepEqual(getAllowedDirections(map, 6, 5), ['north', 'east', 'south', 'west']);
  assert.equal(canTravelDirection(map, 6, 5, 'west'), true);
  assert.equal(canTravelDirection(map, 6, 5, 'east'), true);
  assert.deepEqual(
    getLaneDirections(map, 6, 5).map((lane) => lane.key),
    ['lane-north', 'lane-east', 'lane-south', 'lane-west']
  );
  assert.equal(getLaneKey('north'), 'lane-north');
  assert.deepEqual(getDirectionOffset('north'), { x: -8, y: 0 });
  assert.deepEqual(getDirectionOffset('east'), { x: 0, y: 8 });
});

test('intersection helpers expose compatible outbound directions and turning relations', () => {
  const map = createBootstrapMap();

  assert.deepEqual(getIntersection(map, 6, 5), { x: 6, y: 5, lightId: 'main-crossing' });
  assert.deepEqual(getAvailableDirections(map, 6, 5), ['north', 'east', 'south', 'west']);
  assert.equal(turnLeft('north'), 'west');
  assert.equal(turnRight('north'), 'east');
  assert.equal(reverseDirection('north'), 'south');
});
