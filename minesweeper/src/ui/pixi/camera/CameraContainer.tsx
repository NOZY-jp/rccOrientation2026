import { extend } from '@pixi/react';
import { Container } from 'pixi.js';
import type { ReactNode } from 'react';
import type { CameraState } from './useCamera';

extend({ Container });

interface CameraContainerProps {
  camera: CameraState;
  children: ReactNode;
}

export function CameraContainer({ camera, children }: CameraContainerProps) {
  return (
    <pixiContainer
      position={{ x: camera.x, y: camera.y }}
      scale={camera.zoom}
    >
      {children}
    </pixiContainer>
  );
}
