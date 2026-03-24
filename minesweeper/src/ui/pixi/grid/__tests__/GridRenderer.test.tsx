import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CellType } from '../../../../core/types/cell';
import { GamePhase, type GameState } from '../../../../core/types/game';
import { NUMBER_COLORS } from '../cellPalette';
import { GridRenderer } from '../GridRenderer';

vi.mock('@pixi/react', () => {
  return {
    pixiGraphics: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div data-testid="mock-pixi-graphics" {...props}>
        {children}
      </div>
    ),
    pixiText: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div data-testid="mock-pixi-text" {...props}>
        {children}
      </div>
    ),
  };
});

const createState = (): GameState => ({
  width: 3,
  height: 2,
  phase: GamePhase.PLAYING,
  players: new Map(),
  mines: new Set(['1,1']),
  flags: new Set(['0,0']),
  cells: [
    [
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
      { type: CellType.SAFE, adjacentMines: 1 },
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
    ],
    [
      { type: CellType.SAFE, adjacentMines: 2 },
      { type: CellType.MINE_DANGER, adjacentMines: 0 },
      { type: CellType.SAFE, adjacentMines: 1 },
    ],
  ],
});

describe('GridRenderer', () => {
  it('renders one graphics cell per board coordinate', () => {
    const state = createState();
    const { container } = render(<GridRenderer state={state} />);

    const graphicsNodes = container.querySelectorAll('pixiGraphics');
    expect(graphicsNodes).toHaveLength(state.width * state.height);
  });

  it('uses expected number palette values', () => {
    expect(NUMBER_COLORS[1]).toBe(0x3b82f6);
    expect(NUMBER_COLORS[2]).toBe(0x22c55e);
    expect(NUMBER_COLORS[3]).toBe(0xef4444);
    expect(NUMBER_COLORS[4]).toBe(0x7c3aed);
    expect(NUMBER_COLORS[5]).toBe(0x991b1b);
    expect(NUMBER_COLORS[6]).toBe(0x0891b2);
    expect(NUMBER_COLORS[7]).toBe(0x1f2937);
    expect(NUMBER_COLORS[8]).toBe(0x6b7280);
  });

  it('shows a flag marker on flagged cells', () => {
    const state = createState();
    const { container } = render(<GridRenderer state={state} />);

    const textNodes = Array.from(container.querySelectorAll('pixiText')) as Array<HTMLElement & { text?: string }>;
    const hasFlag = textNodes.some((node) => node.getAttribute('text') === '🚩' || node.text === '🚩');
    expect(hasFlag).toBe(true);
  });
});
