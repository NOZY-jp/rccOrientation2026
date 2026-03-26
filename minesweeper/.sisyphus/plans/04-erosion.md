# D4: 侵食システム

> **目標**: 時間経過で盤面の安全領域が地雷原に侵食されるシステムを実装する。BFS前線探索による決定论的なセル変換、警告フェーズ、フラグ除去、数字再計算を構築する。
> **完了条件**: フロア開始から時間経過とともにセルが侵食され、警告アニメーションが表示され、侵食実行でセルが変換・数字が再計算されること。
>
> **⚠️ 前提条件（必須）**:
> D1（`01-playable-minesweeper.md`）、D2（`02-pixi-rendering.md`）、D3（`03-floor-progression.md`）が完了していること。
>
> | 前提ドメイン | 作成されたファイル | D4での用途 |
> |---|---|---|
> | D3 T3-1 | `src/core/types/checkpoint.ts` | CPは侵食と無関係であることを確認 |
> | D3 T3-1 | `src/core/types/cell.ts` | CellType（WASTELAND, HOLEを含む）を参照 |
> | D3 T3-1 | `src/core/types/game.ts` | GameState（checkpoints, floorNumberを含む）を参照 |
> | D3 T3-4 | `src/systems/progression/floor-state-machine.ts` | フェーズ遷移で侵食キャンセル |
> | D3 T3-4 | `src/systems/progression/floor-transition.ts` | クリア時のイベントキャンセル |
> | D3 T3-4 | `src/core/types/game.ts` | GamePhase（PLAYING中のみ侵食有効）を参照 |
> | D1 T1-4 | `src/core/board/reveal.ts` | 数字再計算の参照 |
> | D1 T1-4 | `src/core/board/adjacent-mines.ts` | 数字再計算で使用 |
> | D2 T2-2 | `src/ui/pixi/grid/GridRenderer.tsx` | セル描画の拡張（WASTELAND, HOLE, 警告色） |
> | D2 T2-2 | `src/ui/pixi/grid/cellPalette.ts` | セルパレットに侵食色を追加 |
>
> **着手前確認コマンド**:
> ```bash
> ls src/core/types/checkpoint.ts src/systems/progression/floor-state-machine.ts src/systems/progression/floor-transition.ts
> grep -c "WASTELAND" src/core/types/cell.ts
> grep -c "FLOOR_CLEAR" src/core/types/game.ts
> bun run test
> bun run typecheck
> ```

---

## スコープ

### 含むもの（IN）
- 侵食スケジューラ（式駆動のインターバル設定）
- BFS前線探索（frontline概念、決定的タイブレーク）
- 侵食警告フェーズ（frontline隣接セルの視覚警告）
- 侵食実行（セル変換、旗除去、数字再計算）
- 数字再計算（侵食フェーズ後の全隣接数字更新）
- 侵食はPLAYINGフェーズ中のみ有効（他フェーズでは停止）
- フロアクリアで保留中の侵食イベントを全キャンセル
- WASTELAND/HOLEのPixiJS描画（セルパレット拡張）
- 警告アニメーションのUI表示

### 含まないもの（OUT）
- コアロジックの破壊的変更（`src/core/board/` の既存関数シグネチャは変更しない）
- Detonateシステム（D5）
- 管理外爆発（D6）
- プレイヤー移動（D7。D4ではクリックで固定位置操作）
- Colyseus接続（D8）
- 音響（D9）
- 侵食による即死のゲームオーバー連鎖（D6で実装。D4では即死フラグを立てるのみ）
- アイテムシステムの実装（D7以降。D4では地上アイテムの概念を枠組みとして定義のみ）

---

## このドメインでインストールする依存

なし（D1/D2/D3の依存のみで完結）

---

## D3からの引き渡し（前提成果物）

| 成果物 | ファイル | D4での用途 |
|---|---|---|
| CellType（拡張） | `src/core/types/cell.ts` | WASTELAND/HOLEを侵食ターゲットとして使用 |
| GamePhase（拡張） | `src/core/types/game.ts` | PLAYING中のみ侵食有効 |
| GameState（拡張） | `src/core/types/game.ts` | 侵食スケジューラの状態管理 |
| フロア状態機械 | `src/systems/progression/floor-state-machine.ts` | フェーズ遷移で侵食キャンセル |
| フロア遷移処理 | `src/systems/progression/floor-transition.ts` | クリア時のイベントキャンセル |
| Checkpoint型 | `src/core/types/checkpoint.ts` | CPは侵食で消滅しないことを確認 |
| セルパレット | `src/ui/pixi/grid/cellPalette.ts` | 侵食色・警告色の追加 |

