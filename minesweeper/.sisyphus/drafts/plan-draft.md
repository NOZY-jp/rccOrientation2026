# Detonator 実装プラン ドラフト

> このファイルはサブエージェントがプランを考案するための作業領域です。

## 確定済みの前提条件

### 技術スタック
- Layer ① Config: JSON + Zod + expr-eval
- Layer ② Network: Colyseus（authoritative server）
- Layer ③ Simulation: Vanilla TypeScript（Colyseus setSimulationInterval）
- Layer ④ Rendering: PixiJS + @pixi/react
- Layer ⑤ State: Zustand
- Layer ⑥ UI: React 19
- Layer ⑦ Build: Vite
- Layer ⑧ Package Manager: Bun
- Layer ⑨ Audio: Howler.js

### MVPスコープ
- 全10フロア
- スマホ優先（仮想ジョイスティック+ボタン）
- PC操作も実装（WASD+キーボード）
- 手書きJSONステージ
- PixiJS幾何学ビジュアル
- ローカルデプロイのみ
- サーバーロジックはテスト必須
- フロントはテスト実装＋人間目視確認

### ステージJSON構造
- field: タイルIDの二次元配列
- checkPointCandidates: CP生成許可座標のbool配列
- spawnPositions: 初期スポーン可能座標の配列（大人数対応）

### 実装スタイル
- 環境構築→全機能一気作成 ではなく、機能ごとに段階的に追加していくインクリメンタル方式

### 主要ゲームメカニクス（設計完了）
- セル型: safe_cell, mine_safe, mine_danger, wasteland, hole
- 移動: 連続座標、AABB矩形コリジョン、浮動小数点
- 操作: Dig(地雷原のみ)、Flag(地雷原のみ)、Detonate(MST点火)
- 管理外爆発: 危険地雷誤掘り → BFS連鎖（衝撃波+荒地化）
- 侵食: BFS探索、frontline概念、tick開始位置判定
- CP: セル属性、ユークリッド距離検知、全回収で即時クリア
- アイテム/スキル: ドロップ/レベルアップ報酬、JSON駆動
- 死亡/リスポーン: 40秒ベース式駆動、全滅即ゲームオーバー
- マルチプレイ: Colyseus、単一チーム、途中参加許可

### テスト戦略
- サーバーロジック: テスト必須（爆発計算、MST、侵食BFS、CP検知等）
- フロント: テスト実装あり、基本は人間目視確認
- QA: Agent-Executed QA Scenarios（Playwright for ブラウザUI）

---

（以下にサブエージェントがプランを追記）

## サブエージェントB案: Wave 4-6（ゲームメカニクス）

### 前提・依存（Wave 1-3 完了を前提）
- 依存: Room/Simulationループ、基礎グリッド、プレイヤー移動、基本Dig/Flag、JSON+Zodロード基盤、Colyseus同期基盤、基本イベントキュー（最低限）が実装済みであること。
- 方針: **サーバー権威**で判定（Detonate/管理外爆発/侵食/CP/フロア遷移はすべてサーバーで確定）。クライアントは入力送信と表示のみ。
- 方針: Colyseus Schemaには「クライアント描画に必要な最小状態のみ」を持たせ、計算途中データ（探索キュー内部など）はサーバー内部に閉じる。

---

### Wave 4: Detonate system + controlled explosions

| タスクID | 何を実装するか（WHAT） | 対象ファイル（1-3） | 依存 | これが解放する作業 |
|---|---|---|---|---|
| W4-1 | Detonate用イベント契約を定義（`detonate_armed`/`detonate_resolve`、3秒fuse、provisional pathの同期用フィールド） | `src/server/state/schema/GameState.ts` / `src/server/sim/events/gameEventQueue.ts` | Wave1-3のSchema/Queue基盤 | 点火予約と爆発時再計算を順序保証して実装できる |
| W4-2 | Detonateコマンド受付（CT検証・始点検証）→3秒後イベント投入までをRoom入力系に接続 | `src/server/rooms/DetonatorRoom.ts` / `src/server/sim/commands/detonateCommand.ts` | W4-1 | プレイヤー操作からサーバーイベント駆動へ接続可能 |
| W4-3 | **Prim rooted MST**実装（点火源root、決定的タイブレーク、safe-mine枝刈り） | `src/server/sim/explosion/primMst.ts` / `src/server/sim/explosion/primMst.spec.ts` | W4-1 | Detonate本体計算を独立テスト可能にする（必須テスト） |
| W4-4 | 爆発時スナップショットでMST再計算し、flagged danger mineのみsafe化。衝撃波/荒地化を適用しないDetonate解決器を実装 | `src/server/sim/explosion/detonateResolver.ts` / `src/server/sim/grid/numberField.ts` / `src/server/sim/explosion/detonateResolver.spec.ts` | W4-2, W4-3 | Detonateの正式効果（mine→safe + 数字再計算）を確定 |
| W4-5 | fuse中の**仮経路表示**（provisional）を配信・描画（確定結果との差分許容） | `src/server/state/schema/GameState.ts` / `src/client/store/gameStore.ts` / `src/client/pixi/layers/FusePathLayer.tsx` | W4-2, W4-3 | 点火後3秒のプレイアビリティと可視フィードバックを提供 |
| W4-6 | Relay Pointアイテム（安全マス設置、MST中継ノード、経路上で消滅）を実装 | `src/server/sim/items/itemDefinitions.json` / `src/server/sim/items/itemUseService.ts` / `src/server/sim/explosion/detonateResolver.ts` | W4-3, Wave3のアイテム基盤 | safeセル経由の導火線設計が可能になる |
| W4-7 | Detonate統合テスト（同tick複数点火、爆発時再計算、途中の旗変化無視、Relay Point破壊） | `src/server/sim/explosion/detonate.integration.spec.ts` / `src/server/sim/events/gameEventQueue.spec.ts` | W4-1〜W4-6 | Wave5以降の爆発競合（起爆/侵食）検証の土台になる |

