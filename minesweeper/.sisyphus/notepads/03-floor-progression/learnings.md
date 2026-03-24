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