---

## 設計メモ

### 侵食の基本メカニクス（interview2確定分）

1. **フロンティア（frontline）**: 地雷原（MINE_SAFE/MINE_DANGER）に隣接する非地雷セル（SAFE/WASTELAND）の集合
2. **侵食対象選択**: フロンティアからBFSで侵食力の数だけセルを選択（決定的タイブレーク: 上→右上→右→...の8方向固定順序）
3. **警告フェーズ**: 選択されたセルに警告アニメーションを表示（警告時間は式駆動、ベース3秒）
4. **侵食実行**: 警告時間経過後、セルを地雷原（MINE_SAFEまたはMINE_DANGER）に変換
   - 地雷配置率は式駆動
   - WASTELANDは100%地雷原化
5. **副作用**:
   - 変換セル上のフラグ → 即除去
   - 変換セル上のアイテム → 消滅（D7以降で実装、D4では枠組み定義）
   - 変換セル上のプレイヤー → 即死フラグ（D6でゲームオーバー連鎖実装、D4ではフラグのみ）
   - 全隣接数字 → 再計算
6. **BFS深度**: 上限なし。侵食力に等しい数のセルをfrontlineから順に選択。候補不足時は次の深さへ。
7. **CPとの無関係性**: CPはセル属性であり侵食で消滅しない。侵食でセルが地雷原になってもCPはその座標に残る。

### 警告対象の決定ルール（重要）
- 警告対象 = **frontlineに隣接する非地雷セル**（SAFEまたはWASTELAND）
- 距離概念ではない。直接隣接（チェビシェフ距離1）のみ。
- Digは地雷原にのみ可能。警告対象は安全マス/荒地なので**Dig不可能**（仕様上 naturally blocked）。

### タイブレーク戦略
- BFS探索の順序: 固定8方向 `[↑, ↗, →, ↘, ↓, ↙, ←, ↖]`（上から時計回り）
- 同一深さのセルはこの順序で処理（決定的）

### 侵食設定のデフォルト値
```typescript
export const DEFAULT_EROSION_CONFIG = {
  interval: 15000,            // 15秒
  power: 3,                   // 3セル/回
  warningTime: 3000,          // 3秒
  dangerRatio: 0.3,           // 30%がMINE_DANGER
  wastelandDangerRatio: 1.0,  // WASTELANDは100%地雷原化
};
```

---

## タスク一覧

### T4-1: 侵食設定 + 侵食スケジューラ

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/systems/erosion/__tests__/erosion-config.test.ts`
  - デフォルト設定値が正しいこと（interval, power, warningTime等）
  - 設定値の境界チェック（power >= 1, warningTime > 0等）
- `src/systems/erosion/__tests__/erosion-scheduler.test.ts`
  - 初期状態では侵食がスケジュールされていないこと
  - 侵食インターバルが正しく設定されること
  - PLAYINGフェーズでのみ侵食が有効になること
  - FLOOR_CLEARフェーズに遷移すると侵食がキャンセルされること
  - GAME_OVERフェーズに遷移すると侵食がキャンセルされること

**ステップ3: 基盤構築**
- `src/systems/erosion/erosion-types.ts` — 侵食型定義（新規）
  ```typescript
  export interface ErosionConfig {
    interval: number;
    power: number;
    warningTime: number;
    dangerRatio: number;
    wastelandDangerRatio: number;
  }

  export interface ErosionState {
    active: boolean;
    nextErosionTime: number;
    pendingWarnings: Array<{
      x: number;
      y: number;
      warningExpiry: number;
    }>;
    erosionCount: number;
  }

  export const DEFAULT_EROSION_CONFIG: ErosionConfig = {
    interval: 15000,
    power: 3,
    warningTime: 3000,
    dangerRatio: 0.3,
    wastelandDangerRatio: 1.0,
  };
  ```
- `src/systems/erosion/erosion-scheduler.ts` — 侵食スケジューラ（新規）
  ```typescript
  // 侵食のタイミング管理
  // - start(): 侵食サイクルを開始
  // - update(currentTime, phase): 現在時刻とフェーズを渡して状態更新
  // - cancel(): 侵食を停止（フロアクリア時等）
  // - getWarnings(): 現在警告中のセル一覧を取得
  ```

**ステップ4: 実装**
- `ErosionConfig`: デフォルト値を定数としてエクスポート
- `erosionScheduler`:
  - `start()`: `active = true`, `nextErosionTime = currentTime + interval`
  - `update(currentTime, phase)`:
    - `phase !== PLAYING` の場合は何もしない
    - `currentTime >= nextErosionTime` の場合、侵食実行をトリガー（T4-2で実装）
    - 警告中セルの`warningExpiry`をチェックし、期限切れのものを侵食実行キューに追加
  - `cancel()`: `active = false`, `pendingWarnings`をクリア

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [x] `bun run typecheck` → エラーなし

**コミット**: `feat(d4): 侵食設定とスケジューラ基盤`

---

### T4-2: BFS前線探索 + 侵食対象選択

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/systems/erosion/__tests__/erosion-frontline.test.ts`
  - 地雷原に隣接する安全セルが正しくfrontlineとして特定されること
  - WASTELANDもfrontline候補に含まれること
  - HOLEはfrontline候補に含まれないこと
  - SAFEセル（開拓済み）がfrontline候補に含まれること
  - 隣接しないセルはfrontlineに含まれないこと
  - 侵食力の数だけセルが選択されること
  - 侵食力 > frontline候補数の場合、全候補が選択されること
  - 同一seedで常に同じ選択順序であること（決定性）
  - タイブレークが固定8方向順序であること
  - 既に警告中のセルは再選択されないこと

