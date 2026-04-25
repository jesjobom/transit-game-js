import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWorldHtml } from '../../js/app/render/renderer.js';
import { createWorldState } from '../../js/core/world.js';

test('buildWorldHtml renders road surfaces and styled vehicles', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-1', x: 2, y: 1, direction: 'south', status: 'active', spawnedAtTick: 0 },
      { id: 'vehicle-2', x: 2, y: 1, direction: 'north', status: 'active', spawnedAtTick: 0 }
    ],
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 1,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      }
    ]
  });

  const html = buildWorldHtml(world, {
    summaryLines: ['Tick: 0', 'Vehicles: 2']
  });

  assert.match(html, /world-grid/);
  assert.match(html, /Tick: 0/);
  assert.match(html, /Vehicles: 2/);
  assert.match(html, /vehicle-1/);
  assert.match(html, /vehicle-2/);
  assert.match(html, /map-cell--road/);
  assert.match(html, /map-cell--intersection/);
  assert.match(html, /map-cell--light-east-west/);
  assert.match(html, /road-surface--vertical/);
  assert.match(html, /vehicle-svg/);
  assert.match(html, /vehicle-body/);
  assert.match(html, /--vehicle-color:hsl\(/);
  assert.match(html, /road-direction/);
  assert.match(html, /allowed: /);
});
