# D2: PixiJS描画アップグレード

> **目標**: D1のCSS Grid UIをPixiJSに置き換え、カメラ操作とモバイル/PC入力を統合する。コアロジックは一切変更しない。
> **完了条件**: PixiJSで描画されたマインスイーパーが、カメラ操作・モバイルジョイスティック・PCキーボードで操作できること。
>
> **⚠️ 前提条件（必須）**:
> D1（`01-playable-minesweeper.md`）が完了していること。
> 以下のファイルがD1のタスクによって作成されている必要があります。
> これらのファイルが存在しない場合、**このドメインは着手できません。**
>
> | D1タスク | 作成されるファイル | D2での用途 |
> |---|---|---|
> | T1-2 | `src/core/types/cell.ts` | セルタイプに応じた描画分岐 |
> | T1-2 | `src/core/types/player.ts` | プレイヤー型定義 |
> | T1-2 | `src/core/types/game.ts` | GameState から盤面状態を読み取り |
> | T1-3 | `src/core/board/seed-random.ts` | 盤面生成のseed乱数 |
> | T1-3 | `src/core/board/generate-board.ts` | PixiJSグリッド生成のデータソース |
> | T1-4 | `src/core/board/reveal.ts` | 左クリック/ボタン入力で呼び出し |
> | T1-4 | `src/core/board/adjacent-mines.ts` | 数字表示の計算 |
> | T1-5 | `src/core/board/flag.ts` | 右クリック/ボタン入力で呼び出し |
> | T1-6 | `src/core/rules/win-lose.ts` | ゲーム状態表示に反映 |
> | T1-7 | `src/ui/GameBoard.tsx` | デバッグモードとして残す（オプション）|
>
> **着手前確認コマンド**:
> ```bash
> bun run test        # D1の全テストがPASSすること
> bun run typecheck   # エラーがないこと
> ls src/core/types/cell.ts src/core/board/generate-board.ts  # ファイルが存在すること
> ```

---

## スコープ

### 含むもの（IN）
- PixiJS + @pixi/react の統合
- セルタイプ別グリッド描画（色・形で視覚的に区別）
- 数字表示（開拓済みセルの隣接地雷数）
- フラグ表示
- カメラ/ビューポート（ズーム・パン）
- モバイル仮想ジョイスティック + 行動ボタン
- PCキーボード入力（J=掘る / K=旗 / Space=点火 / 矢印キー=カーソル移動）
  > **⚠️ D2ではWASD（移動）は未実装。D7で連続移動として実装される。**
  > D2では「カーソル位置」をUI内部状態として持ち、J/Kキーの対象セルを指定するのみ。
  > カーソル移動は矢印キー（↑↓←→）のみ対応。WASDは一切使用しない。
  > このカーソルは**D7の連続移動システムと完全に独立したUI専用一時機能**であり、
  > D7実装時に破棄される。公開インターフェースは`ActionIntent`（dig/flag/detonate）のみ。
- 入力の正規化（PC/スマホ共通インターフェース）
- D1のCSS Grid UIをデバッグモードとして残すオプション

### 含まないもの（OUT）
- コアロジックの変更（`src/core/` は一切触らない）
- Colyseus接続（D8）
- プレイヤー移動の連続座標（D7で実装。D2ではセルクリック操作のみ）
- 音響（D9）
- 侵食/Detonate/暴発の演出（D4-D6）

---

## このドメインでインストールする依存

```bash
# PixiJS
bun add pixi.js @pixi/react

# モバイルジョイスティック
bun add nipplejs
bun add -d @types/nipplejs
```

> 注: React, Vite, TypeScript, vitest, zod はD1で導入済み。Colyseus, Zustand, Howler.js はまだインストールしない。

---

## D1からの引き渡し（前提成果物）

| 成果物 | ファイル | D2での用途 |
|---|---|---|
| コア型 | `src/core/types/cell.ts` | セルタイプに応じた描画分岐 |
| コア型 | `src/core/types/game.ts` | GameState から盤面状態を読み取り |
| 盤面生成 | `src/core/board/generate-board.ts` | PixiJSグリッド生成のデータソース |
| セル開拓 | `src/core/board/reveal.ts` | 左クリック/ボタン入力で呼び出し |
| フラグ | `src/core/board/flag.ts` | 右クリック/ボタン入力で呼び出し |
| 勝敗判定 | `src/core/rules/win-lose.ts` | ゲーム状態表示に反映 |
| React UI | `src/ui/GameBoard.tsx` | デバッグモードとして残す（オプション）|

