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
