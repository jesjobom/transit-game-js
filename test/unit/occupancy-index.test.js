import test from 'node:test';
import assert from 'node:assert/strict';

import { createOccupancyIndex } from '../../js/core/engine.js';
import { createWorldState } from '../../js/core/world.js';

test('createOccupancyIndex indexes lane occupancy per direction and lane', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-east', x: 1, y: 2, direction: 'east', laneIndex: 0 },
      { id: 'vehicle-west', x: 1, y: 2, direction: 'west', laneIndex: 1 }
    ]
  });

  const occupancyIndex = createOccupancyIndex(world);

  assert.equal(occupancyIndex.vehiclesByKey.get('lane:1,2:lane-east-0')?.id, 'vehicle-east');
  assert.equal(occupancyIndex.vehiclesByKey.get('lane:1,2:lane-west-1')?.id, 'vehicle-west');
});

test('createOccupancyIndex collapses intersection occupancy to a single shared key', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-north', x: 2, y: 2, direction: 'north', laneIndex: 0 }
    ]
  });

  const occupancyIndex = createOccupancyIndex(world);

  assert.equal(occupancyIndex.vehiclesByKey.get('intersection:2,2')?.id, 'vehicle-north');
});
