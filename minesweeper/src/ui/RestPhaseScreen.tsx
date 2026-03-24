import React, { useEffect, useState } from 'react';

interface RestPhaseScreenProps {
  nextFloorNumber: number;
  onTimeout: () => void;
}

export const RestPhaseScreen: React.FC<RestPhaseScreenProps> = ({
  nextFloorNumber,
  onTimeout,
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onTimeout]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: '#4caf50',
          fontFamily: 'monospace',
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        Next Floor: {nextFloorNumber}
      </div>
      <div
        style={{
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '24px',
        }}
      >
        Starting in {countdown}...
      </div>
    </div>
  );
};
