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