**ステップ3: 基盤構築**
- `src/systems/erosion/erosion-frontline.ts` — 前線探索（新規）
  ```typescript
  const DIRECTIONS_8: Array<{ dx: number; dy: number }> = [
    { dx: 0, dy: -1 },   // ↑
    { dx: 1, dy: -1 },   // ↗
    { dx: 1, dy: 0 },    // →
    { dx: 1, dy: 1 },    // ↘
    { dx: 0, dy: 1 },    // ↓
    { dx: -1, dy: 1 },   // ↙
    { dx: -1, dy: 0 },   // ←
    { dx: -1, dy: -1 },  // ↖
  ];

  export function getFrontlineCandidates(
    cells: Cell[][],
    width: number,
    height: number
  ): Array<{ x: number; y: number }>

  export function selectErosionTargets(
    cells: Cell[][],
    width: number,
    height: number,
    power: number,
    existingWarnings: Set<string>
  ): Array<{ x: number; y: number }>
  ```

**ステップ4: 実装**
- `getFrontlineCandidates`:
  - 全セルをスキャン
  - 各セルが地雷原（MINE_SAFE/MINE_DANGER）に隣接しているかチェック
  - SAFE, WASTELAND, MINE_SAFEのセルが候補（HOLEは除外）
  - 既に警告中のセルは除外
- `selectErosionTargets`:
  - 候補からBFSで`power`個を選択
  - 開始点: グリッドの左上から右下へのスキャン順（決定的）
  - 同一候補プールからは常に同じ順序で選択

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [x] `bun run typecheck` → エラーなし

**コミット**: `feat(d4): BFS前線探索と侵食対象選択`

---

