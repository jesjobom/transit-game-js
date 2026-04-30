import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppShell } from '../../js/app/ui/app-shell.js';

function createElement(id) {
  return {
    id,
    textContent: '',
    value: '',
    checked: false,
    files: [],
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
    oninput: null,
    innerHTML: ''
  };
}

test('createAppShell binds step control, speed control, mode, rules, and disables step while running', () => {
  const elements = new Map([
    ['status-app', createElement('status-app')],
    ['status-renderer', createElement('status-renderer')],
    ['status-engine', createElement('status-engine')],
    ['app-version', createElement('app-version')],
    ['control-play-pause', createElement('control-play-pause')],
    ['control-step', createElement('control-step')],
    ['control-reset', createElement('control-reset')],
    ['control-mode', Object.assign(createElement('control-mode'), { value: 'benchmark' })],
    ['control-speed', Object.assign(createElement('control-speed'), { value: '0.75' })],
    ['control-benchmark-duration', Object.assign(createElement('control-benchmark-duration'), { value: '60' })],
    ['control-spawn-rate', Object.assign(createElement('control-spawn-rate'), { value: '0.55' })],
    ['rule-free-right-on-red', Object.assign(createElement('rule-free-right-on-red'), { checked: false })],
    ['rule-four-way-stop', Object.assign(createElement('rule-four-way-stop'), { checked: false })],
    ['rule-do-not-block-intersection', Object.assign(createElement('rule-do-not-block-intersection'), { checked: false })],
    ['control-scenario', Object.assign(createElement('control-scenario'), { value: '' })],
    ['control-scenario-import', Object.assign(createElement('control-scenario-import'), { files: [] })],
    ['control-history-a', Object.assign(createElement('control-history-a'), { value: '' })],
    ['control-history-b', Object.assign(createElement('control-history-b'), { value: '' })],
    ['control-speed-value', createElement('control-speed-value')],
    ['live-metrics', createElement('live-metrics')],
    ['light-summary', createElement('light-summary')],
    ['event-summary', createElement('event-summary')],
    ['benchmark-history-list', createElement('benchmark-history-list')],
    ['benchmark-compare-summary', createElement('benchmark-compare-summary')]
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
    const modeCalls = [];
    const ruleCalls = [];
    const historySelections = [];
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
      },
      onModeChange(nextMode) {
        modeCalls.push(nextMode);
      },
      onRuleChange(ruleKey, enabled) {
        ruleCalls.push([ruleKey, enabled]);
      },
      onHistorySelectionChange(leftId, rightId) {
        historySelections.push([leftId, rightId]);
      }
    });

    elements.get('control-step').onclick();
    assert.equal(stepCalls, 1);
    assert.deepEqual(speedCalls, [0.75]);
    assert.deepEqual(modeCalls, ['benchmark']);
    assert.deepEqual(ruleCalls, [
      ['freeRightOnRed', false],
      ['fourWayStop', false],
      ['doNotBlockIntersection', false]
    ]);

    elements.get('control-speed').value = '1.5';
    elements.get('control-speed').oninput();
    assert.deepEqual(speedCalls, [0.75, 1.5]);

    appShell.setSpeedState(1.5, 280);
    assert.equal(elements.get('control-speed-value').textContent, '1.5× · 280ms/tick');

    appShell.setRunningState(true);
    assert.equal(elements.get('control-play-pause').textContent, 'Pause');
    assert.equal(elements.get('control-step').disabled, true);

    appShell.setRunningState(false);
    assert.equal(elements.get('control-play-pause').textContent, 'Play');
    assert.equal(elements.get('control-step').disabled, false);

    appShell.syncScenarioCatalog([
      { id: 'baseline-benchmark', name: 'Baseline benchmark grid' },
      { id: 'priority-cross', name: 'Priority cross tutorial' }
    ], 'priority-cross');
    assert.match(elements.get('control-scenario').innerHTML, /priority-cross/);
    assert.equal(elements.get('control-scenario').value, 'priority-cross');

    appShell.syncBenchmarkHistory([
      { id: 'run-b', scenarioName: 'Baseline benchmark grid', mapId: 'baseline-benchmark', simulationSeed: 456, mapSeed: 654, score: { total: 220 } },
      { id: 'run-a', scenarioName: 'Baseline benchmark grid', mapId: 'baseline-benchmark', simulationSeed: 123, mapSeed: 321, score: { total: 180 } }
    ], { leftId: 'run-a', rightId: 'run-b' });
    assert.match(elements.get('benchmark-history-list').innerHTML, /score 220/);
    assert.equal(elements.get('control-history-a').value, 'run-a');
    assert.equal(elements.get('control-history-b').value, 'run-b');

    elements.get('control-history-a').value = 'run-b';
    elements.get('control-history-b').value = 'run-a';
    elements.get('control-history-a').onchange();
    assert.deepEqual(historySelections.at(-1), ['run-b', 'run-a']);

    appShell.renderBenchmarkComparison(['A: baseline', 'Score Δ (B-A): +10']);
    assert.match(elements.get('benchmark-compare-summary').innerHTML, /Score Δ/);

    appShell.syncSimulationConfig({
      mode: 'sandbox',
      benchmarkDurationTicks: 90,
      spawnRate: 0.4,
      rules: {
        freeRightOnRed: true,
        fourWayStop: true,
        doNotBlockIntersection: false
      }
    });
    assert.equal(elements.get('control-mode').value, 'sandbox');
    assert.equal(elements.get('control-benchmark-duration').value, '90');
    assert.equal(elements.get('control-spawn-rate').value, '0.4');
    assert.equal(elements.get('rule-free-right-on-red').checked, true);
  } finally {
    globalThis.document = originalDocument;
  }
});
