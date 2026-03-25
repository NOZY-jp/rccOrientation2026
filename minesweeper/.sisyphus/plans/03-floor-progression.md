# D3: フロア進行システム

> **目標**: チェックポイント（CP）配置・検知・回収システムとフロア状態機械を導入し、D1の仮勝利条件を「全CP回収でフロアクリア」に置き換える。
> **完了条件**: CP付きマインスイーパーが遊べること。全CP回収でフロアクリア演出が表示され、休憩フェーズ後に次フロアに遷移すること。10フロアクリアでVictory表示。
>
> **⚠️ 前提条件（必須）**:
> D2（`02-pixi-rendering.md`）が完了していること。
> D1コアロジック（`src/core/`）の関数シグネチャは変更しない（拡張のみ許可）。

---

## スコープ

### 含むもの（IN）
- CellType拡張（WASTELAND, HOLE）
- Checkpoint型定義
- GameState拡張（checkpoints, floorNumber）
- CP配置ロジック（候補マスからseed決定論シャッフル）
- CP検知（Euclidean距離ベース、detectedBy Set）
- CP回収（セル座標一致）
- フロア状態機械（PLAYING → FLOOR_CLEAR → REST → NEXT_FLOOR → VICTORY）
- 勝利条件の置き換え（全CP回収 = フロアクリア、後方互換維持）
- UI統合（FloorIndicator, FloorClearOverlay, RestPhaseScreen, PixiJS CPマーカー）

### 含まないもの（OUT）
- コアロジックの既存関数シグネチャ変更
- Colyseus接続（D8）
- 連続移動プレイヤー（D7）— CP検知はD3では`handleReveal`経由、D7でプレイヤー接近トリガーに変更予定
- 音響（D9）
- 侵食/Detonate/暴発の演出（D4-D6）

---

## TODOs

### T3-1: CellType拡張 + GameState拡張
- [x] CellTypeに `WASTELAND='wasteland'`, `HOLE='hole'` を追加
- [x] `src/core/types/checkpoint.ts` に `Checkpoint` インターフェース作成（id, x, y, collected, detectedBy: Set<string>）
- [x] GameStateに `checkpoints?`, `floorNumber?`, `collectedCheckpoints?` をoptional追加
- [x] `src/core/types/index.ts` にcheckpoint re-export追加
- [x] テスト: `cell-extended.test.ts`（3件）, `game-extended.test.ts`（2件）

### T3-2: チェックポイント配置 + 盤面生成統合
- [x] `src/core/board/place-checkpoints.ts` 作成（Fisher-Yates shuffle with seed、HOLEスキップ）
- [x] BoardConfigに `checkPointCandidates?: boolean[][]`, `spawnPositions?` をoptional追加
- [x] `generateBoard` を拡張（candidates指定時のみCP配置、後方互換）
- [x] テスト: `checkpoint-placement.test.ts`（3件）, `generate-board-extended.test.ts`（4件）

### T3-3: チェックポイント検知 + 回収
- [x] `src/systems/checkpoint/checkpoint-service.ts` 作成
  - `detectCheckpoints(playerX, playerY, checkpoints, playerId, { detectionRadius })` — Euclidean dist² ≤ R²、cell center基準
  - `collectCheckpoints(playerX, playerY, checkpoints)` — Math.floor座標一致
- [x] テスト: `checkpoint-detection.test.ts`（5件）, `checkpoint-collection.test.ts`（5件）

### T3-4: フロア状態機械
- [x] GamePhaseに `REST`, `NEXT_FLOOR`, `VICTORY` を追加
- [x] `src/systems/progression/floor-state-machine.ts` 作成 — `transitionPhase(state, trigger, config)` 純粋関数
- [x] `src/systems/progression/floor-transition.ts` 作成
  - `executeFloorClear(state)` — mines→SAFE, revive players, clear flags
  - `generateNextFloor(state, config)` — new seed, floorNumber++
- [x] テスト: `game-phase-extended.test.ts`（3件）, `floor-state-machine.test.ts`（7件）

