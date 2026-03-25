import { GamePhase } from '../../core/types/game.ts';
import type { ErosionConfig, ErosionState, WarningCell } from './erosion-types.ts';

export function createErosionState(currentTime: number, config: ErosionConfig): ErosionState {
  return {
    active: true,
    nextErosionTime: currentTime + config.interval,
    pendingWarnings: [],
    erosionCount: 0,
  };
}

export function startErosion(currentTime: number, config: ErosionConfig): ErosionState {
  return createErosionState(currentTime, config);
}

export function updateErosionScheduler(
  state: ErosionState,
  currentTime: number,
  phase: GamePhase,
  config: ErosionConfig,
): { state: ErosionState; warningsToExecute: WarningCell[] } {
  if (phase !== GamePhase.PLAYING) {
    return {
      state,
      warningsToExecute: [],
    };
  }

  const warningsToExecute = state.pendingWarnings.filter((warning) => currentTime >= warning.warningExpiry);
  const pendingWarnings = state.pendingWarnings.filter((warning) => currentTime < warning.warningExpiry);

  let nextErosionTime = state.nextErosionTime;
  let erosionCount = state.erosionCount;
  if (currentTime >= state.nextErosionTime && pendingWarnings.length === 0) {
    nextErosionTime += config.interval;
    erosionCount += 1;
  }

  return {
    state: {
      ...state,
      pendingWarnings,
      nextErosionTime,
      erosionCount,
    },
    warningsToExecute,
  };
}

export function cancelErosion(state: ErosionState): ErosionState {
  return {
    ...state,
    active: false,
    pendingWarnings: [],
  };
}

export function addWarnings(
  state: ErosionState,
  targets: Array<{ x: number; y: number }>,
  currentTime: number,
  warningTime: number,
): ErosionState {
  const existing = new Set(state.pendingWarnings.map((warning) => `${warning.x},${warning.y}`));
  const warningExpiry = currentTime + warningTime;

  const additions: WarningCell[] = [];
  for (const target of targets) {
    const key = `${target.x},${target.y}`;
    if (existing.has(key)) {
      continue;
    }
    existing.add(key);
    additions.push({
      x: target.x,
      y: target.y,
      warningExpiry,
    });
  }

  return {
    ...state,
    pendingWarnings: [...state.pendingWarnings, ...additions],
  };
}

export function isWarningActive(state: ErosionState, x: number, y: number): boolean {
  return state.pendingWarnings.some((warning) => warning.x === x && warning.y === y);
}
