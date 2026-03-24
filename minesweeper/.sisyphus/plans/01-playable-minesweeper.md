# D1: プレイアブルマインスイーパー

> **目標**: ブラウザで遊べるマインスイーパーを完成させる。これが全プロジェクトの基盤となる。
> **完了条件**: 人間がブラウザを開いて、マインスイーパーを最初から最後まで遊べること。
> **次ドメイン**: D2（PixiJS描画）と D3（フロア進行）がこのドメイン完了後に着手可能になる。

---

## スコープ

### 含むもの（IN）
- 標準マインスイーパーの完全なゲームルール
- グリッド生成（seedベース決定性）
- セル開拓（reveal）+ 数字表示 + flood-fill（0近傍自動展開）
- フラグ設置/解除
- 勝利判定（全安全セル開拓）+ 敗北判定（地雷踏み）
- 最小React UI（グリッド表示 + 左クリックreveal + 右クリックflag）
- コアロジックのユニットテスト

### 含まないもの（OUT）
- PixiJS描画（D2）
- 5セルタイプ（D1では safe/mine の2種類のみ。wasteland/holeはD3以降）
- Detonate/侵食/暴発（D4-D6）
- マルチプレイヤー（D7-D8）
- 音響（D9）
- フロア進行（D3）

---

## このドメインでインストールする依存

```bash
# パッケージマネージャ設定
bun init

# テスト
bun add -d vitest

# フロントエンド
bun add react react-dom
bun add -d @types/react @types/react-dom @vitejs/plugin-react vite typescript

# 設定バリデーション（最小限）
bun add zod
```

> 注: Colyseus, PixiJS, Howler.js, Zustand, expr-eval は**このドメインではインストールしない**。

---

## タスク一覧

### T1-1: プロジェクト足場 + テスト基盤

**ステップ1: 依存インストール**
```bash
bun init
bun add -d vitest typescript @vitejs/plugin-react vite
bun add react react-dom
bun add -d @types/react @types/react-dom
bun add zod
```

**ステップ2: テストを先に書く**
- `src/core/__tests__/setup.test.ts` — テスト環境が動くことを確認するダミーテスト

**ステップ3: 基盤構築**
- `package.json` — scripts: `dev`, `build`, `test`, `typecheck`
- `tsconfig.json` — strict mode, JSX, path aliases
- `vite.config.ts` — React plugin, dev server設定
- `vitest.config.ts` — テスト設定
- `index.html` — Viteエントリ
- `src/main.tsx` — React root
- `src/App.tsx` — 空のAppコンポーネント

**ステップ4: 実装**
- 上記ファイルを作成

**ステップ5: テスト通過確認**
```bash
bun run test        # → PASS
bun run typecheck   # → PASS
bun run dev         # → ブラウザで空画面が表示される
```

**ステップ6: 人間目視確認**
- [x] `bun run dev` でブラウザに空のReact画面が表示される
- [x] `bun run test` でテストがPASSする

**コミット**: `feat(d1): プロジェクト足場とテスト基盤を構築`

---

### T1-2: コア型定義

**ステップ1: 依存インストール** — なし（T1-1で完了済み）

**ステップ2: テストを先に書く**
- `src/core/types/__tests__/cell.test.ts`
  - CellType の全列挙値が存在すること
  - Cell interface が必須フィールドを持つこと
- `src/core/types/__tests__/game-state.test.ts`
  - 初期GameStateが正しく生成されること
  - minesの位置が盤面内に収まること

**ステップ3: 基盤構築**
- `src/core/types/cell.ts`
  ```typescript
  // D1では2種類のみ。D3以降で拡張。
  export enum CellType {
    SAFE = 'safe',        // 開拓済み安全マス
    MINE_SAFE = 'mine_safe',    // 地雷なし（目視不可）
    MINE_DANGER = 'mine_danger', // 地雷あり（目視不可）
    // D3以降で追加: WASTELAND, HOLE
  }
  ```

