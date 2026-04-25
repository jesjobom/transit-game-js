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

test('createAppShell binds step controls and disables them appropriately while running', () => {
  const elements = new Map([
    ['status-app', createElement('status-app')],
    ['status-renderer', createElement('status-renderer')],
    ['status-engine', createElement('status-engine')],
    ['app-version', createElement('app-version')],
    ['control-play-pause', createElement('control-play-pause')],
    ['control-step-back', createElement('control-step-back')],
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
    let stepBackCalls = 0;
    const appShell = createAppShell({
      world: {},
      engine: { status: 'ready' },
      renderer: { status: 'ready' },
      benchmark: {},
      appVersion: 'Sprint test'
    });

    appShell.bindControls({
      onPlayPause() {},
      onStepBack() {
        stepBackCalls += 1;
      },
      onStep() {
        stepCalls += 1;
      },
      onReset() {}
    });

    elements.get('control-step-back').onclick();
    elements.get('control-step').onclick();
    assert.equal(stepBackCalls, 1);
    assert.equal(stepCalls, 1);

    appShell.setRunningState(true, { canStepBack: true });
    assert.equal(elements.get('control-play-pause').textContent, 'Pause');
    assert.equal(elements.get('control-step-back').disabled, true);
    assert.equal(elements.get('control-step').disabled, true);

    appShell.setRunningState(false, { canStepBack: false });
    assert.equal(elements.get('control-play-pause').textContent, 'Play');
    assert.equal(elements.get('control-step-back').disabled, true);
    assert.equal(elements.get('control-step').disabled, false);

    appShell.setRunningState(false, { canStepBack: true });
    assert.equal(elements.get('control-step-back').disabled, false);
  } finally {
    globalThis.document = originalDocument;
  }
});
