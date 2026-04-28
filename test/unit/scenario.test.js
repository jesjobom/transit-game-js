import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWorldOptionsFromScenario,
  getScenarioById,
  getScenarioCatalog,
  normalizeScenarioDefinition
} from '../../js/core/scenario.js';

test('scenario catalog exposes built-in named presets', () => {
  const scenarios = getScenarioCatalog();

  assert.ok(scenarios.length >= 3);
  assert.deepEqual(
    scenarios.slice(0, 3).map((scenario) => scenario.id),
    ['baseline-benchmark', 'priority-cross', 'spillback-lab']
  );
});

test('buildWorldOptionsFromScenario applies runtime mode and sandbox vehicles', () => {
  const scenario = getScenarioById('baseline-benchmark');
  const sandboxWorld = buildWorldOptionsFromScenario(scenario, {
    mode: 'sandbox',
    benchmarkDurationTicks: 60,
    spawnRate: 0.55,
    rules: {
      freeRightOnRed: false,
      fourWayStop: false,
      doNotBlockIntersection: false
    }
  });

  assert.equal(sandboxWorld.benchmark.enabled, false);
  assert.equal(sandboxWorld.benchmark.mode, 'sandbox');
  assert.equal(sandboxWorld.vehicles.length, 3);

  const benchmarkWorld = buildWorldOptionsFromScenario(scenario, {
    mode: 'benchmark',
    benchmarkDurationTicks: 90,
    spawnRate: 0.4,
    rules: {
      freeRightOnRed: true,
      fourWayStop: false,
      doNotBlockIntersection: true
    }
  });

  assert.equal(benchmarkWorld.benchmark.enabled, true);
  assert.equal(benchmarkWorld.benchmark.durationTicks, 90);
  assert.equal(benchmarkWorld.benchmark.spawnRate, 0.4);
  assert.equal(benchmarkWorld.vehicles.length, 0);
  assert.equal(benchmarkWorld.rules.freeRightOnRed, true);
});

test('normalizeScenarioDefinition validates malformed custom scenarios', () => {
  const result = normalizeScenarioDefinition({
    id: 'broken',
    name: 'Broken scenario',
    worldOptions: {
      mapMode: 'custom',
      map: {
        id: 'broken-map',
        width: 0,
        height: 2,
        roads: []
      }
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('width')));
  assert.ok(result.errors.some((error) => error.includes('road cell')));
});
