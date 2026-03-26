import type { GameState } from '../../../core/types/game';
import type { WarningCell } from '../../../systems/erosion/erosion-types';
import { GridRenderer } from './GridRenderer';

interface GridInteractionProps {
  state: GameState;
  cursorPosition?: { x: number; y: number } | null;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  pendingWarnings?: WarningCell[];
}

export function GridInteraction({ state, cursorPosition = null, onReveal, onFlag, pendingWarnings = [] }: GridInteractionProps) {
  return (
    <GridRenderer state={state} cursorPosition={cursorPosition} onReveal={onReveal} onFlag={onFlag} pendingWarnings={pendingWarnings} />
  );
}