---

### Wave 5: Erosion system + uncontrolled explosions

| タスクID | 何を実装するか（WHAT） | 対象ファイル（1-3） | 依存 | これが解放する作業 |
|---|---|---|---|---|
| W5-1 | 侵食間隔を式駆動でスケジューリング（floor依存、警告時間と連動） | `src/server/config/balance/formulas.json` / `src/server/sim/erosion/erosionScheduler.ts` / `src/server/rooms/DetonatorRoom.ts` | Wave1-3の式評価基盤, W4-1 | 侵食イベントをイベントキューで安定駆動できる |
| W5-2 | frontline BFS探索（erosion power分だけ前進、候補枯渇時ルール含む）を実装 | `src/server/sim/erosion/erosionFrontline.ts` / `src/server/sim/erosion/erosionFrontline.spec.ts` | W5-1 | 警告対象・実侵食対象を決定的に生成できる（必須テスト） |
| W5-3 | 侵食警告対象（frontline隣接）をSchema同期し、警告アニメーション描画 | `src/server/state/schema/GameState.ts` / `src/client/store/gameStore.ts` / `src/client/pixi/layers/ErosionWarningLayer.tsx` | W5-2 | プレイヤー回避判断用の可視情報が成立 |
| W5-4 | 侵食実行（tick開始位置で即死判定、セル変換、旗/Relay除去、数字再計算、地上アイテム消滅） | `src/server/sim/erosion/erosionResolver.ts` / `src/server/sim/grid/numberField.ts` / `src/server/sim/items/groundItemService.ts` | W5-2, W5-3, W4-6 | 侵食のゲームルールをサーバー権威で完結 |
| W5-5 | **管理外爆発（起爆）**: danger mine踏みをトリガーにBFS連鎖（1/8秒/セル）を実装 | `src/server/sim/explosion/stepOnChain.ts` / `src/server/sim/explosion/stepOnChain.spec.ts` | W4-1のイベントキュー, Wave3の移動/掘り判定 | 誤掘り時の主脅威ループが成立（必須テスト） |
| W5-6 | 起爆の爆発プロファイル適用（衝撃波=Chebyshev半径1、荒地化=Manhattan半径2、旗/Relay除去、地上ドロップ破壊） | `src/server/sim/explosion/explosionProfile.ts` / `src/server/sim/explosion/stepOnChain.ts` / `src/server/sim/explosion/explosionProfile.spec.ts` | W5-5, W4-6 | Detonateと管理外爆発の差分を明文化して安定実装 |
| W5-7 | 爆発・侵食の競合順序をtick内固定（入力確定→期限到来イベント→爆発適用→再計算） | `src/server/sim/events/gameEventQueue.ts` / `src/server/sim/events/gameEventQueue.spec.ts` | W4-1, W5-5, W5-6 | Wave6のフロアクリア時キャンセル処理を安全に実装可能 |

---

### Wave 6: Progression + floor system

