import { GamePhase } from '../../core/types/game.ts';
import type { ErosionState, ErosionWarning } from './erosion-types.ts';

export interface ErosionSchedulerUpdateResult {
  state: ErosionState;
  shouldTrigger: boolean;
}

export function createErosionState(): ErosionState {
  return {
    active: false,
    nextErosionTime: 0,
    pendingWarnings: [],
    erosionCount: 0,
  };
}

export function startErosion(state: ErosionState, currentTime: number, interval: number): ErosionState {
  return {
    ...state,
    active: true,
    nextErosionTime: currentTime + interval,
  };
}

export function updateErosionScheduler(
  state: ErosionState,
  currentTime: number,
  phase: GamePhase,
  interval: number
): ErosionSchedulerUpdateResult {
  if (phase !== GamePhase.PLAYING) {
    return { state, shouldTrigger: false };
  }

  if (!state.active || currentTime < state.nextErosionTime) {
    return { state, shouldTrigger: false };
  }

  return {
    state: {
      ...state,
      nextErosionTime: state.nextErosionTime + interval,
      erosionCount: state.erosionCount + 1,
    },
    shouldTrigger: true,
  };
}

export function cancelErosion(state: ErosionState): ErosionState {
  return {
    ...state,
    active: false,
    pendingWarnings: [],
  };
}

export function getWarnings(state: ErosionState, currentTime: number): ErosionWarning[] {
  return state.pendingWarnings.filter((warning) => warning.warningExpiry > currentTime);
}
