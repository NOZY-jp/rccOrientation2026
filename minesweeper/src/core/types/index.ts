/**
 * セルタイプ定義（rules.md §2.1）
 */
export type CellType =
  | 'safe_cell'    // 掘削済み。周囲地雷数表示
  | 'mine_safe'    // 地雷なし（未掘削）
  | 'mine_danger'  // 地雷あり（未掘削）
  | 'wasteland'    // 荒地（減速）
  | 'hole';        // 穴（通行不可）

/**
 * セル状態
 */
export interface Cell {
  type: CellType;
  /** 周囲の地雷数（safe_cellの場合のみ有効） */
  adjacentMines: number;
  /** フラグが立っているか */
  isFlagged: boolean;
}

/**
 * プレイヤー状態（連続座標 + AABB）（rules.md §2.2）
 */
export interface Player {
  id: string;
  /** X座標（連続） */
  x: number;
  /** Y座標（連続） */
  y: number;
  /** 当たり判定の幅 */
  width: number;
  /** 当たり判定の高さ */
  height: number;
  /** 生存状態 */
  isAlive: boolean;
}

/**
 * 8方向（45度刻み）（Dig/Flagで使用）
 */
export type Direction8 =
  | 'n'  // 北
  | 'ne' // 北東
  | 'e'  // 東
  | 'se' // 南東
  | 's'  // 南
  | 'sw' // 南西
  | 'w'  // 西
  | 'nw'; // 北西

/**
 * 4方向（90度刻み）（地雷除去機で使用）
 */
export type Direction4 = 'n' | 'e' | 's' | 'w';

/**
 * 汎用方向型
 */
export type Direction = Direction8 | Direction4;

/**
 * ゲーム状態（最小限のスタブ）
 */
export interface GameState {
  /** 盤面（2次元配列） */
  board: Cell[][];
  /** プレイヤーリスト */
  players: Player[];
  /** 現在のフロア番号 */
  currentFloor: number;
  /** ゲーム終了フラグ */
  isGameOver: boolean;
}
