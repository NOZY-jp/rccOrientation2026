import { describe, it, expect } from 'vitest';

describe('プロジェクト基盤セットアップ', () => {
  it('型定義がインポート可能であること', () => {
    const cellType: import('../src/core/types/index.ts').CellType = 'safe_cell';
    expect(cellType).toBe('safe_cell');
  });
});
