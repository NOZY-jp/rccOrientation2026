import React from 'react';

interface FloorIndicatorProps {
  floorNumber: number;
  totalCheckpoints: number;
  collectedCheckpoints: number;
}

export const FloorIndicator: React.FC<FloorIndicatorProps> = ({
  floorNumber,
  totalCheckpoints,
  collectedCheckpoints,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '18px',
        width: 'max-content',
        minWidth: '288px',
        margin: '0 auto',
      }}
    >
      <span>Floor {floorNumber} / 10</span>
      <span>|</span>
      <span>
        CP: {collectedCheckpoints} / {totalCheckpoints}
      </span>
    </div>
  );
};
