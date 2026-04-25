import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createRenderer } from './render/renderer.js';
import { createAppShell } from './ui/app-shell.js';
import {
  buildLightPhaseSummary,
  buildLiveMetrics,
  buildRecentEventSummary,
  buildSimulationSummary
} from './ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from './version.js';
import { createEngine } from '../core/engine.js';
import { createWorldState } from '../core/world.js';

const TICK_INTERVAL_MS = 350;
const ANIMATION_DURATION_MS = 320;

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

  let animationFrameId = null;
  let isRunning = false;
  let lastFrameAt = 0;
  let tickAccumulatorMs = 0;

  appShell.bindControls({
    onPlayPause() {
      if (isRunning) {
        stopLoop();
      } else {
        startLoop();
      }
    },
    onStep() {
      if (isRunning || state.world.status === 'completed') {
        return;
      }

      state.engine.tick();
      render();
      appShell.setRunningState(false);
    },
    onReset() {
      stopLoop();
      state = createSimulationState();
      render();
      startLoop();
    }
  });

  render();
  startLoop();

  function startLoop() {
    if (isRunning) {
      return;
    }

    if (state.world.status === 'completed') {
      appShell.setRunningState(false);
      return;
    }

    isRunning = true;
    lastFrameAt = 0;
    tickAccumulatorMs = 0;
    appShell.setRunningState(true);
    animationFrameId = window.requestAnimationFrame(frameLoop);
  }

  function frameLoop(frameAt) {
    if (!isRunning) {
      return;
    }

    if (!lastFrameAt) {
      lastFrameAt = frameAt;
    }

    const deltaMs = frameAt - lastFrameAt;
    lastFrameAt = frameAt;
    tickAccumulatorMs += deltaMs;

    while (tickAccumulatorMs >= TICK_INTERVAL_MS && state.world.status !== 'completed') {
      state.engine.tick();
      tickAccumulatorMs -= TICK_INTERVAL_MS;
      render();
    }

    if (state.world.status === 'completed') {
      stopLoop();
      return;
    }

    animationFrameId = window.requestAnimationFrame(frameLoop);
  }

  function stopLoop() {
    isRunning = false;
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    appShell.setRunningState(false);
  }

  function render() {
    const report = state.engine.getReport();
    renderer.renderWorld(state.world, {
      summaryLines: buildSimulationSummary(state.world, benchmark.summarize(report)),
      animationDurationMs: ANIMATION_DURATION_MS
    });
    appShell.renderDiagnostics({
      metrics: buildLiveMetrics(state.world, report),
      lights: buildLightPhaseSummary(state.world),
      events: buildRecentEventSummary(state.world)
    });
  }
}

function createSimulationState() {
  const world = createWorldState({
    seed: 20260425,
    benchmark: {
      enabled: true,
      mode: 'benchmark',
      spawnRate: 0.55,
      durationTicks: 60
    },
    routing: {
      straightWeight: 0.45,
      leftWeight: 0.25,
      rightWeight: 0.3,
      allowReverse: false
    },
    lights: [
      {
        id: 'north-crossing',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      },
      {
        id: 'west-crossing',
        phaseIndex: 1,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      },
      {
        id: 'main-crossing',
        phaseIndex: 0,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      },
      {
        id: 'east-crossing',
        phaseIndex: 1,
        remainingTicks: 2,
        phases: [
          { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
          { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
        ]
      },
      {
        id: 'south-crossing',
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
