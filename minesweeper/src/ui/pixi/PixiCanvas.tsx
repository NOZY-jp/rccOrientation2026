import { extend, Application as Stage } from "@pixi/react";
import { Graphics, Text } from "pixi.js";
import { type ReactNode, useEffect, useRef } from "react";

extend({ Graphics, Text });

interface PixiCanvasProps {
	width: number;
	height: number;
	children?: ReactNode;
	preventContextMenu?: boolean;
	onCameraWheel?: (deltaY: number) => void;
	onCameraPanStart?: () => void;
	onCameraPanMove?: (deltaX: number, deltaY: number) => void;
	onCameraPanEnd?: () => void;
}

function getTouchDistance(
	points: Map<number, { x: number; y: number }>,
): number | null {
	const touches = Array.from(points.values());
	const first = touches[0];
	const second = touches[1];

	if (first === undefined || second === undefined) {
		return null;
	}

	return Math.hypot(first.x - second.x, first.y - second.y);
}

export function PixiCanvas({
	width,
	height,
	children,
	preventContextMenu = false,
	onCameraWheel,
	onCameraPanStart,
	onCameraPanMove,
	onCameraPanEnd,
}: PixiCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const dragPointerRef = useRef<number | null>(null);
	const lastPointerRef = useRef({ x: 0, y: 0 });
	const touchPointsRef = useRef<Map<number, { x: number; y: number }>>(
		new Map(),
	);
	const pinchDistanceRef = useRef<number | null>(null);

	useEffect(() => {
		if (!preventContextMenu) {
			return;
		}

		const node = containerRef.current;
		if (node === null) {
			return;
		}

		const handleContextMenu = (event: MouseEvent) => {
			event.preventDefault();
		};

		node.addEventListener("contextmenu", handleContextMenu);

		return () => {
			node.removeEventListener("contextmenu", handleContextMenu);
		};
	}, [preventContextMenu]);

	useEffect(() => {
		const node = containerRef.current;
		if (node === null) {
			return;
		}

		const previousTouchAction = node.style.touchAction;
		node.style.touchAction = "none";

		const handleWheel = (event: WheelEvent) => {
			if (onCameraWheel === undefined) {
				return;
			}

			event.preventDefault();
			onCameraWheel(event.deltaY);
		};

		const handlePointerDown = (event: PointerEvent) => {
			if (event.pointerType === "touch") {
				touchPointsRef.current.set(event.pointerId, {
					x: event.clientX,
					y: event.clientY,
				});
				if (touchPointsRef.current.size === 2) {
					pinchDistanceRef.current = getTouchDistance(touchPointsRef.current);
				}
				return;
			}

			if (event.button !== 1 && event.button !== 2) {
				return;
			}

			dragPointerRef.current = event.pointerId;
			lastPointerRef.current = { x: event.clientX, y: event.clientY };
			onCameraPanStart?.();
			event.preventDefault();
		};

		const handlePointerMove = (event: PointerEvent) => {
			if (event.pointerType === "touch") {
				if (!touchPointsRef.current.has(event.pointerId)) {
					return;
				}

				touchPointsRef.current.set(event.pointerId, {
					x: event.clientX,
					y: event.clientY,
				});
				if (touchPointsRef.current.size !== 2 || onCameraWheel === undefined) {
					return;
				}

				const distance = getTouchDistance(touchPointsRef.current);
				const previousDistance = pinchDistanceRef.current;

				if (distance === null || previousDistance === null) {
					pinchDistanceRef.current = distance;
					return;
				}

				const delta = previousDistance - distance;
				if (Math.abs(delta) >= 2) {
					onCameraWheel(delta);
				}

				pinchDistanceRef.current = distance;
				event.preventDefault();
				return;
			}

			if (dragPointerRef.current !== event.pointerId) {
				return;
			}

			const deltaX = event.clientX - lastPointerRef.current.x;
			const deltaY = event.clientY - lastPointerRef.current.y;
			lastPointerRef.current = { x: event.clientX, y: event.clientY };
			onCameraPanMove?.(deltaX, deltaY);
			event.preventDefault();
		};

		const handlePointerEnd = (event: PointerEvent) => {
			if (event.pointerType === "touch") {
				touchPointsRef.current.delete(event.pointerId);
				if (touchPointsRef.current.size < 2) {
					pinchDistanceRef.current = null;
				}
				return;
			}

			if (dragPointerRef.current !== event.pointerId) {
				return;
			}

			dragPointerRef.current = null;
			onCameraPanEnd?.();
			event.preventDefault();
		};

		node.addEventListener("wheel", handleWheel, { passive: false });
		node.addEventListener("pointerdown", handlePointerDown);
		node.addEventListener("pointermove", handlePointerMove);
		node.addEventListener("pointerup", handlePointerEnd);
		node.addEventListener("pointercancel", handlePointerEnd);

		return () => {
			node.style.touchAction = previousTouchAction;
			node.removeEventListener("wheel", handleWheel);
			node.removeEventListener("pointerdown", handlePointerDown);
			node.removeEventListener("pointermove", handlePointerMove);
			node.removeEventListener("pointerup", handlePointerEnd);
			node.removeEventListener("pointercancel", handlePointerEnd);
		};
	}, [onCameraPanEnd, onCameraPanMove, onCameraPanStart, onCameraWheel]);

	return (
		<div ref={containerRef}>
			<Stage width={width} height={height} backgroundColor={0x1a1a2e} antialias>
				{children}
			</Stage>
		</div>
	);
}
