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
    ['control-replay-toggle', createElement('control-replay-toggle')],
    ['control-replay-play-pause', createElement('control-replay-play-pause')],
    ['control-replay-frame', Object.assign(createElement('control-replay-frame'), { value: '0', min: '0', max: '0' })],
    ['control-replay-frame-value', createElement('control-replay-frame-value')],
    ['control-mode', Object.assign(createElement('control-mode'), { value: 'benchmark' })],
    ['control-speed', Object.assign(createElement('control-speed'), { value: '0.75' })],
    ['control-benchmark-duration', Object.assign(createElement('control-benchmark-duration'), { value: '60' })],
    ['control-spawn-rate', Object.assign(createElement('control-spawn-rate'), { value: '0.55' })],
    ['rule-free-right-on-red', Object.assign(createElement('rule-free-right-on-red'), { checked: false })],
    ['rule-four-way-stop', Object.assign(createElement('rule-four-way-stop'), { checked: false })],
    ['rule-do-not-block-intersection', Object.assign(createElement('rule-do-not-block-intersection'), { checked: false })],
    ['control-scenario', Object.assign(createElement('control-scenario'), { value: '' })],
    ['control-map-mode', Object.assign(createElement('control-map-mode'), { value: 'fixed' })],
    ['control-procedural-width', Object.assign(createElement('control-procedural-width'), { value: '15' })],
    ['control-procedural-height', Object.assign(createElement('control-procedural-height'), { value: '13' })],
    ['control-procedural-density', Object.assign(createElement('control-procedural-density'), { value: '0.6' })],
    ['control-procedural-signal-rate', Object.assign(createElement('control-procedural-signal-rate'), { value: '0.45' })],
    ['control-overlay-mode', Object.assign(createElement('control-overlay-mode'), { value: 'off' })],
    ['control-scenario-import', Object.assign(createElement('control-scenario-import'), { files: [] })],
    ['control-history-a', Object.assign(createElement('control-history-a'), { value: '' })],
    ['control-history-b', Object.assign(createElement('control-history-b'), { value: '' })],
    ['control-speed-value', createElement('control-speed-value')],
    ['live-metrics', createElement('live-metrics')],
    ['light-summary', createElement('light-summary')],
    ['event-summary', createElement('event-summary')],
    ['benchmark-history-list', createElement('benchmark-history-list')],
    ['benchmark-compare-summary', createElement('benchmark-compare-summary')],
    ['cell-inspection-summary', createElement('cell-inspection-summary')],
    ['simulation-root', createElement('simulation-root')]
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
    const overlayModes = [];
    const mapModes = [];
    const proceduralWidthCalls = [];
    const proceduralHeightCalls = [];
    const proceduralDensityCalls = [];
    const proceduralSignalCalls = [];
    const selectedCells = [];
    let replayToggleCalls = 0;
    let replayPlayPauseCalls = 0;
    const replayFrameCalls = [];
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
      onMapModeChange(nextMode) {
        mapModes.push(nextMode);
      },
      onRuleChange(ruleKey, enabled) {
        ruleCalls.push([ruleKey, enabled]);
      },
      onProceduralWidthChange(value) {
        proceduralWidthCalls.push(value);
      },
      onProceduralHeightChange(value) {
        proceduralHeightCalls.push(value);
      },
      onProceduralDensityChange(value) {
        proceduralDensityCalls.push(value);
      },
      onProceduralSignalRateChange(value) {
        proceduralSignalCalls.push(value);
      },
      onHistorySelectionChange(leftId, rightId) {
        historySelections.push([leftId, rightId]);
      },
      onOverlayModeChange(mode) {
        overlayModes.push(mode);
      },
      onGridCellSelect(cell) {
        selectedCells.push(cell);
      },
      onReplayToggle() {
        replayToggleCalls += 1;
      },
      onReplayPlayPause() {
        replayPlayPauseCalls += 1;
      },
      onReplayFrameChange(frameIndex) {
        replayFrameCalls.push(frameIndex);
      }
    });

    elements.get('control-step').onclick();
    assert.equal(stepCalls, 1);
    assert.deepEqual(speedCalls, [0.75]);
    assert.deepEqual(modeCalls, ['benchmark']);
    assert.deepEqual(mapModes, ['fixed']);
    assert.deepEqual(proceduralWidthCalls, [15]);
    assert.deepEqual(proceduralHeightCalls, [13]);
    assert.deepEqual(proceduralDensityCalls, [0.6]);
    assert.deepEqual(proceduralSignalCalls, [0.45]);
    assert.deepEqual(overlayModes, ['off']);
    assert.deepEqual(ruleCalls, [
      ['freeRightOnRed', false],
      ['fourWayStop', false],
      ['doNotBlockIntersection', false]
    ]);

    elements.get('control-speed').value = '1.5';
    elements.get('control-speed').oninput();
    assert.deepEqual(speedCalls, [0.75, 1.5]);

    elements.get('control-replay-toggle').onclick();
    elements.get('control-replay-play-pause').onclick();
    elements.get('control-replay-frame').value = '2';
    elements.get('control-replay-frame').oninput();
    assert.equal(replayToggleCalls, 1);
    assert.equal(replayPlayPauseCalls, 1);
    assert.deepEqual(replayFrameCalls, [2]);

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

    elements.get('simulation-root').onclick({
      target: {
        closest(selector) {
          if (selector === '[data-vehicle-id]') {
            return { dataset: { vehicleId: 'vehicle-9' } };
          }

          return { dataset: { x: '7', y: '3' } };
        }
      }
    });
    assert.deepEqual(selectedCells.at(-1), { x: 7, y: 3, vehicleId: 'vehicle-9' });

    appShell.renderCellInspection(['Cell: 7,3', 'Type: intersection']);
    assert.match(elements.get('cell-inspection-summary').innerHTML, /Type: intersection/);

    appShell.syncReplayState([{ tick: 0 }, { tick: 1 }, { tick: 2 }], { enabled: true, isPlaying: false, frameIndex: 2 });
    assert.equal(elements.get('control-replay-toggle').textContent, 'Exit Replay');
    assert.equal(elements.get('control-replay-play-pause').textContent, 'Play Replay');
    assert.equal(elements.get('control-replay-frame').max, '2');
    assert.match(elements.get('control-replay-frame-value').textContent, /tick 2/);

    appShell.syncSimulationConfig({
      mode: 'sandbox',
      benchmarkDurationTicks: 90,
      spawnRate: 0.4,
      mapMode: 'procedural',
      procedural: {
        width: 17,
        height: 15,
        density: 0.7,
        signalRate: 0.5
      },
      overlayMode: 'flow',
      rules: {
        freeRightOnRed: true,
        fourWayStop: true,
        doNotBlockIntersection: false
      }
    });
    assert.equal(elements.get('control-mode').value, 'sandbox');
    assert.equal(elements.get('control-benchmark-duration').value, '90');
    assert.equal(elements.get('control-spawn-rate').value, '0.4');
    assert.equal(elements.get('control-map-mode').value, 'procedural');
    assert.equal(elements.get('control-procedural-width').value, '17');
    assert.equal(elements.get('control-procedural-height').value, '15');
    assert.equal(elements.get('control-procedural-density').value, '0.7');
    assert.equal(elements.get('control-procedural-signal-rate').value, '0.5');
    assert.equal(elements.get('control-overlay-mode').value, 'flow');
    assert.equal(elements.get('rule-free-right-on-red').checked, true);
  } finally {
    globalThis.document = originalDocument;
  }
});
