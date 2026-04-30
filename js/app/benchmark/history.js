const STORAGE_KEY = 'transit-game-js:benchmark-history:v1';
const MAX_HISTORY_ENTRIES = 24;

export function createBenchmarkHistoryStore({ storage = globalThis.localStorage, storageKey = STORAGE_KEY } = {}) {
  return {
    loadSnapshots() {
      return loadSnapshotsFromStorage(storage, storageKey);
    },
    saveReport(report, context = {}) {
      const snapshots = loadSnapshotsFromStorage(storage, storageKey);
      const snapshot = createBenchmarkSnapshot(report, context);
      const nextSnapshots = [snapshot, ...snapshots].slice(0, MAX_HISTORY_ENTRIES);
      persistSnapshots(storage, storageKey, nextSnapshots);
      return snapshot;
    },
    buildComparison(leftId, rightId) {
      const snapshots = loadSnapshotsFromStorage(storage, storageKey);
      const left = snapshots.find((entry) => entry.id === leftId) ?? null;
      const right = snapshots.find((entry) => entry.id === rightId) ?? null;
      return buildBenchmarkComparison(left, right);
    },
    clear() {
      if (!storage || typeof storage.removeItem !== 'function') {
        return;
      }

      storage.removeItem(storageKey);
    }
  };
}

export function createBenchmarkSnapshot(report, context = {}) {
  const createdAt = context.createdAt ?? new Date().toISOString();
  const scenarioLabel = context.scenarioName ?? context.scenarioId ?? report.mapId;
  const id = context.id ?? buildSnapshotId(report, createdAt, scenarioLabel);

  return {
    id,
    createdAt,
    appVersion: context.appVersion ?? '',
    scenarioId: context.scenarioId ?? '',
    scenarioName: context.scenarioName ?? '',
    simulationSeed: report.simulationSeed,
    mapSeed: report.mapSeed,
    mapId: report.mapId,
    tick: report.tick,
    benchmark: structuredClone(report.benchmark ?? {}),
    rules: structuredClone(report.rules ?? {}),
    metrics: structuredClone(report.metrics ?? {}),
    score: structuredClone(report.score ?? {})
  };
}

export function buildBenchmarkComparison(left, right) {
  if (!left || !right) {
    return null;
  }

  return {
    left,
    right,
    scoreDelta: diffNumber(right.score?.total, left.score?.total),
    completedTripsDelta: diffNumber(right.metrics?.completedTrips, left.metrics?.completedTrips),
    throughputDelta: diffNumber(right.metrics?.throughputPerTick, left.metrics?.throughputPerTick),
    avgCompletionTicksDelta: diffNumber(right.metrics?.avgCompletionTicks, left.metrics?.avgCompletionTicks),
    avgStoppedTicksDelta: diffNumber(right.metrics?.avgStoppedTicks, left.metrics?.avgStoppedTicks),
    avgQueueLengthDelta: diffNumber(right.metrics?.avgQueueLength, left.metrics?.avgQueueLength),
    deadlocksDelta: diffNumber(right.metrics?.deadlocks, left.metrics?.deadlocks),
    fairnessDelta: diffNumber(right.metrics?.fairnessScore, left.metrics?.fairnessScore)
  };
}

function buildSnapshotId(report, createdAt, scenarioLabel) {
  const compactTimestamp = String(createdAt).replaceAll(/[^0-9TZ:-]/g, '').replaceAll(':', '').replaceAll('-', '');
  const scenarioSlug = String(scenarioLabel)
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 24) || 'scenario';

  return `${compactTimestamp}-${scenarioSlug}-${report.simulationSeed}-${report.mapSeed}-${report.tick}`;
}

function loadSnapshotsFromStorage(storage, storageKey) {
  if (!storage || typeof storage.getItem !== 'function') {
    return [];
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSnapshots(storage, storageKey, snapshots) {
  if (!storage || typeof storage.setItem !== 'function') {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(snapshots));
}

function diffNumber(right, left) {
  if (!Number.isFinite(right) || !Number.isFinite(left)) {
    return null;
  }

  return right - left;
}
