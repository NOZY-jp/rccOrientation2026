export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  detectedBy: Set<string>;
}
