import type { GameState } from '../../core/types/game.ts';
import { GamePhase } from '../../core/types/game.ts';
import { executeErosion, type ErosionResult } from './erosion-execution.ts';
import { selectErosionTargets } from './erosion-frontline.ts';
import { recalculateNumbers } from './number-recalculation.ts';
import {
  addWarnings,
  cancelErosion,
  updateErosionScheduler,
} from './erosion-scheduler.ts';
import type { ErosionConfig, ErosionState } from './erosion-types.ts';

export interface ErosionPipelineResult {
  state: GameState;
  erosionState: ErosionState;
  result: ErosionResult | null;
}

function warningKey(x: number, y: number): string {
  return `${x},${y}`;
}

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    cells: state.cells.map((row) => row.map((cell) => ({ ...cell }))),
    players: new Map(state.players),
    mines: new Set(state.mines),
    flags: new Set(state.flags),
  };
}

export function updateErosion(
  state: GameState,
  erosionState: ErosionState,
  config: ErosionConfig,
  currentTime: number,
  phase: GamePhase,
  random: () => number,
): ErosionPipelineResult {
  // Given: フロアクリア遷移中
  // Then: 保留警告をキャンセルして侵食を停止する
  if (phase === GamePhase.FLOOR_CLEAR) {
    return {
      state,
      erosionState: cancelErosion(erosionState),
      result: null,
    };
  }

  // Given: PLAYING以外のフェーズ
  // Then: 侵食パイプラインを進めない
  if (phase !== GamePhase.PLAYING) {
    return {
      state,
      erosionState,
      result: null,
    };
  }

  const schedulerResult = updateErosionScheduler(erosionState, currentTime, phase, config);
  let nextState = state;
  let executionResult: ErosionResult | null = null;

  // When: 警告期限切れセルがある
  // Then: 実侵食と数字再計算を実行する
  if (schedulerResult.warningsToExecute.length > 0) {
    nextState = cloneGameState(state);
    executionResult = executeErosion(nextState, schedulerResult.warningsToExecute, config, random);

    for (const converted of executionResult.converted) {
      recalculateNumbers(nextState.cells, converted.x, converted.y, nextState.width, nextState.height);
    }
  }

  let nextErosionState = schedulerResult.state;

  // When: スケジューラが次サイクルへ進んだ
  // Then: 新しい警告対象を選んで追加する
  if (nextErosionState.erosionCount > erosionState.erosionCount) {
    const excludeWarnings = new Set(
      nextErosionState.pendingWarnings.map((warning) => warningKey(warning.x, warning.y)),
    );
    const targets = selectErosionTargets(
      nextState.cells,
      nextState.width,
      nextState.height,
      config.power,
      excludeWarnings,
    );

    nextErosionState = addWarnings(nextErosionState, targets, currentTime, config.warningTime);
  }

  return {
    state: nextState,
    erosionState: nextErosionState,
    result: executionResult,
  };
}