| タスクID | 何を実装するか（WHAT） | 対象ファイル（1-3） | 依存 | これが解放する作業 |
|---|---|---|---|---|
| W6-1 | Checkpointシステム（不可視保持、Euclidean検知、接触回収、Detector時チーム共有可視） | `src/server/sim/checkpoint/checkpointService.ts` / `src/server/state/schema/GameState.ts` / `src/server/sim/checkpoint/checkpointService.spec.ts` | Wave1-3の座標/移動基盤 | フロアクリア条件判定を実装可能（必須テスト） |
| W6-2 | フロア状態機械 `playing -> floor-clear -> rest -> next-floor` を実装（全CP回収で即時遷移） | `src/server/sim/floor/floorStateMachine.ts` / `src/server/rooms/DetonatorRoom.ts` / `src/server/sim/floor/floorStateMachine.spec.ts` | W6-1, W5-7 | タイマー停止・演出・遷移の順序を固定化 |
| W6-3 | フロアクリア時処理（保留イベント全キャンセル、地雷消失、全員復活、初期スポーン戻し） | `src/server/sim/floor/floorTransitionService.ts` / `src/server/sim/events/gameEventQueue.ts` / `src/server/sim/player/respawnService.ts` | W6-2, W5-4, W5-6 | 次フロア開始の不整合（残爆発/残侵食）を防止 |
| W6-4 | レベルアップ報酬の蓄積→休憩フェーズでまとめて選択（有効候補のみ提示） | `src/server/sim/progression/levelUpService.ts` / `src/client/ui/RestRewardPanel.tsx` / `src/client/store/gameStore.ts` | Wave3の報酬基盤, W6-2 | 進行報酬ループをプレイフローに接続 |
| W6-5 | フロア遷移時の持ち越し規約を実装（持ち越し: items/skills、リセット: 地形/旗/CT/バフ/一時効果） | `src/server/sim/floor/floorTransitionService.ts` / `src/server/sim/player/playerRuntimeReset.ts` / `src/server/state/schema/GameState.ts` | W6-2, W6-3 | 仕様通りの進行持続性とリセット整合を確保 |
| W6-6 | リスポーン（40sベース式、短縮アイテム適用、全員死亡で即game-over） | `src/server/sim/player/respawnService.ts` / `src/server/config/balance/formulas.json` / `src/server/sim/player/respawnService.spec.ts` | Wave3死亡基盤, W6-2 | 失敗条件と復帰ループが確立 |
| W6-7 | 最終勝利条件（10フロア）と結果画面遷移（victory/game-over） | `src/server/sim/floor/floorStateMachine.ts` / `src/server/state/schema/GameState.ts` / `src/client/ui/ResultOverlay.tsx` | W6-2, W6-6 | MVPのラン完走条件を確定 |

---

### 横断テスト戦略（Wave 4-6）
- 必須サーバーテスト対象（要求準拠）
  - 爆発計算: `detonateResolver.spec.ts` / `stepOnChain.spec.ts` / `explosionProfile.spec.ts`
  - MST: `primMst.spec.ts`
  - 侵食BFS: `erosionFrontline.spec.ts`
  - CP検知: `checkpointService.spec.ts`
- 競合系回帰テスト
  - 同tick内の複数イベント順序（Detonate fuse満了 + 起爆連鎖 + 侵食期限到来）
  - フロアクリア瞬間の保留イベントキャンセル
- クライアント表示確認（非権威）
  - Fuse仮経路表示、侵食警告表示、休憩フェーズ報酬UIは表示整合テスト＋目視確認で担保。

### 実装順サマリ（最短クリティカルパス）
1. W4-1〜W4-4（Detonateのサーバー確定処理）
2. W5-1〜W5-6（侵食/管理外爆発の危険系ループ）
3. W6-1〜W6-3（CPとフロア遷移のゲーム進行骨格）
4. W6-4〜W6-7（成長・勝敗・UI統合）

## サブエージェントA案: Wave 1-3（基盤構築）

> 方針: **「1タスク = 1〜3ファイル」**で小さく積み上げ、各Waveの最後に必ず「画面で見える成果」または「テストで確認できる成果」を作る。  
> 前提: Colyseus authoritative server / PixiJS描画 / React UI / Zustand橋渡し / Vite build / Bun package manager。

### 先に固定するディレクトリ構成（Wave 1開始時に確定）

- `apps/client` : React + PixiJS クライアント
- `apps/server` : Colyseus サーバー
- `packages/shared` : 型・スキーマ・設定ローダー
- `configs` : ステージ/アイテム/スキル/式JSON

---

## Wave 1: プロジェクト足場 + コアデータ型

### W1-T1: Bunワークスペースと共通TypeScript土台
- **対象ファイル**
  - `package.json`
  - `bunfig.toml`
  - `tsconfig.base.json`
- **依存**: なし
- **実装内容（WHAT）**: Bun workspace、共通scripts（dev/build/test/typecheck）、TS strict設定を確立。
- **これで解放される作業**: client/server/sharedを同一リポジトリで並行実装できる。

### W1-T2: Vite + Reactクライアント最小起動
- **対象ファイル**
  - `apps/client/vite.config.ts`
  - `apps/client/index.html`
  - `apps/client/src/main.tsx`
