import { describe, expect, it } from 'vitest';
import { GamePhase } from '../index.ts';

describe('GamePhase拡張', () => {
  it('RESTが存在する場合、文字列値がRESTであること', () => {
    expect(GamePhase.REST).toBe('REST');
  });

  it('NEXT_FLOORが存在する場合、文字列値がNEXT_FLOORであること', () => {
    expect(GamePhase.NEXT_FLOOR).toBe('NEXT_FLOOR');
  });

  it('VICTORYが存在する場合、文字列値がVICTORYであること', () => {
    expect(GamePhase.VICTORY).toBe('VICTORY');
  });
});
