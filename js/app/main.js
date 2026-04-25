import { createAppShell } from './ui/app-shell.js';
import { createRenderer } from './render/renderer.js';
import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createWorldState } from '../core/world.js';
import { createEngine } from '../core/engine.js';

function boot() {
  const world = createWorldState({
    seed: 20260425,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0.6,
      durationTicks: 12
    },
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      }
    ]
  });
  const engine = createEngine(world);
  const renderer = createRenderer(document.getElementById('simulation-root'));
  const benchmark = createBenchmarkShell();

  createAppShell({ world, engine, renderer, benchmark });

  engine.runTicks(world.config.benchmark.durationTicks);
  const report = engine.getReport();

  renderer.renderPlaceholder({
    title: 'Sprint 3 benchmark foundations ready',
    lines: [
      `Simulation seed: ${world.simulationSeed}`,
      `Map seed: ${world.mapSeed}`,
      `Tick: ${world.tick}`,
      ...benchmark.summarize(report)
    ]
  });
}

boot();
