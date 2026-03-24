import type { GameState } from '../../core/types/index.ts';
import { GamePhase } from '../../core/types/index.ts';

export interface FloorTransitionConfig {
  floorClearDuration: number;
  restDuration: number;
  totalFloors: number;
}

export function transitionPhase(
  state: GameState,
  trigger: 'cp_all_collected' | 'all_dead' | 'timer_expired',
  config: FloorTransitionConfig
): GamePhase {
  switch (trigger) {
    case 'cp_all_collected': {
      const floorNumber = state.floorNumber ?? 1;
      if (floorNumber >= config.totalFloors) {
        return GamePhase.VICTORY;
      }
      return GamePhase.FLOOR_CLEAR;
    }
    case 'all_dead':
      return GamePhase.GAME_OVER;
    case 'timer_expired':
      return GamePhase.NEXT_FLOOR;
  }
}
