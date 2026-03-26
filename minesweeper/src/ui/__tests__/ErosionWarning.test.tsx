import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CellType } from '../../core/types/cell';
import { ErosionWarningOverlay } from '../pixi/grid/ErosionWarningOverlay';
import { CellGraphics } from '../pixi/grid/CellGraphics';

vi.mock('@pixi/react', () => {
  return {
    useTick: vi.fn((cb: () => void) => {
      cb();
    }),
  };
});

describe('Erosion Warning & Extended Cell Types UI', () => {
  it('ErosionWarningOverlay mounts without pendingWarnings', () => {
    const { container } = render(<ErosionWarningOverlay pendingWarnings={[]} cellSize={40} />);
    const graphics = container.querySelector('pixiGraphics');
    expect(graphics).not.toBeNull();
  });

  it('ErosionWarningOverlay mounts with pendingWarnings', () => {
    const warnings = [
      { x: 0, y: 0, warningExpiry: 1000 },
      { x: 2, y: 3, warningExpiry: 1000 }
    ];
    const { container } = render(<ErosionWarningOverlay pendingWarnings={warnings} cellSize={40} />);
    const graphics = container.querySelector('pixiGraphics');
    expect(graphics).not.toBeNull();
  });

  it('WASTELAND cell draws without errors', () => {
    const { container } = render(
      <CellGraphics
        x={0}
        y={0}
        cellType={CellType.WASTELAND}
        adjacentMines={0}
        isFlagged={false}
        isGameOver={false}
        cellSize={40}
      />
    );
    const graphics = container.querySelector('pixiGraphics');
    expect(graphics).not.toBeNull();
  });

  it('HOLE cell draws without errors', () => {
    const { container } = render(
      <CellGraphics
        x={0}
        y={0}
        cellType={CellType.HOLE}
        adjacentMines={0}
        isFlagged={false}
        isGameOver={false}
        cellSize={40}
      />
    );
    const graphics = container.querySelector('pixiGraphics');
    expect(graphics).not.toBeNull();
  });
});
