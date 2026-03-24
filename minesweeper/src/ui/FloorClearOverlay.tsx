import React, { useEffect } from 'react';

interface FloorClearOverlayProps {
  floorNumber: number;
  onNext: () => void;
}

export const FloorClearOverlay: React.FC<FloorClearOverlayProps> = ({
  floorNumber,
  onNext,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '32px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          animation: 'pulse 1s infinite alternate',
        }}
      >
        Floor {floorNumber} Clear!
      </div>
    </div>
  );
};
