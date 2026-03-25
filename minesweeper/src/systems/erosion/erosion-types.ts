export interface ErosionConfig {
  interval: number;
  power: number;
  warningTime: number;
  dangerRatio: number;
  wastelandDangerRatio: number;
}

export interface WarningCell {
  x: number;
  y: number;
  warningExpiry: number;
}

export interface ErosionState {
  active: boolean;
  nextErosionTime: number;
  pendingWarnings: WarningCell[];
  erosionCount: number;
}

export const DEFAULT_EROSION_CONFIG: ErosionConfig = {
  interval: 15000,
  power: 3,
  warningTime: 3000,
  dangerRatio: 0.3,
  wastelandDangerRatio: 1.0,
};
