import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppShell } from '../../js/app/ui/app-shell.js';

function createElement(id) {
  return {
    id,
    textContent: '',
    value: '',
    classList: {
      values: new Set(),
      add(value) {
        this.values.add(value);
      }
    },
    dataset: {},
    disabled: false,
    onclick: null,
    onchange: null,
    innerHTML: ''
  };
}

test('createAppShell binds step control, speed control, and disables step while running', () => {
  const elements = new Map([
    ['status-app', createElement('status-app')],
    ['status-renderer', createElement('status-renderer')],
    ['status-engine', createElement('status-engine')],
    ['app-version', createElement('app-version')],
    ['control-play-pause', createElement('control-play-pause')],
    ['control-step', createElement('control-step')],
    ['control-reset', createElement('control-reset')],
    ['control-speed', Object.assign(createElement('control-speed'), { value: '0.75' })],
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
    const speedCalls = [];
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
      onReset() {},
      onSpeedChange(nextSpeed) {
        speedCalls.push(nextSpeed);
      }
    });

    elements.get('control-step').onclick();
    assert.equal(stepCalls, 1);
    assert.deepEqual(speedCalls, [0.75]);

    elements.get('control-speed').value = '1.5';
    elements.get('control-speed').onchange();
    assert.deepEqual(speedCalls, [0.75, 1.5]);

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
