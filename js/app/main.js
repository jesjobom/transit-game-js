import { createBenchmarkShell } from './benchmark/benchmark-shell.js';
import { createBenchmarkHistoryStore } from './benchmark/history.js';
import { createRenderer } from './render/renderer.js';
import { createAppShell } from './ui/app-shell.js';
import {
  buildBenchmarkComparisonLines,
  buildBenchmarkHistoryLines,
  buildCellInspectionLines,
  buildLightPhaseSummary,
  buildLiveMetrics,
  buildRecentEventSummary,
  buildSimulationSummary
} from './ui/view-model.js';
import { APP_VERSION, BUILD_TAG } from './version.js';
import { createEngine } from '../core/engine.js';
import { captureReplayFrame, createWorldState } from '../core/world.js';
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
  let selectedCell = null;
  let selectedVehicleId = null;
  const appShell = createAppShell({
    world: state.world,
    engine: state.engine,
    renderer,
    benchmark,
    appVersion: `${APP_VERSION} (${BUILD_TAG})`
  });

  let animationFrameId = null;
  let replayAnimationFrameId = null;
  let isRunning = false;
  let lastFrameAt = 0;
  let tickAccumulatorMs = 0;
  let replayLastFrameAt = 0;
  let replayAccumulatorMs = 0;
  let speedMultiplier = DEFAULT_SPEED_MULTIPLIER;
  let replayState = {
    enabled: false,
    isPlaying: false,
    frameIndex: Math.max(0, state.world.replay.frames.length - 1)
  };

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
      stopReplayLoop();
      state = createSimulationState(runtimeConfig);
      previousWorld = snapshotRenderableWorld(state.world);
      selectedVehicleId = null;
      replayState = {
        enabled: false,
        isPlaying: false,
        frameIndex: Math.max(0, state.world.replay.frames.length - 1)
      };
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
    onMapModeChange(nextMapMode) {
      runtimeConfig.mapMode = nextMapMode;
      applyRuntimeConfig();
    },
    onProceduralWidthChange(nextWidth) {
      runtimeConfig.procedural.width = Math.max(9, Math.round(nextWidth));
      applyRuntimeConfig();
    },
    onProceduralHeightChange(nextHeight) {
      runtimeConfig.procedural.height = Math.max(9, Math.round(nextHeight));
      applyRuntimeConfig();
    },
    onProceduralDensityChange(nextDensity) {
      runtimeConfig.procedural.density = Math.max(0.3, Math.min(0.9, Number(nextDensity)));
      applyRuntimeConfig();
    },
    onProceduralSignalRateChange(nextSignalRate) {
      runtimeConfig.procedural.signalRate = Math.max(0, Math.min(1, Number(nextSignalRate)));
      applyRuntimeConfig();
    },
    onHistorySelectionChange(leftId, rightId) {
      historySelection = { leftId, rightId };
      renderBenchmarkHistory();
    },
    onOverlayModeChange(nextOverlayMode) {
      runtimeConfig.overlayMode = nextOverlayMode;
      render();
    },
    onGridCellSelect(cell) {
      selectedCell = { x: cell.x, y: cell.y };
      selectedVehicleId = cell.vehicleId ?? null;
      render();
    },
    onReplayToggle() {
      replayState.enabled = !replayState.enabled;
      replayState.isPlaying = false;
      stopReplayLoop();
      if (replayState.enabled) {
        stopLoop();
        replayState.frameIndex = Math.max(0, state.world.replay.frames.length - 1);
      }
      render();
    },
    onReplayPlayPause() {
      if (!replayState.enabled) {
        replayState.enabled = true;
        replayState.frameIndex = 0;
      }

      replayState.isPlaying = !replayState.isPlaying;
      if (replayState.isPlaying) {
        stopLoop();
        startReplayLoop();
      } else {
        stopReplayLoop();
      }
      render();
    },
    onReplayFrameChange(frameIndex) {
      replayState.enabled = true;
      replayState.isPlaying = false;
      stopLoop();
      stopReplayLoop();
      replayState.frameIndex = Math.max(0, Math.min(state.world.replay.frames.length - 1, Math.round(frameIndex)));
      render();
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
    stopReplayLoop();
    state = createSimulationState(runtimeConfig);
    previousWorld = snapshotRenderableWorld(state.world);
    selectedVehicleId = null;
    replayState = {
      enabled: false,
      isPlaying: false,
      frameIndex: Math.max(0, state.world.replay.frames.length - 1)
    };
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
      replayState.frameIndex = Math.max(0, state.world.replay.frames.length - 1);
      render();
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

  function startReplayLoop() {
    if (replayAnimationFrameId || !replayState.isPlaying) {
      return;
    }

    replayLastFrameAt = 0;
    replayAccumulatorMs = 0;
    replayAnimationFrameId = window.requestAnimationFrame(replayFrameLoop);
  }

  function replayFrameLoop(frameAt) {
    if (!replayState.isPlaying) {
      return;
    }

    if (!replayLastFrameAt) {
      replayLastFrameAt = frameAt;
    }

    const deltaMs = frameAt - replayLastFrameAt;
    replayLastFrameAt = frameAt;
    replayAccumulatorMs += deltaMs;

    if (replayAccumulatorMs >= getTickIntervalMs()) {
      replayAccumulatorMs = 0;
      const maxFrameIndex = Math.max(0, state.world.replay.frames.length - 1);
      if (replayState.frameIndex >= maxFrameIndex) {
        replayState.isPlaying = false;
        stopReplayLoop();
      } else {
        replayState.frameIndex += 1;
      }
      render();
    }

    if (replayState.isPlaying) {
      replayAnimationFrameId = window.requestAnimationFrame(replayFrameLoop);
    }
  }

  function stopReplayLoop() {
    if (replayAnimationFrameId) {
      window.cancelAnimationFrame(replayAnimationFrameId);
      replayAnimationFrameId = null;
    }
  }

  function render() {
    const report = state.engine.getReport();
    maybePersistCompletedBenchmark(report);
    const viewWorld = replayState.enabled ? (state.world.replay.frames[replayState.frameIndex] ?? state.world) : state.world;
    const viewReport = viewWorld.report ?? report;
    const tickIntervalMs = getTickIntervalMs();
    const motionProgress = isRunning ? Math.min(1, tickAccumulatorMs / tickIntervalMs) : 1;
    renderer.renderWorld(viewWorld, {
      summaryLines: buildSimulationSummary(viewWorld, benchmark.summarize(viewReport)),
      animationDurationMs: getAnimationDurationMs(tickIntervalMs),
      previousWorld,
      motionProgress,
      tickIntervalMs,
      isRunning,
      overlayMode: runtimeConfig.overlayMode,
      selectedCell,
      selectedVehicleId
    });
    appShell.renderDiagnostics({
      metrics: buildLiveMetrics(viewWorld, viewReport),
      lights: buildLightPhaseSummary(viewWorld),
      events: buildRecentEventSummary(viewWorld)
    });
    appShell.renderCellInspection(buildCellInspectionLines(viewWorld, selectedCell, selectedVehicleId));
    appShell.syncReplayState(state.world.replay.frames, replayState);
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
  captureReplayFrame(world);
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
    mapMode: 'fixed',
    procedural: {
      width: 15,
      height: 13,
      density: 0.6,
      signalRate: 0.45
    },
    overlayMode: 'off',
    rules: {
      freeRightOnRed: false,
      fourWayStop: false,
      doNotBlockIntersection: false
    }
  };
}

boot();