### T4-3: 侵食実行（セル変換 + 副作用 + 数字再計算）

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/systems/erosion/__tests__/erosion-execution.test.ts`
  - SAFEセルがMINE_SAFEまたはMINE_DANGERに変換されること
  - WASTELANDセルが地雷原に変換されること
  - 変換セル上のフラグが除去されること
  - 変換セルのadjacentMinesが再計算されること
  - 変換セルの隣接セルの数字も再計算されること
  - HOLEセルは侵食対象に含まれないこと
  - dangerRatioに基づいてMINE_SAFE/MINE_DANGERの比率が正しいこと
  - WASTELANDは常に地雷原化すること（wastelandDangerRatio = 1.0）
  - 同一seedで常に同じ変換結果になること（決定性）
- `src/systems/erosion/__tests__/number-recalculation.test.ts`
  - 侵食後の全隣接数字が正しく再計算されること
  - 複数セルが同時に変換された場合も正しく再計算されること

**ステップ3: 基盤構築**
- `src/systems/erosion/erosion-execution.ts` — 侵食実行（新規）
  ```typescript
  export interface ErosionResult {
    converted: Array<{ x: number; y: number; oldType: CellType; newType: CellType }>;
    flagsRemoved: Array<{ x: number; y: number }>;
  }

  export function executeErosion(
    state: GameState,
    targets: Array<{ x: number; y: number }>,
    config: ErosionConfig,
    random: () => number
  ): ErosionResult
  ```
- `src/systems/erosion/number-recalculation.ts` — 数字再計算（新規）
  ```typescript
  export function recalculateNumbers(
    cells: Cell[][],
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void
  ```

**ステップ4: 実装**
- `executeErosion`:
  1. 各ターゲットセルについて現在のセル種を記録
  2. WASTELAND → 常に地雷原化（MINE_SAFE or MINE_DANGER by wastelandDangerRatio）
  3. SAFE → 地雷原化（MINE_SAFE or MINE_DANGER by dangerRatio）
  4. HOLEはスキップ
  5. `random()`でMINE_SAFE/MINE_DANGERを決定（決定的: seed-based）
  6. フラグ除去: ターゲットセル上のフラグを`state.flags`から削除
  7. 数字再計算: 各変換セルとその隣接セルの`adjacentMines`を更新
- `recalculateNumbers`:
  - `countAdjacentMines`（D1既存の`src/core/board/adjacent-mines.ts`）を再利用
  - 対象セルの8近傍すべてについてadjacentMinesを再計算

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [x] `bun run typecheck` → エラーなし

**コミット**: `feat(d4): 侵食実行（セル変換・フラグ除去・数字再計算）`

---

### T4-4: 侵食パイプライン統合（スケジューラ + 前線 + 実行）

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/systems/erosion/__tests__/erosion-pipeline.test.ts`
  - 侵食サイクルが正しく動作すること: 選択 → 警告 → 実行
  - 複数回の侵食サイクルが連続して動作すること
  - 警告時間中はセルが変換されないこと
  - 警告時間経過後にセルが変換されること
  - フェーズがPLAYING以外の場合、侵食が停止すること
  - フロアクリア時に保留中の警告がキャンセルされること
  - フロアクリア時にスケジューラがリセットされること
  - 累計侵食回数が正しくカウントされること

**ステップ3: 基盤構築**
- `src/systems/erosion/erosion-pipeline.ts` — 侵食パイプライン（新規）
  ```typescript
  export function updateErosion(
    state: GameState,
    erosionState: ErosionState,
    config: ErosionConfig,
    currentTime: number,
    phase: GamePhase,
    random: () => number
  ): { state: GameState; erosionState: ErosionState; result: ErosionResult | null }
  ```

**ステップ4: 実装**
- `updateErosion`パイプライン:
  1. フェーズチェック: `phase !== PLAYING` → 何もしない
  2. 警告期限チェック: `pendingWarnings`の期限切れを確認
  3. 期限切れ警告の侵食実行: `executeErosion()`を呼び出し、`pendingWarnings`から削除
  4. 侵食インターバルチェック: `currentTime >= nextErosionTime`
  5. 新規侵食サイクル:
     a. `selectErosionTargets()`でターゲット選択
     b. 選択されたターゲットを`pendingWarnings`に追加
     c. `nextErosionTime = currentTime + interval`
     d. `erosionCount++`

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [x] `bun run typecheck` → エラーなし

**コミット**: `feat(d4): 侵食パイプライン統合`

---

### T4-5: UI統合（WASTELAND/HOLE描画 + 警告アニメーション）

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/ui/pixi/grid/__tests__/cell-palette-extended.test.tsx`
  - WASTELANDの色が定義されていること
  - HOLEの色が定義されていること
  - 警告色が定義されていること
- `src/ui/__tests__/ErosionWarning.test.tsx`
  - 警告中のセルに警告オーバーレイが表示されること
  - 警告終了後にオーバーレイが消えること
  - WASTELANDセルが正しい色で描画されること
  - HOLEセルが正しい色で描画されること

**ステップ3: 基盤構築**
- `src/ui/pixi/grid/cellPalette.ts` — セルパレット拡張
  ```typescript
  export const CELL_COLORS = {
    // 既存:
    uncovered: 0x6b7280,
    safe:      0xd1d5db,
    flag:      0xef4444,
    gameover:  0xdc2626,
    // D4で追加:
    wasteland: 0x92400e,     // 荒地: 暗い茶色
    hole:      0x1c1917,     // 穴: ほぼ黒
    warning:   0xfbbf24,     // 侵食警告: 黄色
  } as const;
  ```
- `src/ui/pixi/grid/CellGraphics.tsx` — セル描画拡張
  ```typescript
  // CellType.WASTELAND → 暗い茶色の矩形
  // CellType.HOLE → 黒い矩形
  // 警告中フラグ → 黄色の点滅オーバーレイ
  ```
- `src/ui/pixi/grid/ErosionWarningOverlay.tsx` — 警告オーバーレイ（新規）
  ```typescript
  // pendingWarningsのリストを受け取り、各セルに点滅オーバーレイを描画
  // PixiJS Tickerで点滅アニメーション
  ```

**ステップ4: 実装**
- `cellPalette`: WASTELAND, HOLE, WARNINGの色を追加
- `CellGraphics`: WASTELAND/HOLEの描画分岐を追加。警告中フラグでオーバーレイ描画。
- `ErosionWarningOverlay`: `pendingWarnings`のリストを受け取り点滅オーバーレイを描画。警告残り時間が少ないほど点滅速度アップ。
- D2の`GridRenderer`を拡張: 侵食警告オーバーレイレイヤーを追加
- D2の`useGameActions`を拡張: 侵食パイプラインの`update`を定期的に呼び出し（`requestAnimationFrame`または`setInterval`）

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] `bun run dev` でWASTELANDセルが茶色で表示される
- [ ] `bun run dev` でHOLEセルが黒色で表示される
- [ ] 侵食警告が黄色の点滅アニメーションで表示される
- [ ] 警告時間経過後にセルが地雷原に変換される
- [ ] 変換後の数字が正しく表示される
- [ ] フロアクリア時に侵食が停止すること
- [ ] スクリーンショットを `.sisyphus/evidence/d4-wasteland-hole.png` に保存
- [ ] スクリーンショットを `.sisyphus/evidence/d4-erosion-warning.png` に保存
- [ ] スクリーンショットを `.sisyphus/evidence/d4-erosion-result.png` に保存

**コミット**: `feat(d4): WASTELAND/HOLE描画と侵食警告アニメーションUI`

---

## 完了チェックリスト

- [ ] `bun run test` → 全テストPASS（D1 + D2 + D3 + D4）
- [ ] `bun run typecheck` → エラーなし
- [ ] `bun run dev` → 侵食システムが動作するマインスイーパーが遊べる
- [ ] WASTELAND/HOLEセルが正しい色で描画される
- [ ] 侵食警告が黄色点滅で表示される
- [ ] 警告時間経過後にセルが地雷原に変換される
- [ ] 変換後の数字が正しく再計算される
- [ ] フラグが変換セル上で除去される
- [ ] フロアクリア時に侵食が停止する
- [ ] D1/D2/D3の既存機能が影響を受けていないこと
- [ ] `src/core/board/` の既存関数シグネチャが変更されていないこと
- [ ] 全スクリーンショットが `.sisyphus/evidence/d4-*.png` に保存されている

---

## D4完了後に次ドメインへ渡すもの

| 成果物 | ファイル | 次ドメインでの用途 |
|---|---|---|
| 侵食設定 | `src/systems/erosion/erosion-types.ts` | D5/D6: 式駆動設定の拡張 |
| 侵食スケジューラ | `src/systems/erosion/erosion-scheduler.ts` | D5/D6: 侵食タイミングとの連携 |
| 前線探索 | `src/systems/erosion/erosion-frontline.ts` | D6: 侵食×爆発の相互作用 |
| 侵食実行 | `src/systems/erosion/erosion-execution.ts` | D6: 即死判定、フラグ除去との連携 |
| 数字再計算 | `src/systems/erosion/number-recalculation.ts` | D5/D6: 爆発後の数字再計算にも使用 |
| 侵食パイプライン | `src/systems/erosion/erosion-pipeline.ts` | D5/D6: tick内イベント順序の統合 |
| セルパレット（拡張） | `src/ui/pixi/grid/cellPalette.ts` | D5: 爆発色、D6: 荒地化色の追加 |
| 警告オーバーレイ | `src/ui/pixi/grid/ErosionWarningOverlay.tsx` | D5/D6: 爆発警告との表示優先順位 |
