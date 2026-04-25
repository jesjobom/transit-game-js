export function calculateScore(metrics) {
  const efficiency = metrics.completedTrips * 100;
  const safetyPenalty = metrics.collisions * 500;
  const deadlockPenalty = metrics.deadlocks * 1000;
  const flowPenalty = metrics.blockedMoves * 5;
  const waitPenalty = Number(metrics.avgCompletionTicks || 0) * 2;

  const total = efficiency - safetyPenalty - deadlockPenalty - flowPenalty - waitPenalty;

  return {
    total,
    components: {
      efficiency,
      safetyPenalty,
      deadlockPenalty,
      flowPenalty,
      waitPenalty
    }
  };
}
