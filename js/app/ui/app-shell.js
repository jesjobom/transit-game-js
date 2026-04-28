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
      onImportScenario
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
      bindFileControl('control-scenario-import', onImportScenario);
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
    },
    renderDiagnostics({ metrics = [], lights = [], events = [] } = {}) {
      renderMetricList('live-metrics', metrics);
      renderTextList('light-summary', lights);
      renderTextList('event-summary', events);
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
