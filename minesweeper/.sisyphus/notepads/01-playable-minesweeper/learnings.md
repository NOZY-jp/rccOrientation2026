# 01-playable-minesweeper Learnings

## 2026-03-24 Session Start
- Inheriting from 00-overview: bun via mise, jj for VCS, strict TS
- Existing: package.json (bun scripts), tsconfig.json, vitest.config.ts, core type stubs
- D1 scope: standard minesweeper, 2 cell types (safe/mine), React UI
- D1 adds: react, react-dom, @vitejs/plugin-react, vite, zod
- bun prefix: `eval "$(mise activate bash)" && bun ...`
- tsconfig: no rootDir (avoids TS6059), need DOM lib for React
- Cell types in D1: SAFE, MINE_SAFE, MINE_DANGER only (wasteland/hole = D3+)
- Vite + React 足場は `dev: vite` / `build: vite build` に切り替えると `index.html` エントリで起動できる
- React 19 + TypeScript では `@types/react` / `@types/react-dom` がないと `react/jsx-runtime` の型解決で typecheck が失敗する
- `src/main.tsx` では `getElementById('root')` の null を明示的に検査して non-null assertion を避けると lint 互換を維持できる
- T1-2 では `src/core/types/index.ts` を re-export ハブ化し、`Direction8/Direction4/Direction` は index に残したまま `cell.ts` / `player.ts` / `game.ts` へ分割すると plan の責務分離に一致する
- `CellType` は D1 時点で enum の3値（`safe`, `mine_safe`, `mine_danger`）に限定し、`safe_cell` など旧stub値をテスト/型注釈から除去する必要がある
- `tests/setup.test.ts` は `CellType` enum 参照（`CellType.SAFE`）へ更新しても `../src/core/types/index.ts` import 経路を維持すれば既存のセットアップ検証を継続できる
- strict + `noUncheckedIndexedAccess` 下では `split(',')` の分割結果をデフォルト付き分割代入で受けると `string | undefined` エラーを回避できる

## 2026-03-24 T1-3 盤面生成
- `createSeededRandom` は xorshift32 で実装し、`seed=0` のときは固定の非0初期値へフォールバックすると乱数列停止を防げる
- `generateBoard` は全セルを `MINE_SAFE` + `adjacentMines: 0` で初期化し、seed乱数で選んだユニーク座標のみ `MINE_DANGER` に切り替えると仕様に一致する
- 決定性テストは「セルtype配列 + ソート済み mines Set」のシグネチャ比較にすると、Map/Set参照差異を避けつつ盤面同一性を確認できる

## 2026-03-24 T1-4 セル開拓 + flood-fill
- `countAdjacentMines(state, x, y)` は 8近傍を二重ループで走査し、境界チェック後に `CellType.MINE_DANGER` のみ加算すると仕様どおりになる
- `revealCell` は `MINE_DANGER` 直撃時に `phase = GAME_OVER` を即時反映し、`MINE_SAFE` は `SAFE` に変換して `adjacentMines` を設定する
- flood-fill は再帰ではなくBFSキューで実装し、「隣接地雷数が0のセルだけを次展開する」ことで過剰展開を防げる
- 旗セルは開始セル判定だけでなくBFS近傍展開時にも除外すると、連鎖開拓で旗が剥がれない挙動を保証できる

## 2026-03-24 T1-5 フラグ設置/解除
- `toggleFlag(state, x, y)` は `flags` の `","` 形式キー（実体は ```${x},${y}```）を直接トグルし、設置時のみ `true`、解除と無効操作は `false` に統一すると仕様確認がしやすい
- `SAFE` は開拓済みセルとして扱いフラグ不可、`MINE_SAFE` / `MINE_DANGER` のみフラグ対象に限定すると `Cell` へ `isFlagged` を増やさず `GameState.flags` だけで状態管理できる
- strict + `noUncheckedIndexedAccess` ではテスト側も non-null assertion を避け、座標アクセス用ヘルパーで `undefined` を明示チェックすると Biome 警告を回避しつつ可読性を維持できる

## 2026-03-24 T1-6 勝敗判定（プロトタイプ）
- `checkWinCondition` は公開APIを維持しつつ内部で `checkWinConditionPrototype` を呼ぶ構成にすると、D3の `checkWinByCheckpoints()` 置き換え時に移行しやすい
- 暫定判定は `cell.type` のみを基準にし、`MINE_DANGER` 以外で `SAFE` になっていないセル数を集計すると「旗だけ立てた未開拓セル」を正しく未達成として扱える
- `GAME_OVER` の不変条件を先頭で返すようにすると、既に敗北確定した状態を再評価で上書きしないことをテストで保証できる
