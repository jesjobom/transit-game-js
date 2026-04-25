import { createAppShell } from './ui/app-shell.js';
import { createRenderer } from './render/renderer.js';
import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createWorldState } from '../core/world.js';
import { createEngineShell } from '../core/engine.js';

function boot() {
  const world = createWorldState();
  const engine = createEngineShell(world);
  const renderer = createRenderer(document.getElementById('simulation-root'));
  const benchmark = createBenchmarkShell();

  createAppShell({ world, engine, renderer, benchmark });

  renderer.renderPlaceholder({
    title: 'Sprint 0 bootstrap complete',
    lines: [
      'The new application shell is ready.',
      'Next steps: seedable RNG, serializable world state, and central tick engine.'
    ]
  });
}

boot();
