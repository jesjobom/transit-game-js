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
      spawnRate: 0.6,
      durationTicks: 300
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

  engine.runTicks(6);

  renderer.renderPlaceholder({
    title: 'Sprint 2 movement foundations ready',
    lines: [
      `Simulation seed: ${world.simulationSeed}`,
      `Map seed: ${world.mapSeed}`,
      `Tick: ${world.tick}`,
      `Roads: ${world.map.roads.length}`,
      `Active vehicles: ${world.entities.vehicles.length}`,
      `Completed trips: ${world.metrics.completedTrips}`,
      `Moved vehicles: ${world.metrics.movedVehicles}`,
      `Events in last tick: ${world.events.length}`
    ]
  });
}

boot();
