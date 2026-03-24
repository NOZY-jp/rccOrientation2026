import { Application as Stage, extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useEffect, useRef, type ReactNode } from 'react';

extend({ Graphics, Text });

interface PixiCanvasProps {
  width: number;
  height: number;
  children?: ReactNode;
  preventContextMenu?: boolean;
}

export function PixiCanvas({ width, height, children, preventContextMenu = false }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!preventContextMenu) {
      return;
    }

    const node = containerRef.current;
    if (node === null) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    node.addEventListener('contextmenu', handleContextMenu);

    return () => {
      node.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [preventContextMenu]);

  return (
    <div ref={containerRef}>
      <Stage
        width={width}
        height={height}
        backgroundColor={0x1a1a2e}
        antialias
      >
        {children}
      </Stage>
    </div>
  );
}