- **依存**: W1-T1
- **実装内容（WHAT）**: React 19エントリとVite起動確認用の最小画面を作成。
- **これで解放される作業**: Wave 2のPixi統合、モバイルUI統合。

### W1-T3: Colyseusサーバー雛形
- **対象ファイル**
  - `apps/server/src/index.ts`
  - `apps/server/src/rooms/DetonatorRoom.ts`
  - `apps/server/tsconfig.json`
- **依存**: W1-T1
- **実装内容（WHAT）**: Room起動、接続/切断ログ、simulation intervalの空ループまでを用意。
- **これで解放される作業**: Wave 3の移動/操作/同期の実装基盤。

### W1-T4: ゲーム共通型（CellType / Player / Item / Skill / GamePhase）
- **対象ファイル**
  - `packages/shared/src/types/cell.ts`
  - `packages/shared/src/types/entities.ts`
  - `packages/shared/src/types/game.ts`
- **依存**: W1-T1
- **実装内容（WHAT）**: セル種別enum、プレイヤー連続座標、AABB、アイテム/スキル定義、ゲームフェーズ型を明文化。
- **これで解放される作業**: server state schema、client描画、入力型安全化。

### W1-T5: Zodスキーマ（ステージ/アイテム/スキル/式）
- **対象ファイル**
  - `packages/shared/src/config/schema/stage.schema.ts`
  - `packages/shared/src/config/schema/item-skill.schema.ts`
  - `packages/shared/src/config/schema/formula.schema.ts`
- **依存**: W1-T4
- **実装内容（WHAT）**: JSONの必須キー・型・範囲・列挙制約を定義し、不正データを起動時に検出可能にする。
- **これで解放される作業**: JSON定義の安全な拡張、CIでの設定破壊検知。

### W1-T6: JSON設定の初期フォーマットを確定
- **対象ファイル**
  - `configs/stages/stage-001.json`
  - `configs/game/items-skills.json`
  - `configs/game/formulas.json`
- **依存**: W1-T5
- **実装内容（WHAT）**: field/checkPointCandidates/spawnPositions、アイテム/スキル、主要式（境界値含む）の初版を定義。
- **これで解放される作業**: Wave 2のグリッド描画、Wave 3の速度/判定式適用。

### W1-T7: Configローダー + バリデーション接続
- **対象ファイル**
  - `packages/shared/src/config/loadConfig.ts`
  - `packages/shared/src/config/index.ts`
  - `packages/shared/src/config/loadConfig.test.ts`
- **依存**: W1-T5, W1-T6
- **実装内容（WHAT）**: JSON読込→Zod検証→型付きオブジェクト返却の経路を一本化。
- **これで解放される作業**: server/clientが同一設定ソースを参照可能。

### W1-T8: 基本ビルドパイプライン（ローカルCI相当）
- **対象ファイル**
  - `package.json`（scripts更新）
  - `vitest.workspace.ts`
  - `.github/workflows/ci.yml`
- **依存**: W1-T2, W1-T3, W1-T7
- **実装内容（WHAT）**: `typecheck` / `test` / `build` を分離し、push前に自動検証できる状態にする。
- **これで解放される作業**: Wave 2/3で機能追加時の回帰検知。

#### Wave 1 完了条件（見える成果）
- `bun run dev:client`でReact画面が起動。
- `bun run dev:server`でColyseus Roomが待受。
- 不正JSONを与えると検証エラーで停止（テストで再現可能）。

---

## Wave 2: グリッドシステム + 描画基盤

### W2-T1: PixiJS + @pixi/react をReactに統合
- **対象ファイル**
  - `apps/client/src/App.tsx`
  - `apps/client/src/game/DetonatorCanvas.tsx`
  - `apps/client/src/styles/game.css`
- **依存**: W1-T2
- **実装内容（WHAT）**: 画面全体にPixiキャンバスを敷き、HUDオーバーレイ可能なレイヤ構成を作る。
- **これで解放される作業**: グリッド/プレイヤー/カメラ描画。

### W2-T2: ステージJSON→描画用グリッドモデル変換
- **対象ファイル**
  - `apps/client/src/game/grid/GridModel.ts`
  - `apps/client/src/game/grid/useGridModel.ts`
  - `apps/client/src/game/grid/GridModel.test.ts`
- **依存**: W1-T6, W1-T7
- **実装内容（WHAT）**: field配列をタイル座標系へ変換し、描画で使う行列データを確定。
- **これで解放される作業**: タイルレンダリング、可視範囲計算。

### W2-T3: セルタイプ別グリッド描画
- **対象ファイル**
  - `apps/client/src/game/grid/cellPalette.ts`
  - `apps/client/src/game/grid/GridLayer.tsx`
  - `apps/client/src/game/grid/GridLegend.tsx`
