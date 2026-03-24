import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { loadConfig } from '../load-config.ts';
import { GameConfigSchema } from '../schemas/game-config.schema.ts';

describe('GameConfigSchema / loadConfig', () => {
  it('デフォルト設定が正しく読み込めること', () => {
    const config = loadConfig();

    expect(config).toEqual({
      width: 16,
      height: 16,
      mineCount: 40,
      seed: 42,
    });
  });

  it('オーバーライド値がデフォルトとマージされること', () => {
    const config = loadConfig({
      board: { width: 20 },
      mineCount: 50,
      seed: 777,
    });

    expect(config).toEqual({
      width: 20,
      height: 16,
      mineCount: 50,
      seed: 777,
    });
  });

  it('負の値が与えられた場合にバリデーションエラーになること', () => {
    expect(() => loadConfig({ mineCount: -1 })).toThrowError(z.ZodError);
    expect(() => loadConfig({ board: { width: -5 } })).toThrowError(z.ZodError);
  });

  it('mineCountがセル総数以上の場合にバリデーションエラーになること', () => {
    expect(() =>
      loadConfig({
        board: { width: 4, height: 4 },
        mineCount: 16,
      }),
    ).toThrowError(z.ZodError);
  });

  it('必須フィールド欠如時にバリデーションエラーになること', () => {
    expect(() =>
      GameConfigSchema.parse({
        board: { width: 16, height: 16 },
        mineCount: 40,
      }),
    ).toThrowError(z.ZodError);

    expect(() =>
      GameConfigSchema.parse({
        mineCount: 40,
        seed: 42,
      }),
    ).toThrowError(z.ZodError);
  });
});