- `src/core/types/player.ts`
  ```typescript
  export interface Player {
    id: string;
    name: string;
    position: { x: number; y: number }; // 連続座標（浮動小数点）
    facing: Direction;
    isAlive: boolean;
  }
  ```

- `src/core/types/game.ts`
  ```typescript
  export interface GameState {
    width: number;
    height: number;
    cells: Cell[][];       // 二次元配列
    players: Map<string, Player>;
    phase: GamePhase;
    mines: Set<string>;    // "x,y" 形式の地雷位置集合
    flags: Set<string>;    // "x,y" 形式の旗位置集合
  }
  ```

**ステップ4: 実装**
- 上記ファイルに型定義を記述

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS（型に関するテスト）
```

**ステップ6: 人間目視確認**
- [ ] 型定義がコンパイルエラーなしで通る（`bun run typecheck`）

**コミット**: `feat(d1): コア型定義（CellType, Player, GameState）`

---

### T1-3: 盤面生成ロジック

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/core/board/__tests__/generate-board.test.ts`
  - 指定サイズの盤面が生成されること
  - 指定した地雷数が正確に配置されること
  - 同じseed → 同じ盤面（決定性）
  - 異なるseed → 異なる盤面
  - 地雷が盤面外に配置されないこと
  - 初期状態ですべてのセルが mine_safe または mine_danger であること
  - 地雷数 > セル総数の場合にエラーになること

**ステップ3: 基盤構築**
- `src/core/board/seed-random.ts` — seedベース疑似乱数生成器（xorshift等）
  ```typescript
  // Math.random()を使わない。seedから決定的に乱数を生成。
  export function createSeededRandom(seed: number): () => number;
  ```

- `src/core/board/generate-board.ts`
  ```typescript
  export interface BoardConfig {
    width: number;
    height: number;
    mineCount: number;
    seed: number;
  }
  export function generateBoard(config: BoardConfig): GameState;
  ```

**ステップ4: 実装**
- seed乱数生成器を実装
- 盤面生成: 全セルを mine_safe で初期化 → seed乱数で mineCount 個を mine_danger に変更
- mines Set を構築

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] テストがPASSする

**コミット**: `feat(d1): 盤面生成ロジック（seedベース決定性）`

---

### T1-4: セル開拓（Reveal）+ Flood-Fill

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/core/board/__tests__/reveal.test.ts`
  - mine_safe セルを開拓 → safe になり、隣接地雷数が表示されること
  - mine_danger セルを開拓 → ゲームオーバー（phase が GAME_OVER になる）こと
  - safe セルを開拓 → 何も変わらないこと
  - 隣接地雷数0の mine_safe を開拓 → 周囲の mine_safe も連鎖開拓（flood-fill）されること
  - flood-fill は地雷原で停止し、安全マスだけを展開すること
  - 旗が立っているセルは開拓不可であること
  - 既に開拓済みのセルを開拓 → 何も変わらないこと
  - 盤面端でのflood-fillが境界を超えないこと

**ステップ3: 基盤構築**
- `src/core/board/reveal.ts`
  ```typescript
  export interface RevealResult {
    revealed: Array<{ x: number; y: number; adjacentMines: number }>;
    gameOver: boolean;
    hitMine: boolean;
  }
  export function revealCell(state: GameState, x: number, y: number): RevealResult;
  ```

- `src/core/board/adjacent-mines.ts`
  ```typescript
  // 8方向の隣接地雷数を計算
  export function countAdjacentMines(state: GameState, x: number, y: number): number;
  ```

**ステップ4: 実装**
- `revealCell`: 対象セルが mine_danger → GAME_OVER。mine_safe → safe に変更 + 隣接地雷数計算。隣接0ならflood-fill。
- `countAdjacentMines`: 8方向（チェビシェフ距離1）の mine_danger をカウント
- flood-fill: BFSで隣接地雷数0のsafeセルから再帰的に展開

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] テストがPASSする

**コミット**: `feat(d1): セル開拓とflood-fill実装`

---

### T1-5: フラグ設置/解除

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/core/board/__tests__/flag.test.ts`
  - 地雷原セルにフラグを設置できること
  - 安全セルにフラグを設置できないこと（rules.md: Dig/Flagは地雷原のみ）
  - フラグ済みセルに再度フラグ → 解除されること（トグル動作）
  - 開拓済みセルにフラグ → 何も変わらないこと
  - フラグ設置で開拓判定に影響しないこと（旗付きセルは開拓不可）

