import { describe, expect, it } from 'vitest';
import { GamePhase } from '../../../core/types/game.ts';
import {
  createErosionState,
  startErosion,
  updateErosionScheduler,
} from '../erosion-scheduler.ts';

describe('updateErosionScheduler', () => {
  it('PLAYING 以外のフェーズでは、状態を変更せず shouldTrigger=false を返すこと', () => {
    const started = startErosion(createErosionState(), 1000, 5000);

    const result = updateErosionScheduler(started, 7000, GamePhase.REST, 5000);

    expect(result.shouldTrigger).toBe(false);
    expect(result.state).toEqual(started);
  });

  it('active=false の場合、shouldTrigger=false かつ状態不変であること', () => {
    const state = createErosionState();

    const result = updateErosionScheduler(state, 100000, GamePhase.PLAYING, 5000);

    expect(result.shouldTrigger).toBe(false);
    expect(result.state).toEqual(state);
  });

  it('次回侵食時刻に到達していない場合、shouldTrigger=false であること', () => {
    const started = startErosion(createErosionState(), 1000, 5000);

    const result = updateErosionScheduler(started, 5999, GamePhase.PLAYING, 5000);

    expect(result.shouldTrigger).toBe(false);
    expect(result.state).toEqual(started);
  });

  it('次回侵食時刻に到達した場合、shouldTrigger=true かつ次回時刻更新と侵食回数加算が行われること', () => {
    const started = startErosion(createErosionState(), 1000, 5000);

    const result = updateErosionScheduler(started, 6000, GamePhase.PLAYING, 5000);

    expect(result.shouldTrigger).toBe(true);
    expect(result.state.active).toBe(true);
    expect(result.state.nextErosionTime).toBe(11000);
    expect(result.state.erosionCount).toBe(1);
  });

  it('時刻超過が大きい場合でも1回分のみトリガーし、1 interval 分だけ進めること', () => {
    const started = startErosion(createErosionState(), 1000, 5000);

    const result = updateErosionScheduler(started, 20000, GamePhase.PLAYING, 5000);

    expect(result.shouldTrigger).toBe(true);
    expect(result.state.nextErosionTime).toBe(11000);
    expect(result.state.erosionCount).toBe(1);
  });
});
