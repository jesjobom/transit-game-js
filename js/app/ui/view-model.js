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

export function buildLiveMetrics(world, report = null) {
  const metrics = report?.metrics ?? {};

  return [
    { label: 'Tick', value: String(world.tick) },
    { label: 'Status', value: world.status },
    { label: 'Active', value: String(world.entities.vehicles.length) },
    { label: 'Spawned', value: String(world.metrics.spawnedVehicles) },
    { label: 'Moved', value: String(world.metrics.movedVehicles) },
    { label: 'Blocked', value: String(world.metrics.blockedMoves) },
    { label: 'Completed', value: String(world.metrics.completedTrips) },
    { label: 'Turns', value: String(world.metrics.turnsTaken) },
    { label: 'Throughput/tick', value: formatDecimal(metrics.throughputPerTick) },
    { label: 'Avg trip ticks', value: formatDecimal(metrics.avgCompletionTicks) },
    { label: 'Score', value: report ? String(report.score.total) : '—' }
  ];
}

export function buildLightPhaseSummary(world) {
  if (!Array.isArray(world.entities.lights) || world.entities.lights.length === 0) {
    return ['No traffic lights configured'];
  }

  return world.entities.lights.map((light) => {
    const phase = light.phases?.[light.phaseIndex ?? 0];
    const phaseName = phase?.name ?? 'unknown';
    const remaining = typeof light.remainingTicks === 'number' ? light.remainingTicks : '—';
    return `${light.id}: ${phaseName} (${remaining})`;
  });
}

export function buildRecentEventSummary(world, limit = 5) {
  const events = Array.isArray(world.events) ? world.events.slice(-limit) : [];

  if (events.length === 0) {
    return ['No events yet'];
  }

  return events.map((event) => {
    const detail = summarizeEventPayload(event.payload);
    return detail ? `t${event.tick} ${event.type} — ${detail}` : `t${event.tick} ${event.type}`;
  });
}

function summarizeEventPayload(payload = {}) {
  if (payload.vehicleId) {
    if (typeof payload.x === 'number' && typeof payload.y === 'number') {
      return `${payload.vehicleId} @ ${payload.x},${payload.y}`;
    }

    return payload.vehicleId;
  }

  if (payload.lightId && payload.phaseName) {
    return `${payload.lightId} → ${payload.phaseName}`;
  }

  if (payload.spawnPointId) {
    return payload.spawnPointId;
  }

  if (payload.from && payload.to) {
    return `${payload.from}→${payload.to}`;
  }

  return '';
}

function formatDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}