- **依存**: W2-T2
- **実装内容（WHAT）**: `safe_cell / mine_safe / mine_danger / wasteland / hole`を明確に色・形で描き分け。
- **これで解放される作業**: 盤面視認性の確立、操作対象判定のUI検証。

### W2-T4: プレイヤー幾何学描画（円/角丸矩形）
- **対象ファイル**
  - `apps/client/src/game/player/PlayerLayer.tsx`
  - `apps/client/src/game/player/playerStyle.ts`
  - `apps/client/src/game/player/PlayerLabel.tsx`
- **依存**: W1-T4, W2-T1
- **実装内容（WHAT）**: 連続座標に基づくプレイヤー位置表示、色分け、最低限の向き可視化。
- **これで解放される作業**: Wave 3の移動同期の目視確認。

### W2-T5: カメラ/ビューポート基盤
- **対象ファイル**
  - `apps/client/src/game/camera/useCamera.ts`
  - `apps/client/src/game/camera/CameraContainer.tsx`
  - `apps/client/src/game/camera/camera.constants.ts`
- **依存**: W2-T3, W2-T4
- **実装内容（WHAT）**: ズーム・パン・追従の最小機能を実装し、大盤面でも操作可能にする。
- **これで解放される作業**: スマホ視認性調整、複数人同時プレイ画面。

### W2-T6: スマホ向け仮想ジョイスティック + 行動ボタンUI
- **対象ファイル**
  - `apps/client/src/ui/mobile/VirtualJoystick.tsx`
  - `apps/client/src/ui/mobile/ActionButtons.tsx`
  - `apps/client/src/ui/mobile/mobileControls.css`
- **依存**: W2-T1
- **実装内容（WHAT）**: 移動入力（方向ベクトル）と Dig/Flag/Detonate ボタン入力をUIとして提供。
- **これで解放される作業**: Wave 3のサーバー入力送信。

### W2-T7: Zustand入力ストア（PC/スマホ統合）
- **対象ファイル**
  - `apps/client/src/state/inputStore.ts`
  - `apps/client/src/input/keyboardBindings.ts`
  - `apps/client/src/ui/mobile/useMobileInput.ts`
- **依存**: W2-T6
- **実装内容（WHAT）**: WASD/仮想スティックを同一入力形式に正規化し、行動ボタン状態も保持。
- **これで解放される作業**: Colyseus入力送信、デバイス差分吸収。

#### Wave 2 完了条件（見える成果）
- JSONステージがPixiキャンバス上に描画される。
- セル種別が一目で区別できる。
- 仮想ジョイスティック操作で入力値がUIデバッグ表示に反映される。

---

## Wave 3: 移動 + 衝突 + 基本インタラクション

### W3-T1: Colyseus状態スキーマ（最小）
- **対象ファイル**
  - `apps/server/src/schema/GameState.ts`
  - `apps/server/src/schema/PlayerState.ts`
  - `apps/server/src/rooms/DetonatorRoom.ts`
- **依存**: W1-T3, W1-T4
- **実装内容（WHAT）**: プレイヤー位置・速度・セル状態・フラグ状態を同期対象として定義。
- **これで解放される作業**: authoritative state sync。

### W3-T2: 連続移動システム（浮動小数点 + tick更新）
- **対象ファイル**
  - `apps/server/src/simulation/tick.ts`
  - `apps/server/src/simulation/MovementSystem.ts`
  - `apps/server/src/rooms/messageHandlers/movement.ts`
- **依存**: W3-T1, W2-T7
- **実装内容（WHAT）**: 入力ベクトルから `pos += velocity * dt` を適用し、サーバー権威で更新。
- **これで解放される作業**: 速度補正・衝突・押し合い。

### W3-T3: 地形衝突 + 荒野速度低下
- **対象ファイル**
  - `apps/server/src/simulation/collision/CellCollision.ts`
  - `apps/server/src/simulation/modifiers/SpeedModifier.ts`
  - `apps/server/src/simulation/MovementSystem.test.ts`
- **依存**: W3-T2, W1-T6
- **実装内容（WHAT）**: mine/hole侵入禁止、wasteland上は `baseSpeed * 0.4` を適用。
- **これで解放される作業**: 地形に意味がある移動体験。

### W3-T4: プレイヤー同士AABB衝突（押し合い）
- **対象ファイル**
  - `apps/server/src/simulation/collision/PlayerCollision.ts`
  - `apps/server/src/simulation/MovementSystem.ts`
  - `apps/server/src/simulation/collision/PlayerCollision.test.ts`
- **依存**: W3-T3
- **実装内容（WHAT）**: 重なり解消ベクトルで押し合い挙動を実現（すり抜けは不可）。
- **これで解放される作業**: 協力/妨害の物理的相互作用。

