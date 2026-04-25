import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWorldHtml } from '../../js/app/render/renderer.js';
import { createWorldState } from '../../js/core/world.js';

test('buildWorldHtml renders animated vehicle layer, dedicated traffic lights, and styled roads', () => {
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
    summaryLines: ['Tick: 0', 'Vehicles: 2'],
    animationDurationMs: 320
  });

  assert.match(html, /world-grid-shell/);
  assert.match(html, /--vehicle-animation-duration:320ms/);
  assert.match(html, /vehicle-layer/);
  assert.match(html, /Tick: 0/);
  assert.match(html, /Vehicles: 2/);
  assert.match(html, /vehicle-1/);
  assert.match(html, /vehicle-2/);
  assert.match(html, /map-cell--road/);
  assert.match(html, /map-cell--intersection/);
  assert.match(html, /road-surface--vertical/);
  assert.match(html, /traffic-light-cluster/);
  assert.match(html, /traffic-light-cluster--east-west/);
  assert.match(html, /traffic-light-housing--vertical/);
  assert.match(html, /traffic-light-housing--horizontal/);
  assert.match(html, /traffic-light-housing--active/);
  assert.match(html, /traffic-light-phase-badge/);
  assert.match(html, />EW</);
  assert.match(html, /traffic-light--green/);
  assert.match(html, /vehicle-svg/);
  assert.match(html, /vehicle-body/);
  assert.match(html, /--vehicle-start-x:/);
  assert.match(html, /--lane-offset-x:(-?8|-?4|0)px; --lane-offset-y:(-?8|-?4|0)px;/);
  assert.match(html, /--vehicle-color:hsl\(/);
  assert.match(html, /traffic light east-west/);
  assert.match(html, /road-direction/);
  assert.match(html, /allowed: /);
});
