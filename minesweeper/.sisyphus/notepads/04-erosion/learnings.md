## D4 Session Start
- Baseline: 116 tests pass, typecheck clean
- D3成果物: CellType(WASTELAND, HOLE), Checkpoint, GamePhase(6 values), floor state machine
- D4スコープ: 侵食スケジューラ, BFS前線探索, 侵食実行, パイプライン統合, UI統合
- 依存関係: T4-1 || T4-2 → T4-3 → T4-4 → T4-5
- 注意: src/core/board/ 既存関数シグネチャは変更不可（拡張のみ）
- 注意: CPは侵食で消滅しない（仕様確定）
- 注意: cellPalette.ts は既存か新規か要確認

## T4-1 Learnings
- 新規侵食モジュールは `src/systems/erosion/` 配下で完結させ、型定義 (`erosion-types.ts`) とスケジューラ (`erosion-scheduler.ts`) を分離するとテストしやすい。
- スケジューラ更新は純関数にし、`currentTime` と `GamePhase` を入力にして `warningsToExecute` を返す設計にすると `setTimeout` 不要で決定的に検証できる。
- `pendingWarnings` の重複排除は `x,y` 文字列キーの `Set` で実装すると簡潔で、既存 warningExpiry を壊さずに新規警告だけ追加できる。

## T4-2 Learnings
- frontline抽出は「`SAFE | WASTELAND` かつ 8近傍に `MINE_SAFE | MINE_DANGER` が1つ以上」の条件を走査順（y→x）で判定すると、選択順序の決定性を維持しやすい。
- 侵食対象選択は BFS 拡張中に候補を `Set/Map` で重複管理し、最終返却だけを走査順ソートして `power` 件に切ると、方向順依存の揺らぎを抑えて仕様の固定順序を満たせる。
- `noUncheckedIndexedAccess` 前提では `cells[y][x]` を直接参照せず、`getCell()` ヘルパ経由で安全化すると core/test の両方で型エラーを防げる。
