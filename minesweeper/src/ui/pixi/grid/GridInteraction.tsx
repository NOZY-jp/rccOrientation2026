import type { GameState } from '../../../core/types/game';
import { GridRenderer } from './GridRenderer';

interface GridInteractionProps {
  state: GameState;
  cursorPosition?: { x: number; y: number } | null;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
}

export function GridInteraction({ state, cursorPosition = null, onReveal, onFlag }: GridInteractionProps) {
  return (
    <GridRenderer state={state} cursorPosition={cursorPosition} onReveal={onReveal} onFlag={onFlag} />
  );
}
