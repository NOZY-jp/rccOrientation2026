import { useTick } from '@pixi/react';
import type { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';
import type { WarningCell } from '../../../systems/erosion/erosion-types';
import { CELL_COLORS } from './cellPalette';
import { GRID_PADDING } from '../constants';

interface ErosionWarningOverlayProps {
  pendingWarnings: WarningCell[];
  cellSize: number;
}

export function ErosionWarningOverlay({ pendingWarnings, cellSize }: ErosionWarningOverlayProps) {
  const graphicsRef = useRef<Graphics>(null);

  const drawWarnings = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      if (pendingWarnings.length === 0) return;

      graphics.setFillStyle({ color: CELL_COLORS.warning });
      for (const warning of pendingWarnings) {
        const px = warning.x * cellSize + GRID_PADDING;
        const py = warning.y * cellSize + GRID_PADDING;
        graphics.rect(px, py, cellSize, cellSize);
      }
      graphics.fill();
    },
    [pendingWarnings, cellSize]
  );

  useTick(() => {
    if (graphicsRef.current) {
      // 0.3 to 1.0 sine wave animation
      // sin wave goes from -1 to 1.
      // (sin(t) + 1) / 2 goes from 0 to 1
      // mapped to 0.3 to 1.0 -> 0.3 + 0.7 * ((sin(t) + 1) / 2)
      // which is 0.3 + 0.35 * (sin(t) + 1) = 0.65 + 0.35 * sin(t)
      const time = Date.now() / 200;
      graphicsRef.current.alpha = 0.65 + 0.35 * Math.sin(time);
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={drawWarnings} />;
}
