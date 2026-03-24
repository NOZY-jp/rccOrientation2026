import { useCallback, useState } from 'react';
import { generateBoard } from '../../../core/board/generate-board';
import { toggleFlag } from '../../../core/board/flag';
import { revealCell } from '../../../core/board/reveal';
import { checkWinCondition } from '../../../core/rules/win-lose';
import { GamePhase, type BoardConfig, type GameState } from '../../../core/types/game';
import { detectCheckpoints, collectCheckpoints } from '../../../systems/checkpoint/checkpoint-service';
import { transitionPhase } from '../../../systems/progression/floor-state-machine';
import { executeFloorClear, generateNextFloor } from '../../../systems/progression/floor-transition';

interface UseGameActionsReturn {
  state: GameState;
  handleReveal: (x: number, y: number) => void;
  handleFlag: (x: number, y: number) => void;
  handleNewGame: (config?: Partial<BoardConfig>) => void;
  handleRestPhase: () => void;
  handleNextFloor: () => void;
  flagCount: number;
  mineCount: number;
}

export function useGameActions(initialConfig: BoardConfig): UseGameActionsReturn {
  const [config, setConfig] = useState(initialConfig);
  const [state, setState] = useState(() => generateBoard(initialConfig));

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
        if (cloned.checkpoints) {
          const playerId = 'player1';
          detectCheckpoints(x + 0.5, y + 0.5, cloned.checkpoints, playerId, { detectionRadius: 2.5 });
          const { allCollected } = collectCheckpoints(x, y, cloned.checkpoints);

          if (allCollected) {
            const floorConfig = { floorClearDuration: 2000, restDuration: 3000, totalFloors: 10 };
            cloned.phase = transitionPhase(cloned, 'cp_all_collected', floorConfig);
            if (cloned.phase === GamePhase.FLOOR_CLEAR) {
              executeFloorClear(cloned);
            }
          } else {
            cloned.phase = checkWinCondition(cloned);
          }
        } else {
          cloned.phase = checkWinCondition(cloned);
        }
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
      setConfig(newConfig);
      setState(generateBoard(newConfig));
    },
    [config]
  );

  const handleRestPhase = useCallback(() => {
    if (state.phase === GamePhase.FLOOR_CLEAR) {
      const cloned = structuredClone(state);
      cloned.phase = GamePhase.REST;
      setState(cloned);
    }
  }, [state]);

  const handleNextFloor = useCallback(() => {
    if (state.phase === GamePhase.REST) {
      const nextState = generateNextFloor(state, config);
      nextState.phase = GamePhase.PLAYING;
      setState(nextState);
    }
  }, [state, config]);

  return {
    state,
    handleReveal,
    handleFlag,
    handleNewGame,
    handleRestPhase,
    handleNextFloor,
    flagCount: state.flags.size,
    mineCount: config.mineCount,
  };
}
