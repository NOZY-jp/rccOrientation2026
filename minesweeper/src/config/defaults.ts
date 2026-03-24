export const DEFAULT_CONFIG = {
  board: { width: 16, height: 16 },
  mineCount: 40,
  seed: 42,
} as const;

export type GameConfigDefaults = typeof DEFAULT_CONFIG;
