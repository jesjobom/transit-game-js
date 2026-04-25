import { addWorldEvent, nextRandomFloat, syncWorldRngState } from './world.js';

export function createEngine(world) {
  return {
    status: 'ready',
    world,
    tick() {
      world.status = 'running';
      world.tick += 1;
      world.metrics.ticksSimulated += 1;
      world.events = [];

      maybeSpawnVehicle(world);
      advanceTrafficLights(world);

      syncWorldRngState(world);
      return world.tick;
    },
    runTicks(totalTicks) {
      for (let index = 0; index < totalTicks; index += 1) {
        this.tick();
      }

      return world.tick;
    }
  };
}

function maybeSpawnVehicle(world) {
  const { benchmark, maxVehicles } = world.config;
  const vehicles = world.entities.vehicles;

  if (!benchmark.enabled || benchmark.spawnRate <= 0) {
    return;
  }

  if (vehicles.length >= maxVehicles) {
    return;
  }

  if (nextRandomFloat(world) > benchmark.spawnRate) {
    return;
  }

  const vehicle = {
    id: `vehicle-${world.metrics.spawnedVehicles + 1}`,
    spawnedAtTick: world.tick,
    lane: 'entry'
  };

  vehicles.push(vehicle);
  world.metrics.spawnedVehicles += 1;
  addWorldEvent(world, 'vehicleSpawned', { vehicleId: vehicle.id });
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
