import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSimulationSummary } from '../../js/app/ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from '../../js/app/version.js';
import { createWorldState } from '../../js/core/world.js';

test('buildSimulationSummary includes version, seeds, status, and benchmark summary', () => {
  const world = createWorldState();
  world.tick = 7;
  world.status = 'running';
  world.entities.vehicles = [{ id: 'vehicle-1' }];

  const lines = buildSimulationSummary(world, ['Score: 12']);

  assert.equal(lines[0], `Version: ${APP_VERSION} (${BUILD_TAG})`);
  assert.match(lines.join('\n'), /Simulation seed:/);
  assert.match(lines.join('\n'), /Map seed:/);
  assert.match(lines.join('\n'), /Tick: 7/);
  assert.match(lines.join('\n'), /Status: running/);
  assert.match(lines.join('\n'), /Active vehicles: 1/);
  assert.match(lines.join('\n'), /Score: 12/);
});
