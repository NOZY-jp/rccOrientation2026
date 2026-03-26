import { useCallback, useEffect, useRef, useState } from 'react';
import { generateBoard } from '../../../core/board/generate-board';
import { toggleFlag } from '../../../core/board/flag';
import { revealCell } from '../../../core/board/reveal';
import { createSeededRandom } from '../../../core/board/seed-random';
import { checkWinCondition } from '../../../core/rules/win-lose';
import { GamePhase, type BoardConfig, type GameState } from '../../../core/types/game';
import { detectCheckpoints, collectCheckpoints } from '../../../systems/checkpoint/checkpoint-service';
import { updateErosion } from '../../../systems/erosion/erosion-pipeline';
import { createErosionState } from '../../../systems/erosion/erosion-scheduler';
import { DEFAULT_EROSION_CONFIG, type ErosionConfig, type ErosionState } from '../../../systems/erosion/erosion-types';
import { transitionPhase } from '../../../systems/progression/floor-state-machine';
import { executeFloorClear, generateNextFloor } from '../../../systems/progression/floor-transition';

interface UseGameActionsReturn {
  state: GameState;
  erosionState: ErosionState;
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
  const [erosionConfig] = useState<ErosionConfig>(DEFAULT_EROSION_CONFIG);
  const [erosionState, setErosionState] = useState<ErosionState>(() => createErosionState(performance.now(), erosionConfig));

  const stateRef = useRef(state);
  const erosionStateRef = useRef(erosionState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    erosionStateRef.current = erosionState;
  }, [erosionState]);

  useEffect(() => {
    let animationFrameId: number;
    const random = createSeededRandom(config.seed);

    const tick = (currentTime: number) => {
      if (stateRef.current.phase === GamePhase.PLAYING) {
        const { state: nextState, erosionState: nextErosionState } = updateErosion(
          stateRef.current,
          erosionStateRef.current,
          erosionConfig,
          currentTime,
          stateRef.current.phase,
          random
        );

        if (nextState !== stateRef.current) {
          setState(nextState);
          stateRef.current = nextState;
        }
        if (nextErosionState !== erosionStateRef.current) {
          setErosionState(nextErosionState);
          erosionStateRef.current = nextErosionState;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [erosionConfig, config.seed]);

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
      setErosionState(createErosionState(performance.now(), erosionConfig));
    },
    [config, erosionConfig]
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
      setErosionState(createErosionState(performance.now(), erosionConfig));
    }
  }, [state, config, erosionConfig]);

  return {
    state,
    erosionState,
    handleReveal,
    handleFlag,
    handleNewGame,
    handleRestPhase,
    handleNextFloor,
    flagCount: state.flags.size,
    mineCount: config.mineCount,
  };
}
