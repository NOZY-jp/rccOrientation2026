## D3 Session Start
- Baseline: 74 tests pass, typecheck clean
- D1 core types: CellType (SAFE, MINE_SAFE, MINE_DANGER), GamePhase (PLAYING, GAME_OVER, FLOOR_CLEAR), GameState, BoardConfig, Player
- D1 core functions: generateBoard, revealCell, toggleFlag, checkWinCondition (all mutation-based, UI uses structuredClone)
- D2 patterns: PixiJS v8 + @pixi/react v8, useGameActions hook, camera hooks, keyboard/cursor hooks
- D3 adds: CellType WASTELAND+HOLE, Checkpoint type, GamePhase REST+NEXT_FLOOR+VICTORY, floor state machine
- Backward compatibility required: existing tests use generateBoard without CP config, must still work
- T3-1: CellType に WASTELAND='wasteland' と HOLE='hole' を追加しても既存 SAFE/MINE_SAFE/MINE_DANGER の値は維持
- T3-1: GameState 拡張は checkpoints/floorNumber/collectedCheckpoints を optional にして既存初期化コードの互換性を維持
- T3-1: Checkpoint 型は id/x/y/collected/detectedBy(Set<string>) 構成で src/core/types/checkpoint.ts に追加
- T3-1: 検証結果は vitest 77 passed / typecheck エラーなし

- T3-2: BoardConfig に checkPointCandidates?: boolean[][] と spawnPositions?: Array<{x:number;y:number}> を optional で追加し既存呼び出し互換を維持
- T3-2: placeCheckpoints(cells, candidates, seed) を追加し、候補=true かつ CellType.HOLE 以外のみを対象に seeded Fisher-Yates で決定的シャッフルして cp-0 連番IDを付与
- T3-2: generateBoard は checkPointCandidates 指定時のみ checkpoints を返却し、未指定時は従来どおり checkpoints なしで後方互換を維持
- T3-2: 検証結果は vitest 84 passed / typecheck エラーなし

- T3-3: detectCheckpoints(playerX, playerY, checkpoints, playerId, { detectionRadius }) を src/systems/checkpoint/checkpoint-service.ts に追加し、CP中心座標(x+0.5,y+0.5)で dist²=dx²+dy² を計算して dist²<=R² を検知条件にした（境界値を含む）
- T3-3: detect は未回収かつ未検知（detectedByにplayerIdなし）のCPのみ対象とし、検知時に detectedBy へ playerId を破壊的追加して新規検知CP配列を返す
- T3-3: collectCheckpoints(playerX, playerY, checkpoints) は Math.floor(playerX/Y) と cp.x/y の一致で未回収CPのみ回収し、checkpoint.collected=true を破壊的更新して collected 配列と allCollected を返す
- T3-3: テスト先行で checkpoint-detection.test.ts / checkpoint-collection.test.ts を追加し、範囲外/範囲内/境界値/浮動小数点/再検知防止/再回収防止/allCollected 判定を網羅
- T3-3: 検証結果は vitest 94 passed / typecheck エラーなし

- T3-4: GamePhase は既存値（PLAYING/GAME_OVER/FLOOR_CLEAR）を維持したまま REST/NEXT_FLOOR/VICTORY を追加し、既存 `checkWinCondition` の FLOOR_CLEAR 期待を壊さない拡張にした
- T3-4: `transitionPhase(state, trigger, config)` を純粋関数で追加し、`cp_all_collected` は floorNumber と totalFloors で FLOOR_CLEAR/VICTORY を分岐、`all_dead` は GAME_OVER、`timer_expired` は NEXT_FLOOR を返す
- T3-4: `executeFloorClear(state)` は破壊的更新で MINE_DANGER/MINE_SAFE を SAFE + adjacentMines=0 に変換し、全プレイヤー `isAlive=true`、`flags.clear()` を実施
- T3-4: `generateNextFloor(state, config)` は `seed + (state.floorNumber ?? 1)` で新盤面を生成して `floorNumber` を +1 した GameState を返す
- T3-4: 新規テスト `game-phase-extended.test.ts` / `floor-state-machine.test.ts` を追加し、日本語テスト名で遷移・クリア処理・次フロア生成を検証、最終結果は vitest 104 passed / typecheck clean

- T3-5: `checkWinCondition` は `state.phase===GAME_OVER` を最優先で返し、その後 `checkpoints?.length > 0` のときのみ CP 全回収判定を使うことで、CP未回収時は PLAYING、全回収時は floorNumber>=10 で VICTORY / それ以外 FLOOR_CLEAR を返す
- T3-5: 後方互換は「CPが `undefined` または `[]` の場合に従来の全安全セル開拓判定へフォールバック」で維持でき、D1既存 `win-lose.test.ts`（5件）を無変更で通過
- T3-5: 新規 `win-lose-updated.test.ts` で CPあり/未回収/10F勝利/空配列/undefined/GAME_OVER維持を日本語テスト名で検証し、全体結果は vitest 110 passed・typecheck clean
