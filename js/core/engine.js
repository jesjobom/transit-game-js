export function createEngineShell(world) {
  return {
    status: 'placeholder ready',
    world,
    tick() {
      world.tick += 1;
      return world.tick;
    }
  };
}
