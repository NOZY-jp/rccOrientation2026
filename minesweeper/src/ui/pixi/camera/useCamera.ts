import { useCallback, useState } from 'react';
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, PAN_SPEED, ZOOM_SPEED } from './camera.constants';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface UseCameraReturn {
  camera: CameraState;
  handleWheel: (deltaY: number) => void;
  handlePanStart: () => void;
  handlePanMove: (deltaX: number, deltaY: number) => void;
  handlePanEnd: () => void;
  resetCamera: (boardWidth: number, boardHeight: number, canvasWidth: number, canvasHeight: number) => void;
}

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function useCamera(initialX = 0, initialY = 0): UseCameraReturn {
  const [camera, setCamera] = useState<CameraState>({ x: initialX, y: initialY, zoom: DEFAULT_ZOOM });
  const [isPanning, setIsPanning] = useState(false);

  const handleWheel = useCallback((deltaY: number) => {
    setCamera((prev) => {
      const direction = deltaY > 0 ? -1 : 1;
      const newZoom = clampZoom(prev.zoom + direction * ZOOM_SPEED);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handlePanStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const handlePanMove = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!isPanning) {
        return;
      }

      setCamera((prev) => ({
        ...prev,
        x: prev.x + deltaX * PAN_SPEED,
        y: prev.y + deltaY * PAN_SPEED,
      }));
    },
    [isPanning]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetCamera = useCallback((boardWidth: number, boardHeight: number, canvasWidth: number, canvasHeight: number) => {
    const zoom = DEFAULT_ZOOM;
    const x = (canvasWidth - boardWidth * zoom) / 2;
    const y = (canvasHeight - boardHeight * zoom) / 2;
    setCamera({ x, y, zoom });
  }, []);

  return { camera, handleWheel, handlePanStart, handlePanMove, handlePanEnd, resetCamera };
}
