import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppShell } from '../../js/app/ui/app-shell.js';

function createElement(id) {
  return {
    id,
    textContent: '',
    classList: {
      values: new Set(),
      add(value) {
        this.values.add(value);
      }
    },
    dataset: {},
    disabled: false,
    onclick: null,
    innerHTML: ''
  };
}

test('createAppShell binds step control and disables it while running', () => {
  const elements = new Map([
    ['status-app', createElement('status-app')],
    ['status-renderer', createElement('status-renderer')],
    ['status-engine', createElement('status-engine')],
    ['app-version', createElement('app-version')],
    ['control-play-pause', createElement('control-play-pause')],
    ['control-step', createElement('control-step')],
    ['control-reset', createElement('control-reset')],
    ['live-metrics', createElement('live-metrics')],
    ['light-summary', createElement('light-summary')],
    ['event-summary', createElement('event-summary')]
  ]);

  const originalDocument = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      return elements.get(id) ?? null;
    }
  };

  try {
    let stepCalls = 0;
    const appShell = createAppShell({
      world: {},
      engine: { status: 'ready' },
      renderer: { status: 'ready' },
      benchmark: {},
      appVersion: 'Sprint test'
    });

    appShell.bindControls({
      onPlayPause() {},
      onStep() {
        stepCalls += 1;
      },
      onReset() {}
    });

    elements.get('control-step').onclick();
    assert.equal(stepCalls, 1);

    appShell.setRunningState(true);
    assert.equal(elements.get('control-play-pause').textContent, 'Pause');
    assert.equal(elements.get('control-step').disabled, true);

    appShell.setRunningState(false);
    assert.equal(elements.get('control-play-pause').textContent, 'Play');
    assert.equal(elements.get('control-step').disabled, false);
  } finally {
    globalThis.document = originalDocument;
  }
});
