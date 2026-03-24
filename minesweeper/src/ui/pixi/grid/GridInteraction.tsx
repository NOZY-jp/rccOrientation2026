import type { GameState } from '../../../core/types/game';
import { GridRenderer } from './GridRenderer';

interface GridInteractionProps {
  state: GameState;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
}

export function GridInteraction({ state, onReveal, onFlag }: GridInteractionProps) {
  return <GridRenderer state={state} onReveal={onReveal} onFlag={onFlag} />;
}