### W3-T5: Digコマンド（地雷原のみ）+ 0近傍自動展開
- **対象ファイル**
  - `apps/server/src/simulation/actions/dig.ts`
  - `apps/server/src/simulation/board/revealFloodFill.ts`
  - `apps/server/src/simulation/actions/dig.test.ts`
- **依存**: W3-T3
- **実装内容（WHAT）**: mineセルをsafe_cell化し、隣接地雷数0なら連鎖展開。
- **これで解放される作業**: マインスイーパーの最小プレイサイクル。

### W3-T6: Flagコマンド（地雷原のみ）
- **対象ファイル**
  - `apps/server/src/simulation/actions/flag.ts`
  - `apps/server/src/rooms/messageHandlers/action.ts`
  - `apps/server/src/simulation/actions/flag.test.ts`
- **依存**: W3-T3
- **実装内容（WHAT）**: 地雷原セルへのフラグ設置/解除をサーバーで裁定。
- **これで解放される作業**: 後続WaveのDetonate/MST実装。

### W3-T7: クライアントへの状態同期橋渡し（Colyseus→Zustand→Pixi）
- **対象ファイル**
  - `apps/client/src/network/colyseusClient.ts`
  - `apps/client/src/network/useRoomSync.ts`
  - `apps/client/src/state/gameStore.ts`
- **依存**: W3-T1, W2-T3, W2-T4
- **実装内容（WHAT）**: room state更新をZustandへ反映し、描画レイヤに配信。
- **これで解放される作業**: 実プレイ相当の同期検証。

### W3-T8: 行動入力送信（Dig/Flag）+ デバッグ可視化
- **対象ファイル**
  - `apps/client/src/input/commandSender.ts`
  - `apps/client/src/ui/mobile/ActionButtons.tsx`
  - `apps/client/src/ui/debug/StateOverlay.tsx`
- **依存**: W3-T5, W3-T6, W3-T7
- **実装内容（WHAT）**: ボタン入力をColyseusメッセージに変換し、結果をHUDで確認。
- **これで解放される作業**: Wave 4以降（Detonate・侵食・CP）の実装検証環境。

#### Wave 3 完了条件（見える成果）
- 複数クライアントで移動・押し合いが同期される。
- mine/holeは侵入不可、wastelandで減速が体感できる。
- Digでセルが開き、0近傍は自動展開、Flag設置/解除が全員に同期される。

---

## 依存チェーン（要約）

- **最重要クリティカルパス**: `W1-T1 → W1-T2/W1-T3 → W1-T4/5/6/7 → W2-T1/2/3/4/7 → W3-T1/2/3/5/7/8`
- **並列化可能**
  - Wave 1: `W1-T2`（client）と`W1-T3`（server）は並列可
  - Wave 2: `W2-T3`（grid）と`W2-T6`（mobile UI）は並列可
  - Wave 3: `W3-T5`（dig）と`W3-T6`（flag）は`W3-T3`完了後に並列可

## この3Waveが解放する次フェーズ

- Detonate（MST/Prim）
- 管理外爆発（衝撃波+荒地化）
- 侵食BFS + 警告フェーズ
- チェックポイント検知/回収
- 途中参加・再接続完全復元

## サブエージェントC案: Wave 7-8（残機能・UI・オーディオ・最終検証）

### 前提・依存（Wave 6完了を前提）
- 依存: `W6-2`（フロア状態機械）、`W6-3`（フロア遷移）、`W6-4`（休憩フェーズ報酬）、`W6-5`（持ち越し/リセット規約）、`W6-6`（死亡/リスポーン基盤）、`W6-7`（勝敗遷移）が実装済みであること。
- 方針: 残タスクは「サーバー権威の仕様確定」と「クライアント表現（UI/Audio）」を分離し、後半で統合テストを集中実施する。
- 並列着手: `W7-2`, `W7-4`, `W8-4`, `W8-8`, `W8-9`, `W8-10〜W8-14` は Wave 5-6と一部並列で先行可能（既存ロジックへの依存が薄い）。

---

### Wave 7: 残ゲームメカニクス（Items/Death/Floor/Win-Lose）

