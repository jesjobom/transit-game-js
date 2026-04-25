import { finalizeBenchmark } from './benchmark.js';
import {
  canTravelDirection,
  getAvailableDirections,
  getCell,
  getIntersection,
  getLaneKey,
  getNextPosition,
  isInsideMap,
  reverseDirection,
  toPositionKey,
  turnLeft,
  turnRight
} from './map.js';
import { addWorldEvent, createVehicleColor, nextRandomFloat, syncWorldRngState } from './world.js';

export function createEngine(world) {
  return {
    status: 'ready',
    world,
    tick() {
      world.status = 'running';
      world.tick += 1;
      world.metrics.ticksSimulated += 1;
      world.events = [];

      advanceTrafficLights(world);
      moveVehicles(world);
      maybeSpawnVehicle(world);

      if (shouldFinalizeBenchmark(world)) {
        world.report = finalizeBenchmark(world);
        world.status = 'completed';
        addWorldEvent(world, 'benchmarkCompleted', { score: world.report.score.total });
      }

      syncWorldRngState(world);
      return world.tick;
    },
    runTicks(totalTicks) {
      for (let index = 0; index < totalTicks; index += 1) {
        if (world.status === 'completed') {
          break;
        }

        this.tick();
      }

      return world.tick;
    },
    getReport() {
      if (!world.report) {
        world.report = finalizeBenchmark(world);
      }

      return world.report;
    }
  };
}

function shouldFinalizeBenchmark(world) {
  const { benchmark } = world.config;
  return benchmark.enabled && benchmark.durationTicks > 0 && world.tick >= benchmark.durationTicks;
}

function maybeSpawnVehicle(world) {
  const { benchmark, maxVehicles } = world.config;
  const vehicles = world.entities.vehicles;
  const spawnPoints = world.map.spawnPoints;

  if (!benchmark.enabled || benchmark.spawnRate <= 0 || spawnPoints.length === 0) {
    return;
  }

  if (vehicles.length >= maxVehicles) {
    return;
  }

  if (nextRandomFloat(world) > benchmark.spawnRate) {
    return;
  }

  const selectedSpawn = spawnPoints[Math.floor(nextRandomFloat(world) * spawnPoints.length)] ?? spawnPoints[0];

  if (!canTravelDirection(world.map, selectedSpawn.x, selectedSpawn.y, selectedSpawn.direction)) {
    addWorldEvent(world, 'vehicleSpawnRejected', { spawnPointId: selectedSpawn.id, reason: 'invalid-direction' });
    return;
  }

  const spawnBlockReason = getOccupancyBlockReason(world, selectedSpawn.x, selectedSpawn.y, selectedSpawn.direction);
  if (spawnBlockReason) {
    world.metrics.blockedMoves += 1;
    addWorldEvent(world, 'vehicleSpawnBlocked', {
      spawnPointId: selectedSpawn.id,
      reason: spawnBlockReason.reason,
      blockingVehicleId: spawnBlockReason.blockingVehicleId,
      laneKey: getLaneKey(selectedSpawn.direction)
    });
    return;
  }

  const vehicle = {
    id: `vehicle-${world.metrics.spawnedVehicles + 1}`,
    spawnedAtTick: world.tick,
    x: selectedSpawn.x,
    y: selectedSpawn.y,
    direction: selectedSpawn.direction,
    status: 'active',
    color: createVehicleColor(world, `spawn-${world.metrics.spawnedVehicles + 1}`)
  };

  vehicles.push(vehicle);
  world.metrics.spawnedVehicles += 1;
  addWorldEvent(world, 'vehicleSpawned', {
    vehicleId: vehicle.id,
    x: vehicle.x,
    y: vehicle.y,
    direction: vehicle.direction,
    spawnPointId: selectedSpawn.id,
    laneKey: getLaneKey(vehicle.direction)
  });
}

function moveVehicles(world) {
  const survivors = [];

  for (const vehicle of world.entities.vehicles) {
    maybeChooseVehicleDirection(world, vehicle);

    const nextPosition = getNextPosition(vehicle, vehicle.direction);

    if (!isInsideMap(world.map, nextPosition.x, nextPosition.y) || !getCell(world.map, nextPosition.x, nextPosition.y)) {
      world.metrics.completedTrips += 1;
      world.metrics.completedTripTicks += world.tick - vehicle.spawnedAtTick;
      addWorldEvent(world, 'vehicleExited', {
        vehicleId: vehicle.id,
        x: vehicle.x,
        y: vehicle.y,
        direction: vehicle.direction,
        laneKey: getLaneKey(vehicle.direction)
      });
      continue;
    }

    const block = getVehicleBlock(world, vehicle, nextPosition);
    if (block) {
      world.metrics.blockedMoves += 1;
      addWorldEvent(world, 'vehicleBlocked', {
        vehicleId: vehicle.id,
        x: vehicle.x,
        y: vehicle.y,
        nextX: nextPosition.x,
        nextY: nextPosition.y,
        laneKey: getLaneKey(vehicle.direction),
        reason: block.reason,
        blockingVehicleId: block.blockingVehicleId,
        blockedByLightId: block.blockedByLightId,
        blockedByPhase: block.blockedByPhase
      });
      survivors.push(vehicle);
      continue;
    }

    vehicle.x = nextPosition.x;
    vehicle.y = nextPosition.y;
    world.metrics.movedVehicles += 1;
    addWorldEvent(world, 'vehicleMoved', {
      vehicleId: vehicle.id,
      x: vehicle.x,
      y: vehicle.y,
      direction: vehicle.direction,
      laneKey: getLaneKey(vehicle.direction)
    });
    survivors.push(vehicle);
  }

  world.entities.vehicles = survivors;
}

