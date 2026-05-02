export function getScenarioCatalog(extraScenarios = []) {
  return [...BUILTIN_SCENARIOS, ...extraScenarios].map((scenario) => normalizeScenarioDefinition(scenario).scenario);
}

export function getScenarioById(id, extraScenarios = []) {
  const scenario = getScenarioCatalog(extraScenarios).find((entry) => entry.id === id);
  return scenario ?? getScenarioCatalog(extraScenarios)[0];
}

export function normalizeScenarioDefinition(input) {
  const errors = [];
  const scenario = structuredClone(input ?? {});

  if (!scenario.id || typeof scenario.id !== 'string') {
    errors.push('Scenario id is required.');
  }

  if (!scenario.name || typeof scenario.name !== 'string') {
    errors.push('Scenario name is required.');
  }

  if (!scenario.worldOptions || typeof scenario.worldOptions !== 'object') {
    errors.push('worldOptions is required.');
  }

  const worldOptions = scenario.worldOptions ?? {};
  const customMap = worldOptions.mapMode === 'custom' ? worldOptions.map : null;
  if (customMap) {
    if (!Number.isInteger(customMap.width) || customMap.width <= 0) {
      errors.push('Custom map width must be a positive integer.');
    }
    if (!Number.isInteger(customMap.height) || customMap.height <= 0) {
      errors.push('Custom map height must be a positive integer.');
    }
    if (!Array.isArray(customMap.roads) || customMap.roads.length === 0) {
      errors.push('Custom map must declare at least one road cell.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    scenario: {
      id: scenario.id ?? 'scenario',
      name: scenario.name ?? 'Scenario',
      description: scenario.description ?? '',
      recommendedMode: scenario.recommendedMode ?? 'benchmark',
      worldOptions: {
        seed: worldOptions.seed ?? 20260425,
        mapId: worldOptions.mapId ?? 'bootstrap-grid',
        mapMode: worldOptions.mapMode,
        map: worldOptions.map,
        procedural: structuredClone(worldOptions.procedural ?? {}),
        routing: {
          straightWeight: 0.45,
          leftWeight: 0.25,
          rightWeight: 0.3,
          allowReverse: false,
          ...(worldOptions.routing || {})
        },
        lights: structuredClone(worldOptions.lights ?? createDefaultLights()),
        vehicles: structuredClone(worldOptions.vehicles ?? [])
      },
      sandboxVehicles: structuredClone(scenario.sandboxVehicles ?? worldOptions.vehicles ?? []),
      benchmarkDefaults: {
        durationTicks: scenario.benchmarkDefaults?.durationTicks ?? 60,
        spawnRate: scenario.benchmarkDefaults?.spawnRate ?? 0.55
      }
    }
  };
}

export function parseScenarioJson(text) {
  const parsed = JSON.parse(text);
  return normalizeScenarioDefinition(parsed);
}

export function buildWorldOptionsFromScenario(scenario, runtimeConfig) {
  const isBenchmarkMode = runtimeConfig.mode === 'benchmark';
  const normalized = normalizeScenarioDefinition(scenario).scenario;

  const lightPhaseDurationTicks = runtimeConfig.lightPhaseDurationTicks ?? 5;

  return {
    ...structuredClone(normalized.worldOptions),
    mapMode: runtimeConfig.mapMode ?? normalized.worldOptions.mapMode,
    maxVehicles: runtimeConfig.maxVehicles ?? 240,
    procedural: {
      ...(structuredClone(normalized.worldOptions.procedural ?? {})),
      ...(structuredClone(runtimeConfig.procedural ?? {}))
    },
    lightsConfig: {
      phaseDurationTicks: lightPhaseDurationTicks
    },
    lights: applyLightPhaseDuration(normalized.worldOptions.lights ?? [], lightPhaseDurationTicks),
    benchmark: {
      enabled: isBenchmarkMode,
      mode: isBenchmarkMode ? 'benchmark' : 'sandbox',
      spawnRate: isBenchmarkMode ? runtimeConfig.spawnRate : 0,
      durationTicks: isBenchmarkMode ? runtimeConfig.benchmarkDurationTicks : 0
    },
    rules: structuredClone(runtimeConfig.rules),
    vehicles: isBenchmarkMode
      ? structuredClone(normalized.worldOptions.vehicles ?? [])
      : structuredClone(normalized.sandboxVehicles ?? normalized.worldOptions.vehicles ?? [])
  };
}

export function createDefaultLights() {
  return applyLightPhaseDuration([
    {
      id: 'north-crossing',
      phaseIndex: 0,
      remainingTicks: 2,
      phases: [
        { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
      ]
    },
    {
      id: 'west-crossing',
      phaseIndex: 1,
      remainingTicks: 2,
      phases: [
        { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
      ]
    },
    {
      id: 'main-crossing',
      phaseIndex: 0,
      remainingTicks: 2,
      phases: [
        { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
      ]
    },
    {
      id: 'east-crossing',
      phaseIndex: 1,
      remainingTicks: 2,
      phases: [
        { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
      ]
    },
    {
      id: 'south-crossing',
      phaseIndex: 0,
      remainingTicks: 2,
      phases: [
        { name: 'north-south', durationTicks: 2, allowedDirections: ['north', 'south'] },
        { name: 'east-west', durationTicks: 2, allowedDirections: ['east', 'west'] }
      ]
    }
  ], 5);
}

function applyLightPhaseDuration(lights = [], phaseDurationTicks = 5) {
  const normalizedDuration = Math.max(2, Math.min(20, Math.round(phaseDurationTicks)));

  return structuredClone(lights).map((light) => ({
    ...light,
    remainingTicks: normalizedDuration,
    phases: (light.phases ?? []).map((phase) => ({
      ...phase,
      durationTicks: normalizedDuration
    }))
  }));
}

const BUILTIN_SCENARIOS = [
  {
    id: 'baseline-benchmark',
    name: 'Baseline benchmark grid',
    description: 'Main bootstrap city map with traffic lights and reproducible benchmark defaults.',
    recommendedMode: 'benchmark',
    benchmarkDefaults: {
      durationTicks: 60,
      spawnRate: 0.55
    },
    worldOptions: {
      seed: 20260425,
      mapId: 'bootstrap-grid',
      routing: {
        straightWeight: 0.45,
        leftWeight: 0.25,
        rightWeight: 0.3,
        allowReverse: false
      },
      lights: createDefaultLights(),
      vehicles: []
    },
    sandboxVehicles: [
      { id: 'sandbox-1', x: 0, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'sandbox-2', x: 10, y: 0, direction: 'south', status: 'active', spawnedAtTick: 0 },
      { id: 'sandbox-3', x: 12, y: 4, direction: 'west', status: 'active', spawnedAtTick: 0 }
    ]
  },
  {
    id: 'priority-cross',
    name: 'Priority cross tutorial',
    description: 'Small uncontrolled crossroad for stop, right-of-way, and conflict validation.',
    recommendedMode: 'sandbox',
    benchmarkDefaults: {
      durationTicks: 40,
      spawnRate: 0
    },
    worldOptions: {
      seed: 20260426,
      mapMode: 'custom',
      map: {
        id: 'priority-cross',
        width: 5,
        height: 5,
        roads: [
          { x: 2, y: 0, allowedDirections: ['south'] },
          { x: 2, y: 1, allowedDirections: ['north', 'south'] },
          { x: 2, y: 2, allowedDirections: ['north', 'south', 'east', 'west'] },
          { x: 2, y: 3, allowedDirections: ['north', 'south'] },
          { x: 2, y: 4, allowedDirections: ['north'] },
          { x: 0, y: 2, allowedDirections: ['east'] },
          { x: 1, y: 2, allowedDirections: ['east', 'west'] },
          { x: 3, y: 2, allowedDirections: ['east', 'west'] },
          { x: 4, y: 2, allowedDirections: ['west'] }
        ],
        intersections: [{ x: 2, y: 2 }],
        spawnPoints: []
      },
      lights: [],
      vehicles: []
    },
    sandboxVehicles: [
      { id: 'priority-north', x: 2, y: 0, direction: 'south', status: 'active', spawnedAtTick: 0 },
      { id: 'priority-west', x: 0, y: 2, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  },
  {
    id: 'spillback-lab',
    name: 'Spillback lab',
    description: 'Tiny lit corridor to validate do-not-block-intersection and blocked-lane behavior.',
    recommendedMode: 'sandbox',
    benchmarkDefaults: {
      durationTicks: 30,
      spawnRate: 0
    },
    worldOptions: {
      seed: 20260427,
      mapMode: 'custom',
      map: {
        id: 'spillback-lab',
        width: 6,
        height: 1,
        roads: [
          { x: 0, y: 0, allowedDirections: ['east'] },
          { x: 1, y: 0, allowedDirections: ['east'] },
          { x: 2, y: 0, allowedDirections: ['east'] },
          { x: 3, y: 0, allowedDirections: ['east'] },
          { x: 4, y: 0, allowedDirections: ['east'] },
          { x: 5, y: 0, allowedDirections: ['east'] }
        ],
        intersections: [{ x: 3, y: 0, lightId: 'lab-light' }],
        spawnPoints: []
      },
      lights: [
        {
          id: 'lab-light',
          phaseIndex: 0,
          remainingTicks: 4,
          phases: [
            { name: 'north-south', durationTicks: 4, allowedDirections: ['north', 'south'] },
            { name: 'east-west', durationTicks: 4, allowedDirections: ['east', 'west'] }
          ]
        }
      ],
      vehicles: []
    },
    sandboxVehicles: [
      { id: 'lab-front', x: 4, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 },
      { id: 'lab-back', x: 2, y: 0, direction: 'east', status: 'active', spawnedAtTick: 0 }
    ]
  }
];
