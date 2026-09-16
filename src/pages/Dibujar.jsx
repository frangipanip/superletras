import { useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img, sound } from "../lib/assets";
import "./Dibujar.css";

const LETTERS = ["A"];
const TRACE_IMAGES = Object.fromEntries(LETTERS.map((letter) => [letter, img(`trazado${letter}.jpg`)]));
const START_POINT = { x: 0.13, y: 0.90 };
const MID_POINT = { x: 0.45, y: 0.14 };
const END_POINT = { x: 0.77, y: 0.90 };
const HORIZONTAL_START_POINT = { x: 0.27, y: 0.69 };
const HORIZONTAL_END_POINT = { x: 0.65, y: 0.69 };

function distance(first, second) {
	return Math.hypot(second.x - first.x, second.y - first.y);
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function samePoint(first, second, tolerance = 0.08) {
	return distance(first, second) <= tolerance;
}

export default function Dibujar() {
	usePageTitle("Dibujar - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const [pointerPosition, setPointerPosition] = useState(START_POINT);
	const [isDragging, setIsDragging] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [phase, setPhase] = useState(1);
	const [drawnSegments, setDrawnSegments] = useState([]);
	const boardRef = useRef(null);
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const letter = LETTERS[0];
	const phaseLabel = phase === 1 ? "1 a 2" : phase === 2 ? "2 a 3" : "4 a 5";

	function getBoardPoint(event) {
		if (!boardRef.current) return START_POINT;
		const point = event?.touches?.[0] ?? event?.changedTouches?.[0] ?? event;
		const bounds = boardRef.current.getBoundingClientRect();
		return {
			x: ((point?.clientX ?? 0) - bounds.left) / bounds.width,
			y: ((point?.clientY ?? 0) - bounds.top) / bounds.height,
		};
	}

	function resetActivity() {
		setPointerPosition(START_POINT);
		setIsDragging(false);
		setCompleted(false);
		setPhase(1);
		setDrawnSegments([]);
	}

	function startDragging(event) {
		if (completed) return;
		const point = getBoardPoint(event);
		const activeStart = phase === 1 ? START_POINT : phase === 2 ? MID_POINT : HORIZONTAL_START_POINT;
		if (!samePoint(point, activeStart, 0.12)) return;
		setIsDragging(true);
		setPointerPosition(point);
		if (typeof event?.pointerId !== "undefined") {
			boardRef.current?.setPointerCapture(event.pointerId);
		}
		event.preventDefault();
	}

	function movePointer(event) {
		if (!isDragging || completed) return;
		const current = getBoardPoint(event);
		const activeStart = phase === 1 ? START_POINT : phase === 2 ? MID_POINT : HORIZONTAL_START_POINT;
		const activeTarget = phase === 1 ? MID_POINT : phase === 2 ? END_POINT : HORIZONTAL_END_POINT;
		const directionX = activeTarget.x - activeStart.x;
		const directionY = activeTarget.y - activeStart.y;
		const projected = (current.x - activeStart.x) * directionX + (current.y - activeStart.y) * directionY;
		const maxLengthSquared = directionX * directionX + directionY * directionY;
		if (projected <= 0) {
			setPointerPosition(activeStart);
			setDrawnSegments((existing) => {
				if (phase === 3) return existing;
				if (phase === 1 || phase === 2) {
					return existing;
				}
				const next = [...existing];
				if (next.length === 0) return next;
				next[next.length - 1] = [activeStart, activeStart];
				return next;
			});
			return;
		}
		const ratio = clamp(projected / maxLengthSquared, 0, 1);
		const nextPosition = {
			x: activeStart.x + directionX * ratio,
			y: activeStart.y + directionY * ratio,
		};
		setPointerPosition(nextPosition);
		setDrawnSegments((existing) => {
			if (phase === 3) {
				return [...existing, [activeStart, nextPosition]];
			}
			const next = [...existing];
			if (phase === 1) {
				return existing.length > 0 ? [...existing.slice(0, -1), [activeStart, nextPosition]] : [[activeStart, nextPosition]];
			}
			if (phase === 2) {
				if (next.length === 0) next.push([activeStart, nextPosition]);
				else next[next.length - 1] = [activeStart, nextPosition];
				return next;
			}
			if (next.length === 0) next.push([activeStart, nextPosition]);
			else next[next.length - 1] = [activeStart, nextPosition];
			return next;
		});
	}

	function finishDragging(event) {
		const pointerId = event?.pointerId;
		if (boardRef.current && typeof pointerId !== "undefined") {
			try {
				boardRef.current.releasePointerCapture(pointerId);
			} catch {
				// Ignorar si el elemento no tenía capturado el puntero.
			}
		}

		if (!isDragging) return;
		const activeStart = phase === 1 ? START_POINT : phase === 2 ? MID_POINT : HORIZONTAL_START_POINT;
		const activeTarget = phase === 1 ? MID_POINT : phase === 2 ? END_POINT : HORIZONTAL_END_POINT;

		if (samePoint(pointerPosition, activeTarget, 0.1)) {
			setPointerPosition(activeTarget);
			setDrawnSegments((existing) => {
				const next = [...existing];
				if (phase === 1) {
					next.push([activeStart, activeTarget]);
				} else if (phase === 2) {
					if (next.length === 0) next.push([activeStart, activeTarget]);
					else next[next.length - 1] = [activeStart, activeTarget];
				} else {
					if (next.length === 0) next.push([activeStart, activeTarget]);
					else next[next.length - 1] = [activeStart, activeTarget];
				}
				return next;
			});
			if (phase === 1) {
				setPhase(2);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else if (phase === 2) {
				setPhase(3);
				setPointerPosition(HORIZONTAL_START_POINT);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else {
				setCompleted(true);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			}
		} else {
			setPointerPosition(activeStart);
			setDrawnSegments((existing) => {
				if (phase === 3) return existing;
				if (phase === 1 || phase === 2) return existing;
				const next = [...existing];
				if (next.length === 0) return next;
				next[next.length - 1] = [activeStart, activeStart];
				return next;
			});
		}
		setIsDragging(false);
	}

	return (
		<div className="page activity-page page-dibujar">
			<BackButton />
			<FullscreenButton toggle />
			<button className="dibujar-clear" type="button" onClick={resetActivity} aria-label="Reiniciar actividad">Limpiar</button>
			<main className="dibujar-layout">
				<section
					className="dibujar-board"
					ref={boardRef}
					onPointerDown={startDragging}
					onPointerMove={movePointer}
					onPointerUp={finishDragging}
					onPointerCancel={finishDragging}
					onPointerLeave={finishDragging}
					onTouchStart={startDragging}
					onTouchMove={movePointer}
					onTouchEnd={finishDragging}
					onTouchCancel={finishDragging}
					aria-label={`Trazar la vocal ${letter}`}
				>
					<img className="dibujar-guide-image" src={TRACE_IMAGES[letter]} alt={`Guía para trazar la vocal ${letter}`} draggable={false} />
					<div className="dibujar-step" aria-live="polite">{letter} · Punto {phaseLabel}</div>
					<div className="dibujar-point dibujar-point-start" style={{ left: `${START_POINT.x * 100}%`, top: `${START_POINT.y * 100}%` }}>1</div>
					<div className="dibujar-point dibujar-point-end" style={{ left: `${MID_POINT.x * 100}%`, top: `${MID_POINT.y * 100}%` }}>2</div>
					<div className="dibujar-point dibujar-point-end" style={{ left: `${END_POINT.x * 100}%`, top: `${END_POINT.y * 100}%` }}>3</div>
					<div className="dibujar-point dibujar-point-end" style={{ left: `${HORIZONTAL_START_POINT.x * 100}%`, top: `${HORIZONTAL_START_POINT.y * 100}%` }}>4</div>
					<div className="dibujar-point dibujar-point-end" style={{ left: `${HORIZONTAL_END_POINT.x * 100}%`, top: `${HORIZONTAL_END_POINT.y * 100}%` }}>5</div>
					<svg className="dibujar-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
						{drawnSegments.map((segment, index) => (
							<line
								key={`${segment[0].x}-${segment[0].y}-${segment[1].x}-${segment[1].y}-${index}`}
								x1={segment[0].x * 100}
								y1={segment[0].y * 100}
								x2={segment[1].x * 100}
								y2={segment[1].y * 100}
								stroke="#fc2cd2"
								strokeWidth="10"
								strokeLinecap="round"
							/>
						))}
					</svg>
					<img
						className="dibujar-cursor"
						src={img("puntero.png")}
						alt="Puntero"
						draggable={false}
						style={{ left: `${pointerPosition.x * 100}%`, top: `${pointerPosition.y * 100}%` }}
						aria-hidden="true"
					/>
				</section>
			</main>
			<Character character={character} />
		</div>
	);
}
