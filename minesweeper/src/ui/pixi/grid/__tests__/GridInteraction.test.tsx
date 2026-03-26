import '@testing-library/jest-dom';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toggleFlag } from '../../../../core/board/flag';
import { generateBoard } from '../../../../core/board/generate-board';
import { revealCell } from '../../../../core/board/reveal';
import { checkWinCondition } from '../../../../core/rules/win-lose';
import { CellType } from '../../../../core/types/cell';
import { GamePhase, type BoardConfig, type GameState } from '../../../../core/types/game';
import { GridInteraction } from '../GridInteraction';
import { useGameActions } from '../useGameActions';

vi.mock('@pixi/react', () => {
  return {
    pixiGraphics: ({ children, draw, ...props }: React.ComponentProps<'div'> & { draw?: any }) => {
      return (
        <div data-testid="mock-pixi-graphics" {...props}>
          {children}
        </div>
      );
    },
    pixiText: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div data-testid="mock-pixi-text" {...props}>
        {children}
      </div>
    ),
    useTick: vi.fn(),
  };
});

vi.mock('../../../../core/board/generate-board', () => ({
  generateBoard: vi.fn(),
}));

vi.mock('../../../../core/board/reveal', () => ({
  revealCell: vi.fn(),
}));

vi.mock('../../../../core/board/flag', () => ({
  toggleFlag: vi.fn(),
}));

vi.mock('../../../../core/rules/win-lose', () => ({
  checkWinCondition: vi.fn(),
}));

const mockGenerateBoard = vi.mocked(generateBoard);
const mockRevealCell = vi.mocked(revealCell);
const mockToggleFlag = vi.mocked(toggleFlag);
const mockCheckWinCondition = vi.mocked(checkWinCondition);

const defaultConfig: BoardConfig = {
  width: 2,
  height: 2,
  mineCount: 1,
  seed: 123,
};

function createState(phase: GamePhase = GamePhase.PLAYING): GameState {
  return {
    width: 2,
    height: 2,
    phase,
    players: new Map(),
    mines: new Set(['1,1']),
    flags: new Set(),
    cells: [
      [
        { type: CellType.MINE_SAFE, adjacentMines: 0 },
        { type: CellType.MINE_SAFE, adjacentMines: 0 },
      ],
      [
        { type: CellType.MINE_SAFE, adjacentMines: 0 },
        { type: CellType.MINE_DANGER, adjacentMines: 0 },
      ],
    ],
  };
}

describe('Grid interaction and game actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckWinCondition.mockReturnValue(GamePhase.PLAYING);
    mockGenerateBoard.mockImplementation(() => createState());
    mockRevealCell.mockImplementation((state, x, y) => {
      const row = state.cells[y];
      const cell = row?.[x];
      if (cell !== undefined) {
        cell.type = CellType.SAFE;
        cell.adjacentMines = 1;
      }

      return {
        revealed: [{ x, y, adjacentMines: 1 }],
        gameOver: false,
        hitMine: false,
      };
    });
    mockToggleFlag.mockImplementation((state, x, y) => {
      state.flags.add(`${x},${y}`);
      return true;
    });
  });

  it('renders initial state and counters from useGameActions', () => {
    const { result } = renderHook(() => useGameActions(defaultConfig));

    expect(mockGenerateBoard).toHaveBeenCalledWith(defaultConfig);
    expect(result.current.state.width).toBe(2);
    expect(result.current.state.height).toBe(2);
    expect(result.current.flagCount).toBe(0);
    expect(result.current.mineCount).toBe(defaultConfig.mineCount);
  });

  it('left click triggers reveal handler in GridInteraction', () => {
    const onReveal = vi.fn();
    const onFlag = vi.fn();
    const state = createState();
    const { container } = render(<GridInteraction state={state} onReveal={onReveal} onFlag={onFlag} />);

    const firstGraphics = container.querySelector('pixiGraphics');
    expect(firstGraphics).not.toBeNull();

    fireEvent.pointerDown(firstGraphics as Element, { button: 0 });

    expect(onReveal).toHaveBeenCalledWith(0, 0);
    expect(onFlag).not.toHaveBeenCalled();
  });

  it('right click triggers flag handler in GridInteraction', () => {
    const onReveal = vi.fn();
    const onFlag = vi.fn();
    const state = createState();
    const { container } = render(<GridInteraction state={state} onReveal={onReveal} onFlag={onFlag} />);

    const firstGraphics = container.querySelector('pixiGraphics');
    expect(firstGraphics).not.toBeNull();

    fireEvent.pointerDown(firstGraphics as Element, { button: 2 });

    expect(onFlag).toHaveBeenCalledWith(0, 0);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('handleReveal calls revealCell and updates state', () => {
    const { result } = renderHook(() => useGameActions(defaultConfig));

    act(() => {
      result.current.handleReveal(1, 0);
    });

    expect(mockRevealCell).toHaveBeenCalledTimes(1);
    expect(mockRevealCell.mock.calls[0]?.[0]).not.toBe(mockGenerateBoard.mock.results[0]?.value);
    expect(mockRevealCell).toHaveBeenCalledWith(expect.any(Object), 1, 0);
    expect(result.current.state.cells[0]?.[1]?.type).toBe(CellType.SAFE);
    expect(mockCheckWinCondition).toHaveBeenCalledTimes(1);
  });

  it('handleFlag calls toggleFlag and updates state', () => {
    const { result } = renderHook(() => useGameActions(defaultConfig));

    act(() => {
      result.current.handleFlag(0, 1);
    });

    expect(mockToggleFlag).toHaveBeenCalledTimes(1);
    expect(mockToggleFlag).toHaveBeenCalledWith(expect.any(Object), 0, 1);
    expect(result.current.state.flags.has('0,1')).toBe(true);
    expect(result.current.flagCount).toBe(1);
  });

  it('prevents further reveals after game over', () => {
    mockRevealCell.mockImplementation(() => ({ revealed: [], gameOver: true, hitMine: true }));
    const { result } = renderHook(() => useGameActions(defaultConfig));

    act(() => {
      result.current.handleReveal(1, 1);
    });

    expect(result.current.state.phase).toBe(GamePhase.GAME_OVER);
    expect(mockRevealCell).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleReveal(0, 0);
    });

    expect(mockRevealCell).toHaveBeenCalledTimes(1);
  });
});
