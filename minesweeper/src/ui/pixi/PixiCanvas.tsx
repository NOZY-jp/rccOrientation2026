import { Application as Stage, extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import type { ReactNode } from 'react';

extend({ Graphics, Text });

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
