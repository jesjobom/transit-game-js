import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createRenderer } from './render/renderer.js';
import { createAppShell } from './ui/app-shell.js';
import { buildSimulationSummary } from './ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from './version.js';
import { createEngine } from '../core/engine.js';
import { createWorldState } from '../core/world.js';

const TICK_INTERVAL_MS = 350;

function boot() {
  let state = createSimulationState();
  const renderer = createRenderer(document.getElementById('simulation-root'));
  const benchmark = createBenchmarkShell();
  const appShell = createAppShell({
    world: state.world,
    engine: state.engine,
    renderer,
    benchmark,
    appVersion: `${APP_VERSION} (${BUILD_TAG})`
  });

  let timerId = null;

  appShell.bindControls({
    onPlayPause() {
      if (timerId) {
        stopLoop();
      } else {
        startLoop();
      }
    },
    onReset() {
      stopLoop();
      state = createSimulationState();
      render();
    }
  });

  render();
  startLoop();

  function startLoop() {
    if (timerId || state.world.status === 'completed') {
      appShell.setRunningState(false);
      return;
    }

    appShell.setRunningState(true);
    timerId = window.setInterval(() => {
      state.engine.tick();
      render();

      if (state.world.status === 'completed') {
        stopLoop();
      }
    }, TICK_INTERVAL_MS);
  }

  function stopLoop() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }

    appShell.setRunningState(false);
  }

  function render() {
    const report = state.engine.getReport();
    renderer.renderWorld(state.world, {
      summaryLines: buildSimulationSummary(state.world, benchmark.summarize(report))
    });
  }
}

function createSimulationState() {
  const world = createWorldState({
    seed: 20260425,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0.6,
      durationTicks: 40
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

  return {
    world,
    engine: createEngine(world)
  };
}

boot();