---

## タスク一覧

### T2-1: PixiJS + @pixi/react 統合

**ステップ1: 依存インストール**
```bash
# PixiJS
bun add pixi.js @pixi/react

# モバイルジョイスティック
bun add nipplejs
bun add -d @types/nipplejs
```

> 注: D2で必要な全依存を最初にインストールする（rules.md 3.2準拠）。

**ステップ2: テストを先に書く**
- `src/ui/pixi/__tests__/PixiSetup.test.tsx`
  - Canvasコンポーネントがエラーなくマウントされること
  - Stageコンポーネントが子要素を描画すること

**ステップ3: 基盤構築**
- `src/ui/pixi/PixiCanvas.tsx` — PixiJS Canvasのラッパー
  ```typescript
  // ReactコンポーネントとしてPixiJS Stageを提供
  // 将来Colyseus接続時にもこのラッパーを使い回す
  import { Stage } from '@pixi/react';
  ```

- `src/ui/pixi/constants.ts` — 描画定数
  ```typescript
  export const CELL_SIZE = 32;          // 1セルのピクセルサイズ
  export const GRID_PADDING = 16;       // グリッド外周の余白
  export const DEFAULT_ZOOM = 1.0;
  export const MIN_ZOOM = 0.3;
  export const MAX_ZOOM = 3.0;
  ```

**ステップ4: 実装**
- PixiJS Stage を Reactコンポーネントとしてラップ
- Vite設定にPixiJS関連の設定を追加（必要であれば）

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS（D1のテスト + D2の新テスト）
```

**ステップ6: 人間目視確認**
- [x] `bun run dev` でPixiJS Canvasが表示される（中身は空でもよい）
- [x] ブラウザコンソールにPixiJS関連のエラーが出ない

**コミット**: `feat(d2): PixiJS + @pixi/react 統合基盤`

---

### T2-2: セルタイプ別グリッド描画

**ステップ1: 依存インストール** — なし（T2-1で完了済み）

**ステップ2: テストを先に書く**
- `src/ui/pixi/__tests__/GridRenderer.test.tsx`
  - GameStateのセル数分のグラフィックが描画されること
  - safeセルに正しい数字が表示されること（1=青、2=緑等）
  - 数字0のセルはテキストなしで描画されること
  - フラグ付きセルに旗マークが表示されること
  - mine_safe/mine_danger が同じ見た目であること（目視不可）

**ステップ3: 基盤構築**
- `src/ui/pixi/grid/cellPalette.ts` — セル描画スタイル定義
  ```typescript
  export const CELL_COLORS = {
    uncovered: 0x6b7280,     // 未開拓: 灰色（mine_safe/mine_danger共通）
    safe:      0xd1d5db,     // 開拓済み: 薄いグレー
    flag:      0xef4444,     // 旗: 赤
    gameover:  0xdc2626,     // ゲームオーバー地雷: 濃い赤
  } as const;

  export const NUMBER_COLORS: Record<number, number> = {
    1: 0x3b82f6, // 青
    2: 0x22c55e, // 緑
    3: 0xef4444, // 赤
    4: 0x7c3aed, // 紫
    5: 0x991b1b, // 暗赤
    6: 0x0891b2, // シアン
    7: 0x1f2937, // 黒
    8: 0x6b7280, // 灰
  };
  ```

- `src/ui/pixi/grid/GridRenderer.tsx` — グリッド描画コンポーネント
  ```typescript
  // GameState を受け取り、PixiJS Container にセルを描画
  // 各セルは Graphics + Text のコンテナ
  ```

- `src/ui/pixi/grid/CellGraphics.tsx` — 個別セル描画
  ```typescript
  // セルタイプに応じて背景色・テキスト・旗を描画
  // Props: cellType, adjacentMines, isFlagged, isGameOver
  ```

**ステップ4: 実装**
- `GridRenderer`: GameState を読み取り、各セルの座標・サイズを計算して `CellGraphics` を配置
- `CellGraphics`: 背景矩形（`Graphics`）+ 数字テキスト（`Text`）+ 旗アイコン（`Text` or `Graphics`）
- 未開拓セル: 灰色矩形
- 開拓済みセル: 薄い灰色矩形 + 数字（0は空白）
- フラグ付き: 灰色矩形 + 旗テキスト
- ゲームオーバー時の地雷: 赤矩形 + 💣テキスト

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [x] グリッドが正しく描画される（セルの数が盤面サイズと一致）
- [x] セルタイプが視覚的に区別できる（未開拓=灰色、開拓済み=薄い灰色）
- [x] 数字の色が正しい（1=青、2=緑等）
- [x] フラグが表示される
- [x] スクリーンショットを `.sisyphus/evidence/d2-grid-rendering.png` に保存

**コミット**: `feat(d2): セルタイプ別グリッド描画`

---

### T2-3: グリッド操作（クリック入力 → コアロジック）

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/ui/pixi/__tests__/GridInteraction.test.tsx`
  - セルを左クリック → `revealCell()` が呼ばれること
  - セルを右クリック → `toggleFlag()` が呼ばれること
  - 開拓済みセルをクリック → コアロジックが呼ばれるが変化なし
  - ゲームオーバー後にクリック → 何も起こらないこと

