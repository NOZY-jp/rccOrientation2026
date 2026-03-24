import { describe, expect, it } from 'vitest';
import {
  CellType,
  type CellType as CellTypeType,
} from '../src/core/types/index.ts';

describe('プロジェクト基盤セットアップ', () => {
  it('型定義がインポート可能であること', () => {
    const cellType: CellTypeType = CellType.SAFE;

    expect(cellType).toBe('safe');
  });
});