### T3-5: 勝利条件の置き換え
- [x] `checkWinCondition` を拡張 — CP存在時は全CP回収判定、未定義/空時は従来条件へフォールバック
- [x] floorNumber >= totalFloors で VICTORY、それ以外で FLOOR_CLEAR
- [x] D1既存テスト（`win-lose.test.ts`）を無変更で通過
- [x] テスト: `win-lose-updated.test.ts`（6件）

### T3-6: UI統合
- [x] `src/ui/FloorIndicator.tsx` — "Floor X / 10 | CP: Y / Z" 表示
- [x] `src/ui/FloorClearOverlay.tsx` — "Floor X Clear!" オーバーレイ、2s auto-transition
- [x] `src/ui/RestPhaseScreen.tsx` — "Next Floor: X" + 3s countdown、auto-transition
- [x] `src/ui/pixi/grid/GridRenderer.tsx` 拡張 — CPマーカー（オレンジ=検知済み、緑=回収済み）
- [x] `src/ui/pixi/grid/useGameActions.ts` 拡張 — handleRestPhase, handleNextFloor, CP検知/回収
- [x] `src/ui/GameStatus.tsx` 拡張 — REST, NEXT_FLOOR, VICTORY フェーズ表示
- [x] `src/App.tsx` 拡張 — DEFAULT_CONFIGに9 CPs、FloorIndicator/overlays/RestPhaseScreen配線
- [x] テスト: `FloorIndicator.test.tsx`（2件）, `FloorTransition.test.tsx`（4件）

---

## 完了チェックリスト

### 自動検証
- [x] `bun run test` → 116 tests PASS
- [x] `bun run typecheck` → clean
- [x] `bun run dev` → CP付きマインスイーパーが遊べる

### 機能確認
- [x] CPが検知範囲に入ると表示される
- [x] CPに乗ると回収される
- [x] 全CP回収でフロアクリア演出が表示される
- [x] 休憩フェーズ後に次フロアに遷移する
- [x] 10フロアクリアでVictory表示
- [x] D1の従来モード（CPなし）も動作する

### コード品質
- [x] `src/core/` のD1既存関数のシグネチャが変更されていないこと（拡張のみ）
- [x] `as any` / `@ts-ignore` / `console.log` の残存なし

### エビデンス
- [x] `.sisyphus/evidence/d3-cp-detection.png` — FloorIndicator + CPマーカー
- [x] `.sisyphus/evidence/d3-floor-clear.png` — "Floor 1 Clear!" オーバーレイ
- [x] `.sisyphus/evidence/d3-rest-phase.png` — 休憩画面 + カウントダウン

---

## コミット履歴

| コミット | メッセージ |
|---|---|
| feea2a9 | feat(d3): CellType拡張（WASTELAND, HOLE）+ GameState拡張（checkpoints, floorNumber） |
| 4d41aa7 | feat(d3): チェックポイント配置と盤面生成統合 |
| 43953f8 | feat(d3): チェックポイント検知と回収ロジック |
| f86e97a | feat(d3): フロア状態機械（PLAYING→FLOOR_CLEAR→REST→NEXT_FLOOR） |
| 45cdb87 | feat(d3): 勝利条件を全CP回収に置き換え（後方互換維持） |
| 6145d4c | feat(d3): CP表示・フロア遷移演出・休憩画面UI |

---

## D7向け CP可視化仕様メモ

> **⚠️ これはD7実装時の仕様。D3の現状実装とは異なる。**

- CP検知トリガー: 連続移動プレイヤー（D7追加）の接近。掘るかどうかは無関係
- フェード遷移: 検出範囲（detectionRadius）を中間値として ±0.5マスでopacity変化
  - `R=3` の場合: 距離 3.5 で出現開始（opacity=0）→ 距離 2.5 以下で完全不透明（opacity=1.0）
  - 離れたら逆にフェードアウトして非表示
- 現在の `detectCheckpoints` はON/OFF閾値判定のみ。D7ではリアルタイム距離ベースopacity計算に変更が必要
