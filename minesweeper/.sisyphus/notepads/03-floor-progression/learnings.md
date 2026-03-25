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
- T3-6: UI層への統合において、useGameActions の handleReveal を拡張し、revealCell 後に detectCheckpoints と collectCheckpoints を連続呼び出しし、allCollected 時は transitionPhase と executeFloorClear で state を直接更新する構造にした
- T3-6: PixiJS での CP 描画は GridRenderer に `<pixiGraphics>` を追加し、cp.x/y * CELL_SIZE + GRID_PADDING でセルに合わせた座標に円やチェックマークを fill/stroke する方式で @pixi/react に合わせた
- T3-6: フロア遷移のアニメーションは React の DOM レイヤーに FloorClearOverlay と RestPhaseScreen を実装し、useEffect と setTimeout/setInterval を使って auto-transition し、onNext / onTimeout コールバックで useGameActions の REST / NEXT_FLOOR 遷移関数を叩く構成にした
- T3-6: 最終検証結果は vitest 116 passed / typecheck clean。既存の D1 プレーンUI と D2 Pixi Canvas 両方に影響せず進行できる状態を達成

## D7 向け CP可視化仕様（ユーザー明言）
- **D3の現状**: `handleReveal` 内で `detectCheckpoints` を呼ぶ（掘ったら検知）→ **D7で変更予定**
- **D7での仕様**: CP検知は「連続移動プレイヤー（D7追加）が近づいたら」トリガーされる。掘るかどうかは関係ない
- **フェード遷移**: 検出範囲（detectionRadius）を中間値として、+-0.5マスで不透明度が変化する
  - `detectionRadius = 3` の場合:
    - 距離 3.5 で表示開始（opacity = 0）
    - 距離 3.0 で opacity = 0.5
    - 距離 2.5 以下で opacity = 1.0（最大不透明度）
  - 離れたら逆にフェードアウトして消える
- **実装時の注意**: 現在の `detectCheckpoints` は閾値判定（dist² ≤ R²）のON/OFFのみ。D7では連続的な距離ベースのopacity計算が必要。`detectedBy` Set方式ではなく、毎フレーム距離を計算してopacityを決めるリアルタイム描画に変更することになる
