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
    bindControls({ onPlayPause, onReset } = {}) {
      bindButton('control-play-pause', onPlayPause);
      bindButton('control-reset', onReset);
    },
    setRunningState(isRunning) {
      const button = document.getElementById('control-play-pause');
      if (!button) {
        return;
      }

      button.textContent = isRunning ? 'Pause' : 'Play';
      button.dataset.running = String(isRunning);
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

function setVersion(value) {
  const element = document.getElementById('app-version');
  if (!element) {
    return;
  }

  element.textContent = value;
}