**ステップ3: 基盤構築**
- `src/ui/pixi/grid/GridInteraction.tsx` — クリックイベントハンドラ
  ```typescript
  // PixiJSのpointerdownイベントを捕捉
  // 左クリック → reveal、右クリック → flag
  // 座標変換: ピクセル座標 → セル座標
  ```

- `src/ui/pixi/grid/useGameActions.ts` — コアロジック呼び出しフック
  ```typescript
  // React state で GameState を管理
  // reveal / flag のアクションを提供
  // 勝敗判定をリアクティブに反映
  ```

**ステップ4: 実装**
- `GridInteraction`: 各セルの `Graphics` に `eventMode: 'static'` と `pointerdown` を設定
- 左クリック（`button === 0`）→ `revealCell(state, x, y)`
- 右クリック（`button === 2`）→ `toggleFlag(state, x, y)`
- 座標変換: ピクセル位置 / CELL_SIZE = セル座標（`Math.floor`）
- `useGameActions`: `useState<GameState>` で状態管理。**重要**: 現行D1コア関数は破壊的更新を行う（`revealCell` は `GameState` を直接変更して `RevealResult` を返し、`toggleFlag` は `state.flags` を変更して `boolean` を返す）。そのためUI側で状態複製を行うこと:
  1. `structuredClone(state)` でディープコピーを生成
  2. コピーに対してコア関数を呼び出す
  3. コピーを `setState` でセット（React再描画をトリガー）
  ```typescript
  // useGameActions 内の実装パターン例
  const handleReveal = (x: number, y: number) => {
    const cloned = structuredClone(state);
    const result = revealCell(cloned, x, y);
    if (result.hitMine) {
      cloned.phase = GamePhase.GAME_OVER;
    }
    setState(cloned);
  };
  ```
  > 注: この `structuredClone` による防御的コピーはD2の簡略化アプローチであり、D8でcommand/reducerパイプラインに再構築されるまでの暫定措置。

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] 左クリックでセルが開く（flood-fill含む）
- [ ] 右クリックで旗が立つ/外れる
- [ ] 地雷を踏むとゲームオーバー表示
- [ ] 全安全セルを開くと勝利表示
- [ ] D1と同じゲーム体験がPixiJSで再現されている
- [ ] スクリーンショットを `.sisyphus/evidence/d2-grid-interaction.png` に保存

**コミット**: `feat(d2): グリッドクリック操作とコアロジック接続`

---

