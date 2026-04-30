import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createBenchmarkHistoryStore } from './benchmark/history.js';
import { createRenderer } from './render/renderer.js';
import { createAppShell } from './ui/app-shell.js';
import {
  buildBenchmarkComparisonLines,
  buildBenchmarkHistoryLines,
  buildLightPhaseSummary,
  buildLiveMetrics,
  buildRecentEventSummary,
  buildSimulationSummary
} from './ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from './version.js';
import { createEngine } from '../core/engine.js';
import { createWorldState } from '../core/world.js';
import { buildWorldOptionsFromScenario, getScenarioById, getScenarioCatalog, parseScenarioJson } from '../core/scenario.js';

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
  const historyStore = createBenchmarkHistoryStore();
  let historySnapshots = historyStore.loadSnapshots();
  let historySelection = {
    leftId: historySnapshots[1]?.id ?? historySnapshots[0]?.id ?? '',
    rightId: historySnapshots[0]?.id ?? ''
  };
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
      renderBenchmarkHistory();
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
    },
    onScenarioChange(nextScenarioId) {
      runtimeConfig.scenarioId = nextScenarioId;
      applyRuntimeConfig();
    },
    onHistorySelectionChange(leftId, rightId) {
      historySelection = { leftId, rightId };
      renderBenchmarkHistory();
    },
    async onImportScenario(file) {
      try {
        const parsed = parseScenarioJson(await file.text());
        if (!parsed.valid) {
          window.alert(`Invalid scenario: ${parsed.errors.join(' | ')}`);
          return;
        }

        runtimeConfig.importedScenarios = [
          ...runtimeConfig.importedScenarios.filter((scenario) => scenario.id !== parsed.scenario.id),
          parsed.scenario
        ];
        runtimeConfig.scenarioId = parsed.scenario.id;
        if (parsed.scenario.recommendedMode) {
          runtimeConfig.mode = parsed.scenario.recommendedMode;
        }
        if (parsed.scenario.benchmarkDefaults) {
          runtimeConfig.benchmarkDurationTicks = parsed.scenario.benchmarkDefaults.durationTicks;
          runtimeConfig.spawnRate = parsed.scenario.benchmarkDefaults.spawnRate;
        }
        applyRuntimeConfig();
      } catch (error) {
        window.alert(`Failed to import scenario JSON: ${error.message}`);
      }
    }
  });

  appShell.syncScenarioCatalog(getScenarioCatalog(runtimeConfig.importedScenarios), runtimeConfig.scenarioId);
  appShell.syncSimulationConfig(runtimeConfig);
  appShell.setSpeedState(speedMultiplier, getTickIntervalMs());
  renderBenchmarkHistory();
  render();
  startLoop();

  function applyRuntimeConfig() {
    stopLoop();
    state = createSimulationState(runtimeConfig);
    previousWorld = snapshotRenderableWorld(state.world);
    appShell.syncScenarioCatalog(getScenarioCatalog(runtimeConfig.importedScenarios), runtimeConfig.scenarioId);
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
    maybePersistCompletedBenchmark(report);
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

  function maybePersistCompletedBenchmark(report) {
    if (state.world.status !== 'completed' || state.world.historySaved || state.world.config.benchmark.mode !== 'benchmark') {
      return;
    }

    const snapshot = historyStore.saveReport(report, {
      appVersion: `${APP_VERSION} (${BUILD_TAG})`,
      scenarioId: state.world.scenarioId,
      scenarioName: state.world.scenarioName
    });

    historySnapshots = historyStore.loadSnapshots();
    historySelection = {
      leftId: historySelection.leftId || historySnapshots[1]?.id || snapshot.id,
      rightId: historySelection.rightId || snapshot.id
    };
    state.world.historySaved = true;
    renderBenchmarkHistory();
  }

  function renderBenchmarkHistory() {
    appShell.syncBenchmarkHistory(historySnapshots, historySelection);
    const comparison = historyStore.buildComparison(historySelection.leftId, historySelection.rightId);
    appShell.renderBenchmarkComparison([
      ...buildBenchmarkHistoryLines(historySnapshots).slice(0, 4),
      '---',
      ...buildBenchmarkComparisonLines(comparison)
    ]);
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
  const scenario = getScenarioById(runtimeConfig.scenarioId, runtimeConfig.importedScenarios);
  const world = createWorldState(buildWorldOptionsFromScenario(scenario, runtimeConfig));
  world.scenarioId = scenario.id;
  world.scenarioName = scenario.name;
  return {
    world,
    engine: createEngine(world)
  };
}

function createRuntimeConfig() {
  return {
    mode: 'benchmark',
    scenarioId: 'baseline-benchmark',
    importedScenarios: [],
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
