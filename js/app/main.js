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
      spawnRate: 0.2,
      durationTicks: 300
    },
    lights: [
      {
        id: 'main-crossing',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2 },
          { name: 'east-west', durationTicks: 2 }
        ]
      }
    ]
  });
  const engine = createEngine(world);
  const renderer = createRenderer(document.getElementById('simulation-root'));
  const benchmark = createBenchmarkShell();

  createAppShell({ world, engine, renderer, benchmark });

  engine.runTicks(3);

  renderer.renderPlaceholder({
    title: 'Sprint 1 foundations ready',
    lines: [
      `Seed: ${world.seed}`,
      `Tick: ${world.tick}`,
      `RNG state: ${world.rngState}`,
      `Spawned vehicles: ${world.metrics.spawnedVehicles}`,
      `Events in last tick: ${world.events.length}`
    ]
  });
}

boot();
