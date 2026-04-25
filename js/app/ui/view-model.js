import { APP_VERSION, BUILD_TAG } from '../version.js';

export function buildSimulationSummary(world, benchmarkSummaryLines = []) {
  return [
    `Version: ${APP_VERSION} (${BUILD_TAG})`,
    `Simulation seed: ${world.simulationSeed}`,
    `Map seed: ${world.mapSeed}`,
    `Tick: ${world.tick}`,
    `Status: ${world.status}`,
    `Active vehicles: ${world.entities.vehicles.length}`,
    ...benchmarkSummaryLines
  ];
}