| タスクID | 何を実装するか（WHAT） | 対象ファイル（1-3） | 依存 | これが解放する作業 |
|---|---|---|---|---|
| W7-1 | 地上ドロップ基盤を完成（15秒寿命、接触自動取得、満杯時取得失敗、同種スタック時は成功） | `src/server/sim/items/groundItemService.ts` / `src/server/sim/items/itemPickupService.ts` / `src/server/state/schema/GameState.ts` | W6-5, W6-6 | アイテムループ（落下→拾得→消滅）の仕様を一貫化できる |
| W7-2 | 主要アイテム/スキル定義JSONを完成（Relay Point, Dash, Force Ignition, Bridge, Mine Remover, Checkpoint Detector, Emergency Escape, Small/Large Break, Disposable Life, Nine Lives, chord等、スタック上限含む） | `configs/game/items-skills.json` / `packages/shared/src/config/schema/item-skill.schema.ts` / `packages/shared/src/config/loadConfig.test.ts` | W6-4 | 実装側が参照する定義不足を解消し、報酬候補生成を安定化 |
| W7-3 | 主要アイテム効果のサーバー実装を完成（Dash 15秒1.5x、Force Ignition CT無視、BridgeのHole→safe変換と侵食での再劣化、Mine RemoverのFacing 4/8方向処理） | `src/server/sim/items/itemUseService.ts` / `src/server/sim/player/facingService.ts` / `src/server/sim/grid/terrainMutationService.ts` | W7-2, W6-5, W5-4 | 方向依存/地形変換を含む使用系アイテムが仕様通り動作 |
| W7-4 | レベルアップ報酬の「未選択蓄積→休憩フェーズ提示」を完成（有効候補のみ提示、無効候補フィルタ） | `src/server/sim/progression/levelUpService.ts` / `src/server/sim/progression/rewardCandidateService.ts` / `src/client/ui/RestRewardPanel.tsx` | W6-4, W7-2 | レベルアップと休憩UIが整合し、報酬選択の詰まりを解消 |
| W7-5 | 死亡トリガー統合（衝撃波/侵食/管理外爆発）と死亡時処理順を確定（全アイテムロスト、Nine Lives/Disposable Lifeの優先消費順） | `src/server/sim/player/deathService.ts` / `src/server/sim/player/respawnService.ts` / `src/server/sim/items/passiveLifeService.ts` | W6-6, W5-4, W5-6 | 死亡判定の競合を排除し、ロスト仕様を一意化 |
| W7-6 | ゴースト状態とリスポーン規約を完成（ゴースト移動可・情報支援不可、生存者近傍安全セル優先/失敗時荒地fallback、死亡者がいる間の90%短縮ドロップ適用） | `src/server/sim/player/respawnService.ts` / `src/server/sim/items/groundItemService.ts` / `src/server/state/schema/GameState.ts` | W7-1, W7-5 | 蘇生体験と全滅条件の仕様穴を塞ぐ |
| W7-7 | フロアクリア演出〜休憩〜次フロア遷移を最終化（地雷消失、タイマー停止、全員即復活、初期スポーン移動、CT/バフリセット） | `src/server/sim/floor/floorStateMachine.ts` / `src/server/sim/floor/floorTransitionService.ts` / `src/server/state/schema/GameState.ts` | W6-2, W6-3, W6-5, W7-6 | フロアループの終端処理を固定し、UI/Audio同期実装へ接続 |
| W7-8 | 最終勝敗とスコア確定を最終化（10フロア勝利、全滅即敗北、EXP×タイムボーナス式の境界処理） | `src/server/sim/floor/floorStateMachine.ts` / `configs/game/formulas.json` / `src/server/state/schema/GameState.ts` | W6-7, W7-7 | Result表示と最終検証の判定基準を確定 |

---

### Wave 8: UI/Audio/Multiplayer/Config最終化 + 総合検証

