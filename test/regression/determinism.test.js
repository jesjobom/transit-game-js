import test from 'node:test';
import assert from 'node:assert/strict';

import { createEngine } from '../../js/core/engine.js';
import { createWorldState } from '../../js/core/world.js';

function runScenario(seed) {
  const world = createWorldState({
    seed,
    maxVehicles: 10,
    benchmark: {
      enabled: true,
      spawnRate: 0.4
    },
    lights: [
      {
        id: 'main',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'a', durationTicks: 2 },
          { name: 'b', durationTicks: 2 }
        ]
      }
    ]
  });

  const engine = createEngine(world);
  engine.runTicks(8);

  return {
    tick: world.tick,
    rngState: world.rngState,
    spawnedVehicles: world.metrics.spawnedVehicles,
    lightPhase: world.entities.lights[0].phaseIndex,
    lightRemainingTicks: world.entities.lights[0].remainingTicks
  };
}

test('same seed and config produce the same deterministic outcome', () => {
  assert.deepEqual(runScenario(20260425), runScenario(20260425));
});
