import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStaticWorldDescriptor, buildVehicleLayerPatch, buildWorldHtml, createRenderer } from '../../js/app/render/renderer.js';
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

  world.events = [
    { type: 'vehicleMoved', tick: 1, payload: { vehicleId: 'vehicle-1', x: 2, y: 1, direction: 'south', laneKey: 'lane-south' } }
  ];

  const html = buildWorldHtml(world, {
    summaryLines: ['Tick: 0', 'Vehicles: 2'],
    animationDurationMs: 320,
    motionProgress: 0.5,
    worldScale: 0.84,
    previousWorld: createWorldState({
      vehicles: [
        { id: 'vehicle-1', x: 2, y: 2, direction: 'south', status: 'active', spawnedAtTick: 0 },
        { id: 'vehicle-2', x: 2, y: 0, direction: 'north', status: 'active', spawnedAtTick: 0 }
      ]
    })
  });

  assert.match(html, /world-grid-shell/);
  assert.match(html, /world-grid-stage/);
  assert.match(html, /--world-scale:0.8400/);
  assert.match(html, /--vehicle-animation-duration:320ms/);
  assert.match(html, /vehicle-layer/);
  assert.match(html, /Tick: 0/);
  assert.match(html, /Vehicles: 2/);
  assert.match(html, /vehicle-1/);
  assert.match(html, /vehicle-2/);
  assert.match(html, /map-cell--road/);
  assert.match(html, /map-cell--intersection/);
  assert.match(html, /road-surface--vertical/);
  assert.match(html, /city-lot--(?:building|park|plaza|water)/);
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
  assert.match(html, /data-motion-kind="straight"/);
  assert.match(html, /--vehicle-render-offset-x:(-?8|-?4|0)/);
  assert.match(html, /--vehicle-render-angle:/);
  assert.match(html, /--vehicle-motion-progress:0.500/);
  assert.match(html, /--vehicle-color:hsl\(/);
  assert.match(html, /traffic light east-west/);
  assert.match(html, /road-direction/);
  assert.match(html, /allowed: /);
});

test('buildWorldHtml renders turning vehicles with start/end angle and lane offsets', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-turn', x: 7, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  });

  world.events = [
    { type: 'vehicleTurned', tick: 1, payload: { vehicleId: 'vehicle-turn', from: 'north', to: 'east', x: 6, y: 2 } },
    { type: 'vehicleMoved', tick: 1, payload: { vehicleId: 'vehicle-turn', x: 7, y: 2, direction: 'east', laneKey: 'lane-east' } }
  ];

  const html = buildWorldHtml(world, { animationDurationMs: 320, motionProgress: 0.5, previousWorld: createWorldState({ vehicles: [{ id: 'vehicle-turn', x: 6, y: 2, direction: 'north', status: 'active', spawnedAtTick: 0 }] }) });

  assert.match(html, /vehicle--turning/);
  assert.match(html, /data-motion-kind="turn"/);
  assert.match(html, /--vehicle-render-angle:-45/);
  assert.match(html, /--vehicle-render-offset-x:/);
  assert.match(html, /--vehicle-motion-progress:0.500/);
});

test('buildWorldHtml renders overlays and selected cell highlights', () => {
  const world = createWorldState();
  world.metrics.cellStatsByKey['2,0'] = {
    occupancyTicks: 4,
    blockedTicks: 3,
    passThroughCount: 7
  };

  const html = buildWorldHtml(world, {
    overlayMode: 'congestion',
    selectedCell: { x: 2, y: 0 }
  });

  assert.match(html, /cell-overlay/);
  assert.match(html, /data-overlay-mode="congestion"/);
  assert.match(html, /map-cell--selected/);
});


test('buildWorldHtml marks selected vehicles in the vehicle layer', () => {
  const world = createWorldState({
    vehicles: [
      {
        id: 'vehicle-selected',
        x: 2,
        y: 1,
        direction: 'south',
        status: 'active',
        spawnedAtTick: 0,
        debug: {
          intent: 'straight',
          note: 'advance',
          lastUpdatedTick: 3,
          recentPositions: [
            { x: 2, y: 3, tick: 1, direction: 'south' },
            { x: 2, y: 2, tick: 2, direction: 'south' },
            { x: 2, y: 1, tick: 3, direction: 'south' }
          ]
        }
      }
    ]
  });

  const html = buildWorldHtml(world, {
    selectedVehicleId: 'vehicle-selected'
  });

  assert.match(html, /data-vehicle-id="vehicle-selected"/);
  assert.match(html, /vehicle--selected/);
  assert.match(html, /vehicle-trail-dot/);
  assert.match(html, /data-vehicle-trail-for="vehicle-selected"/);
});

test('buildStaticWorldDescriptor caches the static base cells for the current map', () => {
  const world = createWorldState();

  const descriptor = buildStaticWorldDescriptor(world.map);

  assert.equal(descriptor.mapId, world.map.id);
  assert.equal(descriptor.cells.length, world.map.width * world.map.height);
  assert.ok(descriptor.cells.some((cell) => cell.baseClasses.includes('map-cell--road')));
  assert.ok(descriptor.cells.some((cell) => String(cell.baseContent).includes('road-surface')));
  assert.ok(descriptor.cells.some((cell) => String(cell.baseContent).includes('city-lot')));
});

test('createRenderer reuses the static world cache when the map does not change', () => {
  const rootElement = { clientWidth: 960, clientHeight: 720, innerHTML: '' };
  const renderer = createRenderer(rootElement);
  const world = createWorldState();

  const firstRender = renderer.renderWorld(world);
  const secondRender = renderer.renderWorld(world);

  assert.equal(firstRender.usedStaticMapCache, false);
  assert.equal(secondRender.usedStaticMapCache, true);
  assert.equal(secondRender.staticCellCount, world.map.width * world.map.height);
  assert.match(rootElement.innerHTML, /world-grid/);
});

test('buildVehicleLayerPatch identifies added, updated, and removed vehicles', () => {
  const patch = buildVehicleLayerPatch(
    [{ id: 'vehicle-1' }, { id: 'vehicle-2' }],
    [{ id: 'vehicle-2' }, { id: 'vehicle-3' }]
  );

  assert.deepEqual(patch, {
    added: ['vehicle-3'],
    updated: ['vehicle-2'],
    removed: ['vehicle-1']
  });
});

test('buildWorldHtml uses the shortest turn arc for west-to-north conversions', () => {
  const world = createWorldState({
    vehicles: [
      { id: 'vehicle-drift-fix', x: 6, y: 4, direction: 'north', status: 'active', spawnedAtTick: 0 }
    ]
  });

  world.events = [
    { type: 'vehicleTurned', tick: 1, payload: { vehicleId: 'vehicle-drift-fix', from: 'west', to: 'north', x: 6, y: 5 } },
    { type: 'vehicleMoved', tick: 1, payload: { vehicleId: 'vehicle-drift-fix', x: 6, y: 4, direction: 'north', laneKey: 'lane-north' } }
  ];

  const html = buildWorldHtml(world, { animationDurationMs: 320, motionProgress: 0.5, previousWorld: createWorldState({ vehicles: [{ id: 'vehicle-drift-fix', x: 6, y: 5, direction: 'west', status: 'active', spawnedAtTick: 0 }] }) });

  assert.match(html, /vehicle--turning/);
  assert.match(html, /data-motion-kind="turn"/);
  assert.match(html, /--vehicle-render-angle:-135deg;/);
});
