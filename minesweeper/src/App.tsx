import { useCallback, useEffect, useRef, useState } from "react";
import { GameBoard } from "./ui/GameBoard";
import { GameStatus } from "./ui/GameStatus";
import { useCursor } from "./ui/input/useCursor";
import { useKeyboardInput } from "./ui/input/useKeyboardInput";
import { ActionButtons } from "./ui/mobile/ActionButtons";
import { VirtualJoystick } from "./ui/mobile/VirtualJoystick";
import "./ui/mobile/mobile-controls.css";
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
	const [isMobile, setIsMobile] = useState(false);
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
 const { cursor, moveCursor } = useCursor(4, 4);
 const joystickDirectionRef = useRef({ x: 0, y: 0 });

 const handleDigAtCursor = useCallback(() => {
  handleReveal(cursor.x, cursor.y);
 }, [cursor.x, cursor.y, handleReveal]);

 const handleFlagAtCursor = useCallback(() => {
  handleFlag(cursor.x, cursor.y);
 }, [cursor.x, cursor.y, handleFlag]);

 const handleDetonateAtCursor = useCallback(() => {
  return;
 }, []);

 useKeyboardInput({
  onDig: handleDigAtCursor,
  onFlag: handleFlagAtCursor,
  onDetonate: handleDetonateAtCursor,
  onMoveUp: () => moveCursor(0, -1, state.width, state.height),
  onMoveDown: () => moveCursor(0, 1, state.width, state.height),
  onMoveLeft: () => moveCursor(-1, 0, state.width, state.height),
  onMoveRight: () => moveCursor(1, 0, state.width, state.height),
  enabled: !isMobile,
 });

	const handleDirectionChange = useCallback((x: number, y: number) => {
		joystickDirectionRef.current = { x, y };
	}, []);

	const handleDirectionEnd = useCallback(() => {
		joystickDirectionRef.current = { x: 0, y: 0 };
	}, []);

 const handleMobileDig = useCallback(() => {
  handleDigAtCursor();
 }, [handleDigAtCursor]);

 const handleMobileFlag = useCallback(() => {
  handleFlagAtCursor();
 }, [handleFlagAtCursor]);

 const handleMobileDetonate = useCallback(() => {
  handleDetonateAtCursor();
 }, [handleDetonateAtCursor]);

	useEffect(() => {
		resetCamera(boardWidth, boardHeight, pixiWidth, pixiHeight);
	}, [boardHeight, boardWidth, resetCamera]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		if (typeof window.matchMedia !== "function") {
			setIsMobile("ontouchstart" in window);
			return;
		}

		const mediaQuery = window.matchMedia("(max-width: 768px)");

		const updateMobile = () => {
			setIsMobile("ontouchstart" in window || mediaQuery.matches);
		};

		updateMobile();
		mediaQuery.addEventListener("change", updateMobile);

		return () => {
			mediaQuery.removeEventListener("change", updateMobile);
		};
	}, []);

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
       cursorPosition={cursor}
       onReveal={handleReveal}
       onFlag={handleFlag}
      />
					</CameraContainer>
				</PixiCanvas>
			</div>
			{isMobile ? (
				<>
					<VirtualJoystick
						onDirectionChange={handleDirectionChange}
						onDirectionEnd={handleDirectionEnd}
					/>
					<ActionButtons
						onDig={handleMobileDig}
						onFlag={handleMobileFlag}
						onDetonate={handleMobileDetonate}
					/>
				</>
			) : null}
		</div>
	);
}
