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

const BASE_TICK_INTERVAL_MS = 420;
const DEFAULT_SPEED_MULTIPLIER = 0.75;
const MIN_ANIMATION_DURATION_MS = 180;
const MAX_ANIMATION_DURATION_MS = 420;

function boot() {
  let runtimeConfig = createRuntimeConfig();
  let state = createSimulationState(runtimeConfig);
  let previousWorld = snapshotRenderableWorld(state.world);
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
  let speedMultiplier = DEFAULT_SPEED_MULTIPLIER;

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
      state = createSimulationState(runtimeConfig);
      previousWorld = snapshotRenderableWorld(state.world);
      render();
      startLoop();
    },
    onSpeedChange(nextSpeedMultiplier) {
      speedMultiplier = nextSpeedMultiplier;
      tickAccumulatorMs = Math.min(tickAccumulatorMs, getTickIntervalMs());
      appShell.setSpeedState(speedMultiplier, getTickIntervalMs());
      render();
    },
    onModeChange(nextMode) {
      runtimeConfig.mode = nextMode === 'sandbox' ? 'sandbox' : 'benchmark';
      applyRuntimeConfig();
    },
    onRuleChange(ruleKey, enabled) {
      runtimeConfig.rules[ruleKey] = enabled;
      applyRuntimeConfig();
    },
    onBenchmarkDurationChange(nextDuration) {
      runtimeConfig.benchmarkDurationTicks = Math.max(0, Math.round(nextDuration));
      applyRuntimeConfig();
    },
    onSpawnRateChange(nextSpawnRate) {
      runtimeConfig.spawnRate = Math.max(0, Math.min(1, Number(nextSpawnRate)));
      applyRuntimeConfig();
    }
  });

  appShell.syncSimulationConfig(runtimeConfig);
  appShell.setSpeedState(speedMultiplier, getTickIntervalMs());
  render();
  startLoop();

  function applyRuntimeConfig() {
    stopLoop();
    state = createSimulationState(runtimeConfig);
    previousWorld = snapshotRenderableWorld(state.world);
    appShell.syncSimulationConfig(runtimeConfig);
    render();
    if (runtimeConfig.mode === 'benchmark') {
      startLoop();
    }
  }

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

    while (tickAccumulatorMs >= getTickIntervalMs() && state.world.status !== 'completed') {
      previousWorld = snapshotRenderableWorld(state.world);
      state.engine.tick();
      tickAccumulatorMs -= getTickIntervalMs();
    }

    render();

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
    const tickIntervalMs = getTickIntervalMs();
    const motionProgress = isRunning ? Math.min(1, tickAccumulatorMs / tickIntervalMs) : 1;
    renderer.renderWorld(state.world, {
      summaryLines: buildSimulationSummary(state.world, benchmark.summarize(report)),
      animationDurationMs: getAnimationDurationMs(tickIntervalMs),
      previousWorld,
      motionProgress,
      tickIntervalMs,
      isRunning
    });
    appShell.renderDiagnostics({
      metrics: buildLiveMetrics(state.world, report),
      lights: buildLightPhaseSummary(state.world),
      events: buildRecentEventSummary(state.world)
    });
  }

  function getTickIntervalMs() {
    return Math.round(BASE_TICK_INTERVAL_MS / speedMultiplier);
  }

  function getAnimationDurationMs(tickIntervalMs) {
    return Math.max(MIN_ANIMATION_DURATION_MS, Math.min(MAX_ANIMATION_DURATION_MS, Math.round(tickIntervalMs * 0.88)));
  }
}

function snapshotRenderableWorld(world) {
  const { rng, ...serializableWorld } = world;
  return structuredClone(serializableWorld);
}

function createSimulationState(runtimeConfig = createRuntimeConfig()) {
  const isBenchmarkMode = runtimeConfig.mode === 'benchmark';
  const world = createWorldState({
    seed: 20260425,
    benchmark: {
      enabled: isBenchmarkMode,
      mode: isBenchmarkMode ? 'benchmark' : 'sandbox',
      spawnRate: isBenchmarkMode ? runtimeConfig.spawnRate : 0,
      durationTicks: isBenchmarkMode ? runtimeConfig.benchmarkDurationTicks : 0
    },
    rules: runtimeConfig.rules,
    routing: {
      straightWeight: 0.45,
      leftWeight: 0.25,
      rightWeight: 0.3,
      allowReverse: false
    },
    vehicles: isBenchmarkMode
      ? []
      : [
          { id: 'sandbox-1', x: 0, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 },
          { id: 'sandbox-2', x: 10, y: 0, direction: 'south', status: 'active', spawnedAtTick: 0 },
          { id: 'sandbox-3', x: 12, y: 4, direction: 'west', status: 'active', spawnedAtTick: 0 }
        ],
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

function createRuntimeConfig() {
  return {
    mode: 'benchmark',
    benchmarkDurationTicks: 60,
    spawnRate: 0.55,
    rules: {
      freeRightOnRed: false,
      fourWayStop: false,
      doNotBlockIntersection: false
    }
  };
}

boot();
