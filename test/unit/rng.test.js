import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeededRng, normalizeSeed } from '../../js/core/rng.js';

test('normalizeSeed keeps deterministic unsigned integer seeds', () => {
  assert.equal(normalizeSeed(42), 42);
  assert.equal(normalizeSeed(-1), 4294967295);
  assert.equal(normalizeSeed('abc'), 123456789);
});

test('createSeededRng produces the same sequence for the same seed', () => {
  const first = createSeededRng(20260425);
  const second = createSeededRng(20260425);

  const sequenceA = [first.nextInt(), first.nextInt(), first.nextInt()];
  const sequenceB = [second.nextInt(), second.nextInt(), second.nextInt()];

  assert.deepEqual(sequenceA, sequenceB);
});

test('createSeededRng exposes reproducible float values and state', () => {
  const rng = createSeededRng(7);
  const value = rng.nextFloat();

  assert.equal(typeof value, 'number');
  assert.ok(value >= 0 && value < 1);
  assert.equal(rng.getState(), 1025555898);
});
