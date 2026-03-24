# 00-overview Learnings

## 2026-03-24 Session Start
- Project is a fresh repo with only docs/ and test/ (HTML sketch)
- No package.json, no src/, no build tooling exists yet
- Game: "Detonator" - a cooperative minesweeper variant with 10 domains (D1-D10)
- Architecture: Pure TypeScript core, React+PixiJS UI, Colyseus transport later
- First domain D1 (01-playable-minesweeper) needs vitest, react, vite
- Test files colocated with source: `foo.ts` + `foo.test.ts`
- No monorepo - single package, `src/` for everything

## プロジェクト基盤セットアップ完了 (2026-03-24)

### 作成したファイル
- `package.json`: npm scriptsと依存関係定義
  - scripts: `test`, `test:watch`, `typecheck`, `dev`, `build`
  - devDependencies: `typescript`, `vitest`, `@types/node`, `vite`
  - type: "module" (ES Modules使用)
- `tsconfig.json`: strict mode有効、ES2022ターゲット、bundler module resolution
- `vitest.config.ts`: src/と tests/配下の *.test.ts を検出
- `.gitignore`: node_modules, dist, .sisyphus/evidence, .env
- `src/core/types/index.ts`: CellType, Cell, Player, GameState型定義
- `tests/setup.test.ts`: 型読み込み確認用の基本テスト

### ディレクトリ構造
すべてのディレクトリに `.gitkeep` を配置済み:
- `src/core/{types,board,player,rules}/`
- `src/systems/{erosion,detonate,explosion,checkpoint,progression,items}/`
- `src/transport/{server,client}/`
- `src/ui/`, `src/config/`, `tests/`

### 型定義の要点
- CellType: 'safe_cell' | 'mine_safe' | 'mine_danger' | 'wasteland' | 'hole'
- Direction8: 8方向（Dig/Flag操作用）
- Direction4: 4方向（地雷除去機用）
- Player: 連続座標（x, y: number）+ AABBコリジョン（width, height）
- GameState: board, players, currentFloor, seed, timestamp

### 検証結果
- `npm run typecheck`: ✅ PASS (exit 0)
- `npm run test`: ✅ PASS (1 test passed)
- LSP diagnostics: ✅ 0 errors (情報レベルのimport整列提案のみ)

### 注意事項
- bunコマンドが未インストールのためnpmで代替
- React/Vite依存は未インストール（D1で追加予定）
- 型定義は最小限（実装ロジックなし）

## TypeScript設定修正 (2026-03-24)

### 問題
`tsconfig.json` に `"rootDir": "src"` と `"include": ["src/**/*", "tests/**/*"]` が両立していた。
TypeScriptは rootDir 配下にすべてのファイルがあることを期待するため、tests/ が範囲外となりエラー:
```
error TS6059: File 'tests/setup.test.ts' is not under 'rootDir' 'src'.
```

### 解決策
`"rootDir": "src"` 行を削除。TypeScriptは include で指定されたファイル群の共通ルートを自動的に rootDir として扱う。
`"outDir": "dist"` のみでビルド出力先は十分に制御可能。

### 検証結果
- `npx tsc --noEmit`: ✅ PASS (exit 0, no output)
- `npx vitest run`: ✅ PASS (1 test passed)

### 学び
- rootDir は明示的に指定せず、include/exclude による暗黙的な推論に任せる方が柔軟
- src/ と tests/ を両方含める構成では rootDir 指定は不要

## [2026-03-24] D0: プロジェクト基盤セットアップ完了

### 完了内容
- `bun init` でプロジェクト初期化
- package.json に scripts 追加（test, typecheck, dev, build）
- tsconfig.json を strict mode + ES2022 + bundler に設定
- vitest.config.ts でテストファイルパターン設定
- ディレクトリ構造（rules.md §7）を完全作成
- src/core/types/index.ts にコア型定義を作成
  - CellType: 'safe_cell' | 'mine_safe' | 'mine_danger' | 'wasteland' | 'hole'
  - Player: 連続座標（x, y: number）+ AABB（width, height）
  - Direction8, Direction4, Direction, GameState
- .gitignore に .sisyphus/evidence を追加
- tests/setup.test.ts でテストインフラ確認

### 検証結果
- ✅ `bun run typecheck` → exit 0
- ✅ `bun run test` → 1 passed

### 重要な決定事項
- **tsconfig.json の rootDir 設定なし**: `"rootDir": "src"` を設定すると、tests/ を include した際に TS6059 エラーが発生するため、rootDir は指定しない
- **bun コマンド実行時は mise 有効化必須**: すべての bun コマンドは `eval "$(mise activate bash)" && bun ...` で実行
- **テスト配置パターン**: Pattern A（colocated `*.test.ts`）と Pattern B（`__tests__/` dir）の両方を許容。プロジェクト内で一貫させる

### 次のステップ（D1）
- React, Vite, PixiJS 等のランタイム依存をインストール
- 基本的なマインスイーパーゲームロジックを実装
- 人間目視確認（ブラウザでプレイ可能な状態）
