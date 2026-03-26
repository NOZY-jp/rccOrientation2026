import { describe, expect, test } from 'vitest';
import { CELL_COLORS } from '../cellPalette';

describe('cellPalette extended', () => {
  test('should have wasteland, hole, and warning colors', () => {
    expect(CELL_COLORS.wasteland).toBeTypeOf('number');
    expect(CELL_COLORS.hole).toBeTypeOf('number');
    expect(CELL_COLORS.warning).toBeTypeOf('number');
    expect(CELL_COLORS.wasteland).toBe(0x92400e);
    expect(CELL_COLORS.hole).toBe(0x1c1917);
    expect(CELL_COLORS.warning).toBe(0xfbbf24);
  });
});
