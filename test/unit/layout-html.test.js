import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const htmlPath = fileURLToPath(new URL('../../transit.html', import.meta.url));
const html = readFileSync(htmlPath, 'utf8');

test('transit html groups advanced tooling behind dedicated panels', () => {
  assert.match(html, /<details id="panel-advanced"/);
  assert.match(html, /<summary><span>Advanced<\/span><small>maps, rules, benchmark tuning<\/small><\/summary>/);
  assert.match(html, /<details id="panel-replay"/);
  assert.match(html, /<summary><span>Replay<\/span><small>timeline and recording controls<\/small><\/summary>/);
  assert.match(html, /id="control-replay-enabled"/);
  assert.match(html, /id="control-map-zoom-auto"/);
  assert.match(html, /id="control-map-zoom"/);
  assert.match(html, /Auto fit zoom/);
  assert.match(html, /Resize the map inside the viewport\./);
  assert.match(html, /id="control-light-phase-duration"/);
  assert.match(html, /title="Vehicle spawn attempts per tick\./);
  assert.match(html, /<details id="panel-diagnostics"/);
  assert.match(html, /<summary><span>Diagnostics<\/span><small>live metrics, lights, events, inspector<\/small><\/summary>/);
  assert.match(html, /<details id="panel-benchmark-lab"/);
  assert.match(html, /<summary><span>Benchmark Lab<\/span><small>history and A\/B comparisons<\/small><\/summary>/);
});
