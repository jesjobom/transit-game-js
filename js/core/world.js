export function createWorldState() {
  return {
    version: 'next-sprint-0',
    tick: 0,
    seed: null,
    mapId: null,
    vehicles: [],
    lights: [],
    metrics: {
      completedTrips: 0,
      collisions: 0,
      deadlocks: 0
    }
  };
}
