import type { BoardConfig } from '../core/types/index.ts';
import { DEFAULT_CONFIG } from './defaults.ts';
import { type GameConfig, GameConfigSchema } from './schemas/game-config.schema.ts';

type GameConfigOverrides = Partial<{
  board: Partial<GameConfig['board']>;
  mineCount: number;
  seed: number;
}>;

function mergeConfig(overrides?: GameConfigOverrides): GameConfig {
  const merged = {
    board: {
      ...DEFAULT_CONFIG.board,
      ...overrides?.board,
    },
    mineCount: overrides?.mineCount ?? DEFAULT_CONFIG.mineCount,
    seed: overrides?.seed ?? DEFAULT_CONFIG.seed,
  };

  return GameConfigSchema.parse(merged);
}

export function loadConfig(overrides?: GameConfigOverrides): BoardConfig {
  const parsed = mergeConfig(overrides);

  return {
    width: parsed.board.width,
    height: parsed.board.height,
    mineCount: parsed.mineCount,
    seed: parsed.seed,
  };
}
