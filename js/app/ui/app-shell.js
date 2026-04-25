export function createAppShell({ world, engine, renderer, benchmark }) {
  setStatus('status-app', 'ready');
  setStatus('status-renderer', renderer.status);
  setStatus('status-engine', engine.status);

  return {
    world,
    engine,
    renderer,
    benchmark
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
