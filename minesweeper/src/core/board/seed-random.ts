export function createSeededRandom(seed: number): () => number {
  let state = (seed | 0) || 0x6d2b79f5;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 0x100000000;
  };
}
