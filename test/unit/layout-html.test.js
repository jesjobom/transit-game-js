import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const htmlPath = fileURLToPath(new URL('../../transit.html', import.meta.url));
const html = readFileSync(htmlPath, 'utf8');

test('transit html groups advanced tooling behind dedicated panels', () => {
  assert.match(html, /<details id="panel-advanced"/);
  assert.match(html, /<summary>Advanced<\/summary>/);
  assert.match(html, /<details id="panel-replay"/);
  assert.match(html, /<summary>Replay<\/summary>/);
  assert.match(html, /id="control-replay-enabled"/);
  assert.match(html, /<details id="panel-diagnostics"/);
  assert.match(html, /<summary>Diagnostics<\/summary>/);
  assert.match(html, /<details id="panel-benchmark-lab"/);
  assert.match(html, /<summary>Benchmark Lab<\/summary>/);
});
