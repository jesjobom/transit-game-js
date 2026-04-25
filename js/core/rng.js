const DEFAULT_SEED = 123456789;
const MODULUS = 0x100000000;
const MULTIPLIER = 1664525;
const INCREMENT = 1013904223;

export function normalizeSeed(seed = DEFAULT_SEED) {
  const numericSeed = Number(seed);

  if (!Number.isFinite(numericSeed)) {
    return DEFAULT_SEED;
  }

  return (numericSeed >>> 0) || DEFAULT_SEED;
}

export function createSeededRng(seed = DEFAULT_SEED) {
  let state = normalizeSeed(seed);

  return {
    nextInt() {
      state = (Math.imul(state, MULTIPLIER) + INCREMENT) >>> 0;
      return state;
    },
    nextFloat() {
      return this.nextInt() / MODULUS;
    },
    getState() {
      return state >>> 0;
    },
    setState(nextState) {
      state = normalizeSeed(nextState);
    }
  };
}
