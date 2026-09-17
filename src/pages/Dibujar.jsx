import { useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import "./Dibujar.css";

const LETTERS = ["A", "E"];
const VOWEL_OPTIONS = ["A", "E", "I", "O", "U"];
const TRACE_IMAGES = Object.fromEntries(LETTERS.map((letter) => [letter, img(`trazado${letter}.jpg`)]));
const START_POINT = { x: 0.13, y: 0.90 };
const MID_POINT = { x: 0.45, y: 0.14 };
const END_POINT = { x: 0.77, y: 0.90 };
const HORIZONTAL_START_POINT = { x: 0.27, y: 0.69 };
const HORIZONTAL_END_POINT = { x: 0.65, y: 0.69 };
const E_START_POINT = { x: 0.32, y: 0.14 };
const E_SECOND_POINT = { x: 0.32, y: 0.85 };
const E_THIRD_POINT = { x: 0.76, y: 0.85 };
const E_FOURTH_POINT = { x: 0.38, y: 0.14 };
const E_FIFTH_POINT = { x: 0.75, y: 0.14 };
const E_SIXTH_POINT = { x: 0.38, y: 0.48 };
const E_SEVENTH_POINT = { x: 0.73, y: 0.48 };

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
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [pointerPosition, setPointerPosition] = useState(START_POINT);
	const [isDragging, setIsDragging] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [phase, setPhase] = useState(1);
	const [drawnSegments, setDrawnSegments] = useState([]);
	const [draftSegment, setDraftSegment] = useState(null);
	const [activeLetter, setActiveLetter] = useState("A");
	const [showTargets, setShowTargets] = useState(true);
	const activeEStart = E_START_POINT;
	const boardRef = useRef(null);
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [celebrationAudio] = useState(() => runtime.audio(sound("Felicitaciones.m4a"), { preload: true }));
	const letter = activeLetter;
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
		setDraftSegment(null);
		setActiveLetter("A");
		setShowTargets(true);
		stopTalking();
	}

	function switchLetter(nextLetter) {
		if (!["A", "E"].includes(nextLetter)) {
			return;
		}
		stopTalking();
		setIsDragging(false);
		setActiveLetter(nextLetter);
		setShowTargets(true);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		setPhase(1);
		setPointerPosition(nextLetter === "E" ? E_START_POINT : START_POINT);
	}

	function getCurrentSegment() {
		if (activeLetter === "E") {
			const eSegments = [
				[E_START_POINT, E_SECOND_POINT],
				[E_SECOND_POINT, E_THIRD_POINT],
				[E_FOURTH_POINT, E_FIFTH_POINT],
				[E_SIXTH_POINT, E_SEVENTH_POINT],
			];
			const segment = eSegments[Math.min(Math.max(phase - 1, 0), eSegments.length - 1)];
			return { start: segment[0], target: segment[1] };
		}

		if (phase === 1) {
			return { start: START_POINT, target: MID_POINT };
		}
		if (phase === 2) {
			return { start: MID_POINT, target: END_POINT };
		}
		return { start: HORIZONTAL_START_POINT, target: HORIZONTAL_END_POINT };
	}

	function startDragging(event) {
		if (completed) return;
		const point = getBoardPoint(event);
		const { start } = getCurrentSegment();
		if (!samePoint(point, start, 0.12)) return;
		setIsDragging(true);
		setDraftSegment(null);
		setPointerPosition(point);
		if (typeof event?.pointerId !== "undefined") {
			boardRef.current?.setPointerCapture(event.pointerId);
		}
		event.preventDefault();
	}

	function movePointer(event) {
		if (!isDragging || completed) return;
		const current = getBoardPoint(event);
		const { start, target } = getCurrentSegment();
		const directionX = target.x - start.x;
		const directionY = target.y - start.y;
		const projected = (current.x - start.x) * directionX + (current.y - start.y) * directionY;
		const maxLengthSquared = directionX * directionX + directionY * directionY;
		if (projected <= 0 || maxLengthSquared === 0) {
			setPointerPosition(start);
			setDraftSegment(null);
			return;
		}
		const ratio = clamp(projected / maxLengthSquared, 0, 1);
		const nextPosition = {
			x: start.x + directionX * ratio,
			y: start.y + directionY * ratio,
		};
		setPointerPosition(nextPosition);
		setDraftSegment([start, nextPosition]);
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
		const { start, target } = getCurrentSegment();

		if (samePoint(pointerPosition, target, 0.1)) {
			setPointerPosition(target);
			setDrawnSegments((existing) => [...existing, [start, target]]);
			setDraftSegment(null);
			if (activeLetter === "E") {
				if (phase === 1) {
					setPhase(2);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else if (phase === 2) {
					setPhase(3);
					setPointerPosition(E_FOURTH_POINT);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else if (phase === 3) {
					setPhase(4);
					setPointerPosition(E_SIXTH_POINT);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else if (phase === 4) {
					setCompleted(true);
					startTalking();
					celebrationAudio.onended = () => {
						celebrationAudio.onended = null;
						celebrationAudio.pause();
						celebrationAudio.currentTime = 0;
						stopTalking();
						setShowTargets(true);
						setPointerPosition(E_START_POINT);
						setDrawnSegments([]);
						setDraftSegment(null);
						setCompleted(false);
						setPhase(1);
					};
					celebrationAudio.currentTime = 0;
					celebrationAudio.play().catch(() => {
						celebrationAudio.onended = null;
						stopTalking();
						setShowTargets(true);
						setPointerPosition(E_START_POINT);
						setDrawnSegments([]);
						setDraftSegment(null);
						setCompleted(false);
						setPhase(1);
					});
				}
			} else if (phase === 1) {
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
				startTalking();
				celebrationAudio.onended = () => {
					celebrationAudio.onended = null;
					celebrationAudio.pause();
					celebrationAudio.currentTime = 0;
					stopTalking();
					setActiveLetter("E");
					setShowTargets(true);
					setPointerPosition(E_START_POINT);
					setDrawnSegments([]);
					setDraftSegment(null);
					setCompleted(false);
					setPhase(1);
				};
				celebrationAudio.currentTime = 0;
				celebrationAudio.play().catch(() => {
					celebrationAudio.onended = null;
					stopTalking();
					setActiveLetter("E");
					setShowTargets(true);
					setPointerPosition(E_START_POINT);
					setDrawnSegments([]);
					setDraftSegment(null);
					setCompleted(false);
					setPhase(1);
				});
			}
		} else {
			setPointerPosition(start);
			setDraftSegment(null);
		}
		setIsDragging(false);
	}

	return (
		<div className="page activity-page page-dibujar">
			<BackButton />
			<FullscreenButton toggle />
			<button className="dibujar-clear" type="button" onClick={resetActivity} aria-label="Reiniciar actividad">Limpiar</button>
			<main className="dibujar-layout">
				<div className="dibujar-workspace">
					<div className="dibujar-vowel-picker" aria-label="Selector de vocales">
						{VOWEL_OPTIONS.map((vowel) => {
							const enabled = vowel === "A" || vowel === "E";
							const selected = vowel === activeLetter;
							return (
								<button
									key={vowel}
									type="button"
									className={selected ? "dibujar-vowel-button selected" : "dibujar-vowel-button"}
									disabled={!enabled}
									onClick={() => switchLetter(vowel)}
									aria-label={`Seleccionar vocal ${vowel}`}
								>
									{vowel}
								</button>
							);
						})}
					</div>
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
						{activeLetter === "A" && (
							<>
								<img className="dibujar-guide-image" src={TRACE_IMAGES[letter]} alt={`Guía para trazar la vocal ${letter}`} draggable={false} />
								<div className="dibujar-step" aria-live="polite">{letter} · Punto {phaseLabel}</div>
							</>
						)}
						{activeLetter === "E" && (
							<img className="dibujar-guide-image" src={TRACE_IMAGES[letter]} alt={`Guía para trazar la vocal ${letter}`} draggable={false} />
						)}
						{showTargets && activeLetter === "A" && (
							<>
								<div className="dibujar-point dibujar-point-start" style={{ left: `${START_POINT.x * 100}%`, top: `${START_POINT.y * 100}%` }}>1</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${MID_POINT.x * 100}%`, top: `${MID_POINT.y * 100}%` }}>2</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${END_POINT.x * 100}%`, top: `${END_POINT.y * 100}%` }}>3</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${HORIZONTAL_START_POINT.x * 100}%`, top: `${HORIZONTAL_START_POINT.y * 100}%` }}>4</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${HORIZONTAL_END_POINT.x * 100}%`, top: `${HORIZONTAL_END_POINT.y * 100}%` }}>5</div>
							</>
						)}
						{showTargets && activeLetter === "E" && (
							<>
								<div className="dibujar-point dibujar-point-start" style={{ left: `${E_START_POINT.x * 100}%`, top: `${E_START_POINT.y * 100}%` }}>1</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_SECOND_POINT.x * 100}%`, top: `${E_SECOND_POINT.y * 100}%` }}>2</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_THIRD_POINT.x * 100}%`, top: `${E_THIRD_POINT.y * 100}%` }}>3</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_FOURTH_POINT.x * 100}%`, top: `${E_FOURTH_POINT.y * 100}%` }}>4</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_FIFTH_POINT.x * 100}%`, top: `${E_FIFTH_POINT.y * 100}%` }}>5</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_SIXTH_POINT.x * 100}%`, top: `${E_SIXTH_POINT.y * 100}%` }}>6</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${E_SEVENTH_POINT.x * 100}%`, top: `${E_SEVENTH_POINT.y * 100}%` }}>7</div>
							</>
						)}
						<svg className="dibujar-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
							{[...drawnSegments, ...(draftSegment ? [draftSegment] : [])].map((segment, index) => (
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
				</div>
			</main>
			<Character character={character} mouth={mouth} />
		</div>
	);
}
