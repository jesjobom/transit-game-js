export function createAppShell({ world, engine, renderer, benchmark, appVersion }) {
  setStatus('status-app', 'ready');
  setStatus('status-renderer', renderer.status);
  setStatus('status-engine', engine.status);
  setVersion(appVersion);

  return {
    world,
    engine,
    renderer,
    benchmark,
    bindControls({
      onPlayPause,
      onStep,
      onReset,
      onSpeedChange,
      onModeChange,
      onRuleChange,
      onBenchmarkDurationChange,
      onSpawnRateChange,
      onScenarioChange,
      onImportScenario,
      onHistorySelectionChange,
      onOverlayModeChange,
      onGridCellSelect
    } = {}) {
      bindButton('control-play-pause', onPlayPause);
      bindButton('control-step', onStep);
      bindButton('control-reset', onReset);
      bindSpeedControl('control-speed', onSpeedChange);
      bindSelectControl('control-mode', onModeChange);
      bindCheckboxControl('rule-free-right-on-red', (checked) => onRuleChange?.('freeRightOnRed', checked));
      bindCheckboxControl('rule-four-way-stop', (checked) => onRuleChange?.('fourWayStop', checked));
      bindCheckboxControl('rule-do-not-block-intersection', (checked) => onRuleChange?.('doNotBlockIntersection', checked));
      bindNumberControl('control-benchmark-duration', onBenchmarkDurationChange);
      bindNumberControl('control-spawn-rate', onSpawnRateChange);
      bindSelectControl('control-scenario', onScenarioChange);
      bindSelectControl('control-overlay-mode', onOverlayModeChange);
      bindFileControl('control-scenario-import', onImportScenario);
      bindHistoryCompareControls(onHistorySelectionChange);
      bindGridCellSelection('simulation-root', onGridCellSelect);
    },
    setSpeedState(speedMultiplier, tickIntervalMs) {
      const speedValue = document.getElementById('control-speed-value');
      if (speedValue) {
        speedValue.textContent = `${formatSpeedMultiplier(speedMultiplier)}× · ${tickIntervalMs}ms/tick`;
      }
    },
    setRunningState(isRunning) {
      const playPauseButton = document.getElementById('control-play-pause');
      if (playPauseButton) {
        playPauseButton.textContent = isRunning ? 'Pause' : 'Play';
        playPauseButton.dataset.running = String(isRunning);
      }

      const stepButton = document.getElementById('control-step');
      if (stepButton) {
        stepButton.disabled = isRunning;
        stepButton.dataset.running = String(isRunning);
      }
    },
    syncScenarioCatalog(scenarios, selectedId) {
      const element = document.getElementById('control-scenario');
      if (!element) {
        return;
      }

      element.innerHTML = scenarios
        .map((scenario) => `<option value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.name)}</option>`)
        .join('');

      if (selectedId) {
        element.value = selectedId;
      }
    },
    syncSimulationConfig(config = {}) {
      syncSelectValue('control-mode', config.mode ?? 'benchmark');
      syncCheckboxValue('rule-free-right-on-red', Boolean(config.rules?.freeRightOnRed));
      syncCheckboxValue('rule-four-way-stop', Boolean(config.rules?.fourWayStop));
      syncCheckboxValue('rule-do-not-block-intersection', Boolean(config.rules?.doNotBlockIntersection));
      syncNumericValue('control-benchmark-duration', config.benchmarkDurationTicks ?? 60);
      syncNumericValue('control-spawn-rate', config.spawnRate ?? 0.55);
      syncSelectValue('control-overlay-mode', config.overlayMode ?? 'off');
    },
    renderDiagnostics({ metrics = [], lights = [], events = [] } = {}) {
      renderMetricList('live-metrics', metrics);
      renderTextList('light-summary', lights);
      renderTextList('event-summary', events);
    },
    syncBenchmarkHistory(snapshots = [], selectedIds = {}) {
      const historyList = document.getElementById('benchmark-history-list');
      if (historyList) {
        historyList.innerHTML = snapshots
          .map((snapshot) => `<li>${escapeHtml(snapshot.scenarioName || snapshot.scenarioId || snapshot.mapId || 'scenario')} · score ${escapeHtml(snapshot.score?.total ?? '—')} · seed ${escapeHtml(snapshot.simulationSeed)} · map ${escapeHtml(snapshot.mapSeed)}</li>`)
          .join('');
      }

      syncHistorySelectOptions('control-history-a', snapshots, selectedIds.leftId);
      syncHistorySelectOptions('control-history-b', snapshots, selectedIds.rightId);
    },
    renderBenchmarkComparison(lines = []) {
      renderTextList('benchmark-compare-summary', lines);
    },
    renderCellInspection(lines = []) {
      renderTextList('cell-inspection-summary', lines);
    }
  };
}

function setStatus(id, value) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = value;
  element.classList.add('status-ok');
}

function bindButton(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  element.onclick = handler;
}

function bindSpeedControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  const emitValue = () => {
    const nextValue = Number(element.value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }

    handler(nextValue);
  };

  element.oninput = emitValue;
  element.onchange = emitValue;
  emitValue();
}

function bindSelectControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  const emitValue = () => handler(String(element.value));
  element.onchange = emitValue;
  emitValue();
}

function bindCheckboxControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  const emitValue = () => handler(Boolean(element.checked));
  element.onchange = emitValue;
  emitValue();
}

function bindNumberControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  const emitValue = () => {
    const value = Number(element.value);
    if (!Number.isFinite(value)) {
      return;
    }

    handler(value);
  };

  element.oninput = emitValue;
  element.onchange = emitValue;
  emitValue();
}

function bindHistoryCompareControls(handler) {
  const left = document.getElementById('control-history-a');
  const right = document.getElementById('control-history-b');

  if (!left || !right || typeof handler !== 'function') {
    return;
  }

  const emitValue = () => handler(String(left.value || ''), String(right.value || ''));
  left.onchange = emitValue;
  right.onchange = emitValue;
}

function bindGridCellSelection(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  element.onclick = (event) => {
    const cell = event.target?.closest?.('[data-x][data-y]');
    if (!cell) {
      return;
    }

    handler({
      x: Number(cell.dataset.x),
      y: Number(cell.dataset.y)
    });
  };
}

function bindFileControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || typeof handler !== 'function') {
    return;
  }

  element.onchange = () => {
    const file = element.files?.[0] ?? null;
    if (file) {
      handler(file);
    }
  };
}

function syncSelectValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = String(value);
  }
}

function syncCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.checked = Boolean(value);
  }
}

function syncNumericValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = String(value);
  }
}

function syncHistorySelectOptions(id, snapshots, selectedId) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = snapshots
    .map((snapshot, index) => `<option value="${escapeHtml(snapshot.id)}">${escapeHtml(`${index + 1}. ${snapshot.scenarioName || snapshot.scenarioId || snapshot.mapId || 'scenario'} · score ${snapshot.score?.total ?? '—'}`)}</option>`)
    .join('');

  if (selectedId && snapshots.some((snapshot) => snapshot.id === selectedId)) {
    element.value = selectedId;
  } else if (snapshots[0]) {
    element.value = snapshots[0].id;
  }
}

function formatSpeedMultiplier(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function setVersion(value) {
  const element = document.getElementById('app-version');
  if (!element) {
    return;
  }

  element.textContent = value;
}

function renderMetricList(id, items) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = items
    .map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`)
    .join('');
}

function renderTextList(id, lines) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