**ステップ3: 基盤構築**
- `src/core/board/flag.ts`
  ```typescript
  export function toggleFlag(state: GameState, x: number, y: number): boolean;
  // 戻り値: true = フラグ設置, false = フラグ解除（または無効）
  ```

**ステップ4: 実装**
- 対象が mine_safe/mine_danger の場合: flags Set に toggle
- それ以外: 何もしない

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] テストがPASSする

**コミット**: `feat(d1): フラグ設置/解除`

---

### T1-6: 勝敗判定（プロトタイプ用）

> **⚠️ この勝敗判定は標準マインスイーパー用の暫定実装です。**
> 正式仕様（全CP回収でフロアクリア）はD3で実装されます。
> D3ではこの関数を `checkWinByCheckpoints()` に置き換えます。
> テスト名・関数名に「prototype」を含めて暫定であることを明示します。

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/core/rules/__tests__/win-lose.test.ts`
  - 全地雷以外のセルが開拓済み → 勝利（phase = FLOOR_CLEAR）
  - 地雷を踏んだ → 敗北（phase = GAME_OVER）
  - 盤面途中 → PLAYING
  - 旗は開拓済みに含まれないこと（旗を立てただけでは勝利しない）
  - 1セルも開拓していない → PLAYING

**ステップ3: 基盤構築**
- `src/core/rules/win-lose.ts`
  ```typescript
  export function checkWinCondition(state: GameState): GamePhase;
  ```

**ステップ4: 実装**
- 全セル中、mine_danger以外で safe になっていないセルが0個 → FLOOR_CLEAR
- 既に GAME_OVER なら GAME_OVER のまま

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] テストがPASSする

**コミット**: `feat(d1): 勝敗判定ロジック`

---

### T1-7: 最小React UI — ゲーム画面

**ステップ1: 依存インストール** — なし（T1-1で完了済み）

**ステップ2: テストを先に書く**
- `src/ui/__tests__/GameBoard.test.tsx`
  - 盤面が正しいセル数で描画されること
  - 地雷セルが非表示（目視不可）であること
  - 開拓済みセルに数字が表示されること
  - フラグが表示されること

**ステップ3: 基盤構築**
- `src/ui/GameBoard.tsx` — CSS Gridで盤面を描画
- `src/ui/Cell.tsx` — 個別セルコンポーネント
- `src/ui/GameStatus.tsx` — ゲーム状態表示（PLAYING / WIN / LOSE）
- `src/App.tsx` — ゲーム画面を組み立て

**ステップ4: 実装**

Cellの描画ルール:
| 状態 | 表示 |
|---|---|
| `safe`（開拓済み）| 背景色: 薄いグレー、数字を表示（0は空白）|
| `mine_safe`（未開拓）| 背景色: 濃いグレー（地雷と区別不可）|
| `mine_danger`（未開拓）| 背景色: 濃いグレー（safeと区別不可）|
| フラグ付き | 背景色: 濃いグレー + 🚩 または旗アイコン |
| ゲームオーバー後の地雷 | 背景色: 赤 + 💣 |

インタラクション:
- 左クリック → `revealCell()`
- 右クリック → `toggleFlag()`

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] `bun run dev` でブラウザにマインスイーパーが表示される
- [ ] 左クリックでセルが開く
- [ ] 右クリックで旗が立つ/外れる
- [ ] 数字0のセルを開くとflood-fillが起きる
- [ ] 地雷を踏むとゲームオーバー表示
- [ ] 全安全セルを開くと勝利表示
- [ ] スクリーンショットを `.sisyphus/evidence/d1-gameplay.png` に保存

**コミット**: `feat(d1): 最小React UIでプレイアブルマインスイーパー完成`

---

### T1-8: 設定基盤（最小実装）

> D3以降の式駆動・設定駆動の受け皿として、最小限のconfig基盤をD1で作成する。

**ステップ1: 依存インストール** — なし（T1-1でzod導入済み）

**ステップ2: テストを先に書く**
- `src/config/__tests__/game-config.test.ts`
  - デフォルト設定が正しく読み込めること
  - 必須フィールドが欠けている場合にバリデーションエラーになること
  - 不正な値（負の数等）が弾かれること

**ステップ3: 基盤構築**
- `src/config/schemas/game-config.schema.ts`
  ```typescript
  import { z } from 'zod';
  // D1で必要な最小限のスキーマ:
  // - boardSize: { width: number, height: number }
  // - mineCount: number
  // - seed: number
  // D3以降で拡張: 侵食パラメータ、リスポーン時間等
  ```

- `src/config/defaults.ts`
  ```typescript
  // D1用デフォルト値
  export const DEFAULT_CONFIG = {
    board: { width: 16, height: 16 },
    mineCount: 40,
    seed: 42,
  };
  ```

- `src/config/loadConfig.ts`
  ```typescript
  import { z } from 'zod';
  // JSON + Zod バリデーション + 型付きオブジェクト返却
  // D1ではインラインデフォルトを使用。D3以降でファイル読込に拡張。
  export function loadConfig(overrides?: Partial<GameConfig>): GameConfig;
  ```

**ステップ4: 実装**
- Zodスキーマで設定値の型と範囲を定義
- `loadConfig()` はデフォルト値とマージし、Zodでバリデーション
- T1-3の `generateBoard()` をこのconfigを使用するように接続

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] テストがPASSする
- [ ] 設定値を変更して盤面サイズが変わることを確認（オプション）

**コミット**: `feat(d1): 設定基盤（Zodスキーマ + デフォルト値）`

---

## 完了チェックリスト

- [ ] `bun run test` → 全テストPASS
- [ ] `bun run typecheck` → エラーなし
- [ ] `bun run dev` → ブラウザでマインスイーパーが遊べる
- [ ] 人間が1ゲーム完整えて勝利画面を確認
- [ ] 人間が地雷を踏んで敗北画面を確認
- [ ] flood-fillが正しく動作することを確認
- [ ] フラグの設置/解除が正しく動作することを確認
- [ ] スクリーンショットが `.sisyphus/evidence/d1-gameplay.png` に保存されている

---

## D1完了後に次ドメインへ渡すもの

| 成果物 | ファイル | 次ドメインでの用途 |
|---|---|---|
| コア型 | `src/core/types/*.ts` | D2-D10の全システムが参照 |
| 盤面生成 | `src/core/board/generate-board.ts` | D2: 描画、D3: ステージロード |
| セル開拓 | `src/core/board/reveal.ts` | D4-D6: セル変換の基盤 |
| フラグ | `src/core/board/flag.ts` | D5: Detonateの旗参照 |
| 勝敗判定 | `src/core/rules/win-lose.ts` | D3: フロアクリア、D8: ゲームオーバー |
| Seed乱数 | `src/core/board/seed-random.ts` | D4-D10: 決定性のため |
| 設定基盤 | `src/config/*.ts` | D3-D10の式駆動・設定駆動の受け皿 |
| React UI | `src/ui/*.tsx` | D2: PixiJS置き換えの参考 |
| テスト基盤 | `vitest.config.ts` | 全ドメインで継続使用 |
