import { Application as Stage } from '@pixi/react';
import type { ReactNode } from 'react';

interface PixiCanvasProps {
  width: number;
  height: number;
  children?: ReactNode;
}

export function PixiCanvas({ width, height, children }: PixiCanvasProps) {
  return (
    <Stage
      width={width}
      height={height}
      backgroundColor={0x1a1a2e}
      antialias
    >
      {children}
    </Stage>
  );
}
