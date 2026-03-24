import { describe, expect, it } from 'vitest';
import { CellType } from '../index.ts';

describe('CellType拡張', () => {
  it('WASTELANDとHOLEを参照した場合、期待した文字列値になること', () => {
    expect(CellType.WASTELAND).toBe('wasteland');
    expect(CellType.HOLE).toBe('hole');
  });
});
