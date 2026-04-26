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
    bindControls({ onPlayPause, onStep, onReset, onSpeedChange } = {}) {
      bindButton('control-play-pause', onPlayPause);
      bindButton('control-step', onStep);
      bindButton('control-reset', onReset);
      bindSpeedControl('control-speed', onSpeedChange);
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