| タスクID | 何を実装するか（WHAT） | 対象ファイル（1-3） | 依存 | これが解放する作業 |
|---|---|---|---|---|
| W8-1 | アイテムスロットUIを完成（最大10枠、タップ/ホバーで説明、使用/破棄導線） | `src/client/ui/ItemSlotBar.tsx` / `src/client/ui/ItemDetailPanel.tsx` / `src/client/store/gameStore.ts` | W7-1, W7-3, W7-4 | スマホ優先のアイテム操作が成立 |
| W8-2 | 残HUDを完成（スコア/状態、フロア表示、Detonate CD表示） | `src/client/ui/GameHud.tsx` / `src/client/ui/FloorIndicator.tsx` / `src/client/ui/DetonateCooldownIndicator.tsx` | W7-8 | 進行情報の常時可視化が可能 |
| W8-3 | 残オーバーレイを完成（Game Over、Result、休憩報酬パネル最終表示） | `src/client/ui/GameOverOverlay.tsx` / `src/client/ui/ResultOverlay.tsx` / `src/client/ui/RestRewardPanel.tsx` | W7-4, W7-7, W7-8 | 勝敗〜次遷移までのUI導線を閉じる |
| W8-4 | Howler.js音響基盤を統合（BGM再生管理、SFXマッピング: dig/flag/detonate/explosion/erosion-warning/death等） | `src/client/audio/audioManager.ts` / `src/client/audio/sfxRegistry.ts` / `src/client/network/useRoomSync.ts` | W7-7 | 主要イベントに対する音フィードバックを付与 |
| W8-5 | 途中参加（Join-in-progress）を最終化（レベル1・所持なし・キャッチアップなし） | `src/server/rooms/DetonatorRoom.ts` / `src/server/sim/player/joinInProgressService.ts` / `src/server/state/schema/GameState.ts` | W7-7 | セッション途中流入のMVP仕様を確定 |
| W8-6 | 切断/再接続を最終化（猶予時間、完全復元、危険位置の再配置バリデーション） | `src/server/rooms/DetonatorRoom.ts` / `src/server/sim/player/reconnectService.ts` / `src/server/sim/player/spawnValidationService.ts` | W8-5, W7-6 | 実運用時のセッション継続性を担保 |
| W8-7 | マルチプレイ押し合い挙動の最終化（AABB pushの境界調整と回帰テスト） | `src/server/sim/collision/PlayerCollision.ts` / `src/server/sim/MovementSystem.ts` / `src/server/sim/collision/PlayerCollision.spec.ts` | Wave3衝突基盤, W8-5 | 多人数時の詰まり/貫通を抑制 |
| W8-8 | 式JSONを完成（主要式の最小値/最大値/クランプを明記、境界値テスト追加） | `configs/game/formulas.json` / `packages/shared/src/config/schema/formula.schema.ts` / `packages/shared/src/config/loadConfig.test.ts` | W7-8 | バランス式の運用事故を防止 |
| W8-9 | アイテム/スキルJSONの最終補完（全定義、スタック上限、報酬候補属性、除外条件） | `configs/game/items-skills.json` / `packages/shared/src/config/schema/item-skill.schema.ts` / `packages/shared/src/config/loadConfig.test.ts` | W7-2, W7-4 | 報酬提示・ドロップ・所持判定の整合を担保 |
| W8-10 | ステージJSON追加（フロア1〜3向け手書きステージ群その1、各spawn候補付き） | `configs/stages/stage-f01-a.json` / `configs/stages/stage-f02-a.json` / `configs/stages/stage-f03-a.json` | Wave1-6のステージローダー | 10フロア分の素材拡充を開始 |
| W8-11 | ステージJSON追加（フロア4〜6向け手書きステージ群その2） | `configs/stages/stage-f04-a.json` / `configs/stages/stage-f05-a.json` / `configs/stages/stage-f06-a.json` | W8-10 | 中盤フロアの盤面差分を確保 |
| W8-12 | ステージJSON追加（フロア7〜9向け手書きステージ群その3） | `configs/stages/stage-f07-a.json` / `configs/stages/stage-f08-a.json` / `configs/stages/stage-f09-a.json` | W8-11 | 終盤フロア向けの難度曲線を構築 |
| W8-13 | ステージJSON追加（フロア10向け + 追加バリエーション）で合計10+手書きJSONを満たす | `configs/stages/stage-f10-a.json` / `configs/stages/stage-f10-b.json` / `configs/stages/stage-f03-b.json` | W8-12 | MVP必要数（10+）のステージ資産を満たす |
| W8-14 | 全ステージのスポーングループ割当（1〜10人）をJSON化し、ローダー検証に接続 | `configs/stages/spawn-groups.json` / `packages/shared/src/config/schema/stage.schema.ts` / `packages/shared/src/config/loadConfig.test.ts` | W8-10〜W8-13 | 人数可変時の初期配置不整合を防止 |
| W8-15 | クロスシステム統合テストを追加（Detonate×侵食×死亡、床遷移×報酬蓄積、途中参加/再接続×勝敗） | `src/server/sim/integration/explosion-erosion-death.integration.spec.ts` / `src/server/sim/integration/floor-reward-flow.integration.spec.ts` / `src/server/sim/integration/session-join-reconnect.integration.spec.ts` | W7全タスク, W8-5〜W8-7 | 残仕様の主要相互作用を自動検証できる |
| W8-16 | 最終検証Wave（typecheck/build/test + 目視QAシナリオ）を実行可能な形で固定 | `package.json` / `docs/qa/final-mvp-checklist.md` / `.github/workflows/ci.yml` | W8-1〜W8-15 | MVP出荷判定を再現可能にする |

---

### 実装順サマリ（Wave 7-8）
1. `W7-1〜W7-4`（アイテム/報酬ループの完成）
2. `W7-5〜W7-8`（死亡/遷移/勝敗の仕様確定）
3. `W8-1〜W8-4`（UI/Audioの見える化）
4. `W8-5〜W8-7`（マルチプレイ残件）
5. `W8-8〜W8-14`（JSON完全化: 式・定義・ステージ・スポーン）
6. `W8-15〜W8-16`（統合テストと最終検証）
