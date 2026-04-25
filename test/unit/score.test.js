import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateScore } from '../../js/core/score.js';

test('calculateScore returns total and score components', () => {
  const score = calculateScore({
    completedTrips: 3,
    collisions: 1,
    deadlocks: 0,
    blockedMoves: 4,
    avgCompletionTicks: 5
  });

  assert.equal(score.total, -230);
  assert.deepEqual(score.components, {
    efficiency: 300,
    safetyPenalty: 500,
    deadlockPenalty: 0,
    flowPenalty: 20,
    waitPenalty: 10
  });
});
