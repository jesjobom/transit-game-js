export function calculateScore(metrics) {
  const efficiency = metrics.completedTrips * 100;
  const safetyPenalty = metrics.collisions * 500;
  const deadlockPenalty = metrics.deadlocks * 1000;
  const flowPenalty = metrics.blockedMoves * 5;
  const waitPenalty = Number(metrics.avgCompletionTicks || 0) * 2;
  const fairnessPenalty = (1 - clampFairness(metrics.fairnessScore)) * 100;

  const total = efficiency - safetyPenalty - deadlockPenalty - flowPenalty - waitPenalty - fairnessPenalty;

  return {
    total,
    components: {
      efficiency,
      safetyPenalty,
      deadlockPenalty,
      flowPenalty,
      waitPenalty,
      fairnessPenalty
    }
  };
}

function clampFairness(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(0, Math.min(1, value));
}
