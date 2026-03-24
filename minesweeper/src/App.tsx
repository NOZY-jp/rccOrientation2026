import { useEffect } from "react";
import { GameBoard } from "./ui/GameBoard";
import { GameStatus } from "./ui/GameStatus";
import { CameraContainer } from "./ui/pixi/camera/CameraContainer";
import { useCamera } from "./ui/pixi/camera/useCamera";
import { CELL_SIZE, GRID_PADDING } from "./ui/pixi/constants";
import { GridInteraction } from "./ui/pixi/grid/GridInteraction";
import { useGameActions } from "./ui/pixi/grid/useGameActions";
import { PixiCanvas } from "./ui/pixi/PixiCanvas";

const DEFAULT_CONFIG = { width: 9, height: 9, mineCount: 10, seed: 42 };
const PIXI_VIEWPORT_WIDTH = 600;
const PIXI_VIEWPORT_HEIGHT = 400;

export default function App() {
	const {
		state,
		handleReveal,
		handleFlag,
		handleNewGame,
		flagCount,
		mineCount,
	} = useGameActions(DEFAULT_CONFIG);
	const pixiWidth = PIXI_VIEWPORT_WIDTH;
	const pixiHeight = PIXI_VIEWPORT_HEIGHT;
	const boardWidth = state.width * CELL_SIZE + GRID_PADDING * 2;
	const boardHeight = state.height * CELL_SIZE + GRID_PADDING * 2;
	const {
		camera,
		handleWheel,
		handlePanStart,
		handlePanMove,
		handlePanEnd,
		resetCamera,
	} = useCamera();

	useEffect(() => {
		resetCamera(boardWidth, boardHeight, pixiWidth, pixiHeight);
	}, [boardHeight, boardWidth, resetCamera]);

	useEffect(() => {
		document.body.style.backgroundColor = "#2a2a2a";
		document.body.style.margin = "0";
		document.body.style.display = "flex";
		document.body.style.justifyContent = "center";
		document.body.style.alignItems = "center";
		document.body.style.minHeight = "100vh";
	}, []);

	return (
		<div
			style={{
				fontFamily: "monospace",
				display: "flex",
				flexDirection: "column",
				gap: "20px",
			}}
		>
			<h1 style={{ color: "white", textAlign: "center", margin: 0 }}>
				Minesweeper
			</h1>
			<GameStatus
				phase={state.phase}
				mineCount={mineCount}
				flagCount={flagCount}
				onNewGame={handleNewGame}
			/>
			<GameBoard
				state={state}
				onCellClick={handleReveal}
				onCellRightClick={handleFlag}
			/>
			<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
				<GameStatus
					phase={state.phase}
					mineCount={mineCount}
					flagCount={flagCount}
					onNewGame={handleNewGame}
				/>
				<span
					style={{ color: "#cbd5e1", fontSize: "14px", textAlign: "center" }}
				>
					PixiJS Canvas (D2 setup)
				</span>
				<PixiCanvas
					width={pixiWidth}
					height={pixiHeight}
					preventContextMenu
					onCameraWheel={handleWheel}
					onCameraPanStart={handlePanStart}
					onCameraPanMove={handlePanMove}
					onCameraPanEnd={handlePanEnd}
				>
					<CameraContainer camera={camera}>
						<GridInteraction
							state={state}
							onReveal={handleReveal}
							onFlag={handleFlag}
						/>
					</CameraContainer>
				</PixiCanvas>
			</div>
		</div>
	);
}