### T2-4: カメラ/ビューポート

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/ui/pixi/camera/__tests__/CameraController.test.ts`
  - 初期ズーム値が正しいこと
  - ズーム範囲（MIN_ZOOM ~ MAX_ZOOM）に収まること
  - パン操作でビューポートが移動すること

**ステップ3: 基盤構築**
- `src/ui/pixi/camera/camera.constants.ts` — カメラ定数（T2-1のconstantsから分離）
  ```typescript
  export const DEFAULT_ZOOM = 1.0;
  export const MIN_ZOOM = 0.3;
  export const MAX_ZOOM = 3.0;
  export const ZOOM_SPEED = 0.1;
  export const PAN_SPEED = 1.0;
  ```

- `src/ui/pixi/camera/CameraContainer.tsx` — カメラ制御コンテナ
  ```typescript
  // PixiJS Container の position/scale を制御
  // マウスホイール → ズーム
  // マウスドラッグ → パン
  // 盤面中央に自動フォーカス
  ```

- `src/ui/pixi/camera/useCamera.ts` — カメラ状態フック
  ```typescript
  // zoom, position の状態管理
  // clampZoom() で範囲制限
  ```

**ステップ4: 実装**
- `CameraContainer`: `Container` コンポーネントで `GridRenderer` をラップ
- マウスホイール: `wheel` イベントでズーム変更（`clampZoom`で範囲制限）
- マウスドラッグ: `pointerdown` + `pointermove` でパン（中ボタンまたは右ドラッグ）
- 初期位置: 盤面の中央にフォーカス

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] マウスホイールでズームイン/アウトできる
- [ ] マウスドラッグで画面をパンできる
- [ ] ズームがMIN/MAX範囲に収まる
- [ ] 大きな盤面でも全体像と拡大表示が切り替えられる
- [ ] スクリーンショットを `.sisyphus/evidence/d2-camera.png` に保存

**コミット**: `feat(d2): カメラ/ビューポート（ズーム・パン）`

---

### T2-5: モバイル仮想ジョイスティック + 行動ボタン

**ステップ1: 依存インストール** — なし（T2-1で全依存導入済み）

**ステップ2: テストを先に書く**
- `src/ui/mobile/__tests__/VirtualJoystick.test.tsx`
  - ジョイスティックコンポーネントがマウントされること
  - ジョイスティック操作で方向ベクトルが出力されること
  - 非操作時はゼロベクトルであること
- `src/ui/mobile/__tests__/ActionButtons.test.tsx`
  - Dig/Flag/Detonateボタンが表示されること
  - ボタンタップで対応するアクションが発火すること

**ステップ3: 基盤構築**
- `src/ui/mobile/VirtualJoystick.tsx` — 仮想ジョイスティック
  ```typescript
  // nipplejs を React コンポーネントでラップ
  // onMove: { x: number, y: number } 方向ベクトル（-1 ~ 1）
  // onEnd: ゼロベクトル
  ```

- `src/ui/mobile/ActionButtons.tsx` — 行動ボタン
  ```typescript
  // Dig（掘る）、Flag（旗）、Detonate（点火）の3ボタン
  // 各ボタンは onPress コールバックを発火
  // スマホ画面下部に固定配置
  ```

- `src/ui/mobile/mobile-controls.css` — モバイル用スタイル
  ```css
  /* ジョイスティック: 画面左下に固定 */
  /* 行動ボタン: 画面右下に固定 */
  /* タッチ操作の邪魔にならない配置 */
  ```

**ステップ4: 実装**
- `VirtualJoystick`: `useEffect` で nipplejs の `create()` を呼び出し、ジョイスティックゾーンを作成。`onMove` で方向ベクトルを `onDirectionChange` コールバックに渡す。
- `ActionButtons`: 3つのボタンを画面右下に絶対配置。`onPointerDown` でタップを検知。
- モバイル detection: `window.matchMedia('(max-width: 768px)')` または `'ontouchstart' in window` でモバイル判定し、モバイル時のみ表示。
- D2では移動は実装しない（連続移動はD7）が、ジョイスティックの方向入力はログ出力で確認可能にする。

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] スマホ画面サイズでジョイスティックが表示される（DevToolsで幅縮小して確認）
- [ ] ジョイスティックを操作すると方向ベクトルが画面オーバーレイに表示される（console.logは使用禁止）
- [ ] Dig/Flagボタンが表示される
- [ ] Digボタンをタップするとセルが開く（T2-3のインタラクションに接続）
- [ ] Flagボタンをタップすると旗が立つ（T2-3のインタラクションに接続）
- [ ] PC画面ではジョイスティック・ボタンが非表示（または表示切替可能）
- [ ] スクリーンショットを `.sisyphus/evidence/d2-mobile-controls.png` に保存

**コミット**: `feat(d2): モバイル仮想ジョイスティックと行動ボタン`

---

### T2-6: PCキーボード入力

**ステップ1: 依存インストール** — なし

**ステップ2: テストを先に書く**
- `src/ui/input/__tests__/keyboardBindings.test.ts`
  - Jキー押下 → dig アクションが発火すること
  - Kキー押下 → flag アクションが発火すること
  - Spaceキー押下 → detonate アクションが発火すること
  - 矢印キー押下 → カーソル位置が移動すること
  - WASDキー押下 → 何も起こらないこと（D2では未実装）
  - キーリピートが無効であること（押しっぱなしで連続発火しない）

**ステップ3: 基盤構築**
- `src/ui/input/keyboardBindings.ts` — キーバインド定義
  ```typescript
  export const KEY_BINDINGS = {
    dig:      'KeyJ',      // J: 掘る
    flag:     'KeyK',      // K: 旗
    detonate: 'Space',     // Space: 点火（D5以降で有効）
  } as const;
  ```

- `src/ui/input/useKeyboardInput.ts` — キーボード入力フック
  ```typescript
  // keydown イベントをリッスン
  // 対応アクションをコールバックで発火
  // keydown → action、keyup → リセット
  // リピート防止: event.repeat === true を無視
  ```

**ステップ4: 実装**
- `useKeyboardInput`: `useEffect` で `keydown`/`keyup` イベントをリッスン
- `event.repeat === true` の場合は無視（長押し連射防止）
- PC判定: モバイルではない場合に有効化
- J → カーソル位置のセルを `revealCell()` で開拓
- K → カーソル位置のセルを `toggleFlag()` で旗設置/解除

**注意**: D2では「カーソル位置」の概念を最小限に導入する。グリッド上にハイライト表示されるカーソルセルを持ち、矢印キー（↑↓←→）で移動する。これはPC操作の暫定対応であり、D7で本格的な連続移動システムに置き換えられる。WASDはD2では一切使用しない（D7の連続移動で導入）。

**ステップ5: テスト通過確認**
```bash
bun run test    # → PASS
```

**ステップ6: 人間目視確認**
- [ ] PCでJキーを押すとカーソル位置のセルが開く
- [ ] PCでKキーを押すとカーソル位置のセルに旗が立つ
- [ ] キーを押しっぱなしにしても連続発火しない
- [ ] スクリーンショットを `.sisyphus/evidence/d2-keyboard-input.png` に保存

**コミット**: `feat(d2): PCキーボード入力（J/K/Space）`

---

## 完了チェックリスト

- [ ] `bun run test` → 全テストPASS（D1 + D2）
- [ ] `bun run typecheck` → エラーなし
- [ ] `bun run dev` → PixiJSでマインスイーパーが表示される
- [ ] セルタイプが視覚的に区別できる（未開拓=灰色、開拓済み=薄い灰色+数字）
- [ ] 左クリックでセルが開く（flood-fill含む）
- [ ] 右クリックで旗が立つ/外れる
- [ ] マウスホイールでズーム、ドラッグでパンができる
- [ ] DevToolsでモバイル表示にした場合、ジョイスティックとボタンが表示される
- [ ] PCでJ/Kキーで操作できる
- [ ] D1と同じゲーム体験がPixiJSで完全に再現されている
- [ ] `src/core/` 配下のファイルが一切変更されていないこと
- [ ] 全スクリーンショットが `.sisyphus/evidence/d2-*.png` に保存されている

---

## D2完了後に次ドメインへ渡すもの

| 成果物 | ファイル | 次ドメインでの用途 |
|---|---|---|
| PixiJS Canvas | `src/ui/pixi/PixiCanvas.tsx` | D4-D10の全描画のベース |
| グリッド描画 | `src/ui/pixi/grid/GridRenderer.tsx` | D3: セル拡張、D4: 侵食警告表示 |
| セルパレット | `src/ui/pixi/grid/cellPalette.ts` | D4: 侵食色、D6: 爆発色の追加 |
| カメラ制御 | `src/ui/pixi/camera/CameraContainer.tsx` | D5: 仮経路表示、D7: プレイヤー追従 |
| モバイル入力 | `src/ui/mobile/VirtualJoystick.tsx` | D7: 連続移動への接続 |
| 行動ボタン | `src/ui/mobile/ActionButtons.tsx` | D5: Detonateボタン有効化 |
| キーボード入力 | `src/ui/input/useKeyboardInput.ts` | D7: WASD移動への接続 |
| 描画定数 | `src/ui/pixi/constants.ts` | D4-D10で参照 |
