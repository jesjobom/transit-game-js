import { getCell, getIntersection, toPositionKey } from '../../core/map.js';
import { APP_VERSION, BUILD_TAG } from '../version.js';

export function buildBenchmarkHistoryLines(snapshots = []) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return ['No benchmark snapshots saved yet'];
  }

  return snapshots.map((snapshot, index) => {
    const score = Number.isFinite(snapshot.score?.total) ? snapshot.score.total : '—';
    const throughput = formatDecimal(snapshot.metrics?.throughputPerTick);
    const completedTrips = snapshot.metrics?.completedTrips ?? '—';
    const fairness = formatDecimal(snapshot.metrics?.fairnessScore);
    const scenario = snapshot.scenarioName || snapshot.scenarioId || snapshot.mapId || 'scenario';
    return `${index + 1}. ${scenario} | score=${score} | trips=${completedTrips} | throughput=${throughput} | fairness=${fairness} | seed=${snapshot.simulationSeed} | mapSeed=${snapshot.mapSeed}`;
  });
}

export function buildBenchmarkComparisonLines(comparison) {
  if (!comparison) {
    return ['Pick two benchmark snapshots to compare'];
  }

  const leftLabel = buildSnapshotLabel(comparison.left);
  const rightLabel = buildSnapshotLabel(comparison.right);

  return [
    `A: ${leftLabel}`,
    `B: ${rightLabel}`,
    `Score Δ (B-A): ${formatSignedNumber(comparison.scoreDelta, 0)}`,
    `Completed trips Δ: ${formatSignedNumber(comparison.completedTripsDelta, 0)}`,
    `Throughput Δ: ${formatSignedNumber(comparison.throughputDelta, 3)}`,
    `Avg trip ticks Δ: ${formatSignedNumber(comparison.avgCompletionTicksDelta, 2)}`,
    `Avg stopped Δ: ${formatSignedNumber(comparison.avgStoppedTicksDelta, 2)}`,
    `Avg queue Δ: ${formatSignedNumber(comparison.avgQueueLengthDelta, 2)}`,
    `Deadlocks Δ: ${formatSignedNumber(comparison.deadlocksDelta, 0)}`,
    `Fairness Δ: ${formatSignedNumber(comparison.fairnessDelta, 2)}`
  ];
}

export function buildSimulationSummary(world, benchmarkSummaryLines = []) {
  const activeRules = Object.entries(world.config.rules || {})
    .filter(([, enabled]) => enabled)
    .map(([rule]) => rule);

  return [
    `Version: ${APP_VERSION} (${BUILD_TAG})`,
    `Scenario: ${world.scenarioName ?? world.scenarioId ?? world.map.id}`,
    `Mode: ${world.config.benchmark.mode}`,
    `Simulation seed: ${world.simulationSeed}`,
    `Map seed: ${world.mapSeed}`,
    `Tick: ${world.tick}`,
    `Status: ${world.status}`,
    `Active vehicles: ${world.entities.vehicles.length}`,
    `Rules: ${activeRules.length > 0 ? activeRules.join(', ') : 'default'}`,
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
    { label: 'Deadlocks', value: String(world.metrics.deadlocks) },
    { label: 'Mode', value: world.config.benchmark.mode },
    { label: 'Throughput/tick', value: formatDecimal(metrics.throughputPerTick) },
    { label: 'Avg trip ticks', value: formatDecimal(metrics.avgCompletionTicks) },
    { label: 'Avg stopped', value: formatDecimal(metrics.avgStoppedTicks) },
    { label: 'Avg queue', value: formatDecimal(metrics.avgQueueLength) },
    { label: 'Occupancy', value: formatDecimal(metrics.avgRoadOccupancy) },
    { label: 'Fairness', value: formatDecimal(metrics.fairnessScore) },
    { label: 'Score', value: report ? String(report.score.total) : '—' }
  ];
}

export function buildCellInspectionLines(world, selectedCell) {
  if (!selectedCell || !Number.isFinite(selectedCell.x) || !Number.isFinite(selectedCell.y)) {
    return ['Click a road or intersection cell to inspect it'];
  }

  const road = getCell(world.map, selectedCell.x, selectedCell.y);
  const intersection = getIntersection(world.map, selectedCell.x, selectedCell.y);
  const positionKey = toPositionKey(selectedCell.x, selectedCell.y);
  const cellStats = world.metrics.cellStatsByKey?.[positionKey] ?? {};
  const vehicles = world.entities.vehicles.filter((vehicle) => vehicle.x === selectedCell.x && vehicle.y === selectedCell.y);

  return [
    `Cell: ${selectedCell.x},${selectedCell.y}`,
    `Type: ${intersection ? 'intersection' : road ? 'road' : 'lot'}`,
    `Directions: ${road?.allowedDirections?.join(', ') || '—'}`,
    `Vehicles here: ${vehicles.length}`,
    `Occupancy ticks: ${cellStats.occupancyTicks ?? 0}`,
    `Blocked ticks: ${cellStats.blockedTicks ?? 0}`,
    `Flow count: ${cellStats.passThroughCount ?? 0}`,
    `Intersection throughput: ${world.metrics.intersectionThroughputByKey?.[positionKey] ?? 0}`
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
    const parts = [];

    if (typeof payload.x === 'number' && typeof payload.y === 'number') {
      parts.push(`${payload.vehicleId} @ ${payload.x},${payload.y}`);
    } else {
      parts.push(payload.vehicleId);
    }

    if (payload.reason) {
      parts.push(`reason=${payload.reason}`);
    }

    if (payload.blockingVehicleId) {
      parts.push(`by=${payload.blockingVehicleId}`);
    }

    if (payload.blockedByLightId && payload.blockedByPhase) {
      parts.push(`light=${payload.blockedByLightId}/${payload.blockedByPhase}`);
    }

    return parts.join(' | ');
  }

  if (payload.lightId && payload.phaseName) {
    return `${payload.lightId} → ${payload.phaseName}`;
  }

  if (payload.spawnPointId) {
    return payload.reason ? `${payload.spawnPointId} | reason=${payload.reason}` : payload.spawnPointId;
  }

  if (payload.from && payload.to) {
    return `${payload.from}→${payload.to}`;
  }

  return payload.reason ? `reason=${payload.reason}` : '';
}

function buildSnapshotLabel(snapshot = {}) {
  const scenario = snapshot.scenarioName || snapshot.scenarioId || snapshot.mapId || 'scenario';
  const score = Number.isFinite(snapshot.score?.total) ? snapshot.score.total : '—';
  const fairness = formatDecimal(snapshot.metrics?.fairnessScore);
  return `${scenario} | score=${score} | fairness=${fairness} | seed=${snapshot.simulationSeed} | mapSeed=${snapshot.mapSeed}`;
}

function formatDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

function formatSignedNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  const fixed = value.toFixed(decimals);
  return value > 0 ? `+${fixed}` : fixed;
}