function maybeChooseVehicleDirection(world, vehicle) {
  if (!getIntersection(world.map, vehicle.x, vehicle.y)) {
    return;
  }

  const choices = getRouteChoices(world, vehicle);
  if (choices.length <= 1) {
    return;
  }

  const currentDirection = vehicle.direction;
  const selectedDirection = chooseWeightedDirection(world, choices, currentDirection);

  if (selectedDirection === currentDirection) {
    return;
  }

  vehicle.direction = selectedDirection;
  world.metrics.turnsTaken += 1;
  addWorldEvent(world, 'vehicleTurned', {
    vehicleId: vehicle.id,
    from: currentDirection,
    to: selectedDirection,
    x: vehicle.x,
    y: vehicle.y
  });
}

function getRouteChoices(world, vehicle) {
  const availableDirections = getAvailableDirections(world.map, vehicle.x, vehicle.y);
  const reverse = reverseDirection(vehicle.direction);
  const filtered = availableDirections.filter((direction) => {
    if (direction === reverse && !world.config.routing.allowReverse) {
      return false;
    }

    return true;
  });

  return filtered.length > 0 ? filtered : [vehicle.direction];
}

function chooseWeightedDirection(world, choices, currentDirection) {
  const weightedChoices = choices.map((direction) => ({
    direction,
    weight: getDirectionWeight(world, currentDirection, direction)
  }));

  const totalWeight = weightedChoices.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return currentDirection;
  }

  let cursor = nextRandomFloat(world) * totalWeight;

  for (const entry of weightedChoices) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.direction;
    }
  }

  return weightedChoices.at(-1)?.direction ?? currentDirection;
}

function getDirectionWeight(world, currentDirection, candidateDirection) {
  if (candidateDirection === currentDirection) {
    return world.config.routing.straightWeight;
  }

  if (candidateDirection === turnLeft(currentDirection)) {
    return world.config.routing.leftWeight;
  }

  if (candidateDirection === turnRight(currentDirection)) {
    return world.config.routing.rightWeight;
  }

  return world.config.routing.allowReverse ? 0.1 : 0;
}

function getVehicleBlock(world, vehicle, nextPosition) {
  if (!canTravelDirection(world.map, nextPosition.x, nextPosition.y, vehicle.direction)) {
    return { reason: 'invalid-direction' };
  }

  const occupancyBlock = getOccupancyBlockReason(world, nextPosition.x, nextPosition.y, vehicle.direction, vehicle.id);
  if (occupancyBlock) {
    return occupancyBlock;
  }

  const controlledIntersection = world.map.intersections.find(
    (intersection) => intersection.x === nextPosition.x && intersection.y === nextPosition.y && intersection.lightId
  );

  if (!controlledIntersection) {
    return null;
  }

  const light = world.entities.lights.find((entry) => entry.id === controlledIntersection.lightId);

  if (!light || !Array.isArray(light.phases) || light.phases.length === 0) {
    return null;
  }

  const phase = light.phases[light.phaseIndex ?? 0];

  if (!phase?.allowedDirections) {
    return null;
  }

  if (phase.allowedDirections.includes(vehicle.direction)) {
    return null;
  }

  return {
    reason: 'red-light',
    blockedByLightId: light.id,
    blockedByPhase: phase.name ?? 'unknown'
  };
}

function getOccupancyBlockReason(world, x, y, direction, ignoredVehicleId = null) {
  const occupancyKey = getOccupancyKey(world, x, y, direction);
  const blockingVehicle = world.entities.vehicles.find((vehicle) => {
    if (ignoredVehicleId && vehicle.id === ignoredVehicleId) {
      return false;
    }

    return getOccupancyKey(world, vehicle.x, vehicle.y, vehicle.direction) === occupancyKey;
  });

  if (!blockingVehicle) {
    return null;
  }

  return {
    reason: getIntersection(world.map, x, y) ? 'intersection-occupied' : 'lane-occupied',
    blockingVehicleId: blockingVehicle.id
  };
}

function getOccupancyKey(world, x, y, direction) {
  if (getIntersection(world.map, x, y)) {
    return `intersection:${toPositionKey(x, y)}`;
  }

  return `lane:${toPositionKey(x, y)}:${getLaneKey(direction)}`;
}

function advanceTrafficLights(world) {
  for (const light of world.entities.lights) {
    if (!Array.isArray(light.phases) || light.phases.length === 0) {
      continue;
    }

    if (typeof light.phaseIndex !== 'number') {
      light.phaseIndex = 0;
    }

    if (typeof light.remainingTicks !== 'number' || light.remainingTicks <= 0) {
      light.remainingTicks = light.phases[light.phaseIndex].durationTicks;
    }

    light.remainingTicks -= 1;

    if (light.remainingTicks > 0) {
      continue;
    }

    light.phaseIndex = (light.phaseIndex + 1) % light.phases.length;
    light.remainingTicks = light.phases[light.phaseIndex].durationTicks;

    addWorldEvent(world, 'lightChanged', {
      lightId: light.id,
      phaseIndex: light.phaseIndex,
      phaseName: light.phases[light.phaseIndex].name
    });
  }
}
