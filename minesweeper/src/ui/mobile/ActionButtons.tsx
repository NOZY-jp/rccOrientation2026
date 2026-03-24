interface ActionButtonsProps {
  onDig: () => void;
  onFlag: () => void;
  onDetonate: () => void;
}

export function ActionButtons({ onDig, onFlag, onDetonate }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button type="button" className="action-btn action-btn-dig" onPointerDown={onDig}>
        Dig
      </button>
      <button type="button" className="action-btn action-btn-flag" onPointerDown={onFlag}>
        Flag
      </button>
      <button type="button" className="action-btn action-btn-detonate" onPointerDown={onDetonate}>
        Detonate
      </button>
    </div>
  );
}
