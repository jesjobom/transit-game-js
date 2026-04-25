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
  const ticksSimulated = world.metrics.ticksSimulated;
  const collisions = world.metrics.collisions;
  const deadlocks = world.metrics.deadlocks;
  const movedVehicles = world.metrics.movedVehicles;
  const activeVehicles = world.entities.vehicles.length;
  const completedTripTicks = world.metrics.completedTripTicks;
  const avgCompletionTicks = completedTrips > 0 ? completedTripTicks / completedTrips : 0;
  const throughputPerTick = ticksSimulated > 0 ? completedTrips / ticksSimulated : 0;
  const blockedMoveRate = ticksSimulated > 0 ? blockedMoves / ticksSimulated : 0;
  const completionRate = spawnedVehicles > 0 ? completedTrips / spawnedVehicles : 0;

  return {
    completedTrips,
    spawnedVehicles,
    activeVehicles,
    movedVehicles,
    blockedMoves,
    collisions,
    deadlocks,
    ticksSimulated,
    completedTripTicks,
    avgCompletionTicks,
    throughputPerTick,
    blockedMoveRate,
    completionRate
  };
}
