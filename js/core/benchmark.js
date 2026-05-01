import { calculateScore } from './score.js';

export function finalizeBenchmark(world) {
  const metrics = buildBenchmarkMetrics(world);
  const score = calculateScore(metrics);

  return {
    simulationSeed: world.simulationSeed,
    mapSeed: world.mapSeed,
    mapId: world.map.id,
    tick: world.tick,
    benchmark: {
      ...world.config.benchmark
    },
    metrics,
    score,
    rules: {
      ...world.config.rules
    }
  };
}

export function buildBenchmarkMetrics(world) {
  const completedTrips = world.metrics.completedTrips;
  const spawnedVehicles = world.metrics.spawnedVehicles;
  const blockedMoves = world.metrics.blockedMoves;
  const lightChanges = world.metrics.lightChanges;
  const ticksSimulated = world.metrics.ticksSimulated;
  const collisions = world.metrics.collisions;
  const deadlocks = world.metrics.deadlocks;
  const movedVehicles = world.metrics.movedVehicles;
  const activeVehicles = world.entities.vehicles.length;
  const completedTripTicks = world.metrics.completedTripTicks;
  const participantVehicles = Math.max(spawnedVehicles, completedTrips + activeVehicles, 1);
  const avgCompletionTicks = completedTrips > 0 ? completedTripTicks / completedTrips : 0;
  const throughputPerTick = ticksSimulated > 0 ? completedTrips / ticksSimulated : 0;
  const blockedMoveRate = ticksSimulated > 0 ? blockedMoves / ticksSimulated : 0;
  const completionRate = spawnedVehicles > 0 ? completedTrips / spawnedVehicles : 0;
  const avgStoppedTicks = world.metrics.stoppedTicksTotal / participantVehicles;
  const avgQueueLength = ticksSimulated > 0 ? world.metrics.queueLengthAccumulated / ticksSimulated : 0;
  const avgRoadOccupancy = ticksSimulated > 0 ? world.metrics.roadOccupancyAccumulated / ticksSimulated : 0;
  const avgEffectiveSpeed = movedVehicles / participantVehicles;
  const tripTimeVariance = calculateVariance(world.metrics.completedTripDurations);
  const fairness = buildDirectionalFairnessMetrics(world.metrics.directionalFlow);

  return {
    completedTrips,
    spawnedVehicles,
    activeVehicles,
    movedVehicles,
    blockedMoves,
    lightChanges,
    collisions,
    deadlocks,
    ticksSimulated,
    completedTripTicks,
    avgCompletionTicks,
    throughputPerTick,
    blockedMoveRate,
    completionRate,
    avgStoppedTicks,
    avgQueueLength,
    avgRoadOccupancy,
    avgEffectiveSpeed,
    tripTimeVariance,
    fairnessScore: fairness.fairnessScore,
    fairnessByDirection: fairness.fairnessByDirection,
    throughputByIntersection: {
      ...world.metrics.intersectionThroughputByKey
    }
  };
}

function buildDirectionalFairnessMetrics(directionalFlow = {}) {
  const fairnessByDirection = {};
  const completionRates = [];

  for (const direction of ['north', 'east', 'south', 'west']) {
    const stats = directionalFlow[direction] ?? {};
    const spawned = Number(stats.spawned ?? 0);
    const completed = Number(stats.completed ?? 0);
    const blocked = Number(stats.blocked ?? 0);
    const stoppedTicks = Number(stats.stoppedTicks ?? 0);
    const moved = Number(stats.moved ?? 0);
    const completionRate = spawned > 0 ? completed / spawned : null;
    const avgStoppedTicks = spawned > 0 ? stoppedTicks / spawned : 0;

    fairnessByDirection[direction] = {
      spawned,
      completed,
      blocked,
      moved,
      stoppedTicks,
      completionRate,
      avgStoppedTicks
    };

    if (completionRate !== null) {
      completionRates.push(completionRate);
    }
  }

  if (completionRates.length < 2) {
    return {
      fairnessScore: 1,
      fairnessByDirection
    };
  }

  const maxRate = Math.max(...completionRates);
  const minRate = Math.min(...completionRates);
  const fairnessScore = maxRate <= 0 ? 1 : minRate / maxRate;

  return {
    fairnessScore,
    fairnessByDirection
  };
}

function calculateVariance(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
}
