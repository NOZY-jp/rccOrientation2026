import { useCallback, useState } from 'react';
import { generateBoard } from '../../../core/board/generate-board';
import { toggleFlag } from '../../../core/board/flag';
import { revealCell } from '../../../core/board/reveal';
import { checkWinCondition } from '../../../core/rules/win-lose';
import { GamePhase, type BoardConfig, type GameState } from '../../../core/types/game';

interface UseGameActionsReturn {
  state: GameState;
  handleReveal: (x: number, y: number) => void;
  handleFlag: (x: number, y: number) => void;
  handleNewGame: (config?: Partial<BoardConfig>) => void;
  flagCount: number;
  mineCount: number;
}

export function useGameActions(initialConfig: BoardConfig): UseGameActionsReturn {
  const [config] = useState(initialConfig);
  const [state, setState] = useState(() => generateBoard(config));

  const handleReveal = useCallback(
    (x: number, y: number) => {
      if (state.phase !== GamePhase.PLAYING) {
        return;
      }

      const cloned = structuredClone(state);
      const result = revealCell(cloned, x, y);

      if (result.hitMine) {
        cloned.phase = GamePhase.GAME_OVER;
      } else {
        cloned.phase = checkWinCondition(cloned);
      }

      setState(cloned);
    },
    [state]
  );

  const handleFlag = useCallback(
    (x: number, y: number) => {
      if (state.phase !== GamePhase.PLAYING) {
        return;
      }

      const cloned = structuredClone(state);
      toggleFlag(cloned, x, y);
      setState(cloned);
    },
    [state]
  );

  const handleNewGame = useCallback(
    (overrideConfig?: Partial<BoardConfig>) => {
      const newConfig = { ...config, ...overrideConfig, seed: Date.now() };
      setState(generateBoard(newConfig));
    },
    [config]
  );

  return {
    state,
    handleReveal,
    handleFlag,
    handleNewGame,
    flagCount: state.flags.size,
    mineCount: config.mineCount,
  };
}
