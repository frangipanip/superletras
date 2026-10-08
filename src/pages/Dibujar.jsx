import { useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import {
	START_POINT,
	MID_POINT,
	END_POINT,
	HORIZONTAL_START_POINT,
	HORIZONTAL_END_POINT,
	E_START_POINT,
	E_SECOND_POINT,
	E_THIRD_POINT,
	E_FOURTH_POINT,
	E_FIFTH_POINT,
	E_SIXTH_POINT,
	E_SEVENTH_POINT,
	I_START_POINT,
	I_END_POINT,
	I_DOT_POINT,
	L_START_POINT,
	L_CORNER_POINT,
	L_END_POINT,
	T_VERTICAL_START,
	T_VERTICAL_END,
	T_HORIZONTAL_START,
	T_HORIZONTAL_END,
	CONTINUOUS_LETTERS,
	SEGMENT_AUTO_ADVANCE,
	CURVE_COMPLETE_PROGRESS,
	clamp,
	CURVE_TRACES,
	getCurveArcPoints,
	getLetterStart,
	samePoint,
} from "../lib/trazados";
import "./Dibujar.css";

const LETTERS = ["A", "E", "I", "O", "U", "L", "S", "T", "M"];
const ENABLED_LETTERS = ["A", "E", "I", "O", "U", "L", "S", "T", "M"];
// Letras del selector según la opción elegida en el menú del Mundo 1: vocales o solo esa consonante.
const LETTER_OPTIONS_BY_MENU = {
	a: ["A", "E", "I", "O", "U"],
	l: ["L"],
	m: ["M"],
	s: ["S"],
	t: ["T"],
};
// Guías vectoriales generadas desde los recorridos de src/lib/trazados.js (npm run trazados), para que coincidan.
const TRACE_IMAGES = Object.fromEntries(LETTERS.map((letter) => [letter, img(`trazado${letter}.svg`)]));
export default function Dibujar() {
	usePageTitle("Dibujar - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const [letterOptions] = useState(() => LETTER_OPTIONS_BY_MENU[menuOption] || LETTER_OPTIONS_BY_MENU.a);
	// Las vocales comparten un premio por completar el grupo; las consonantes premian su letra.
	const [premio, otorgarPremio] = useRecompensa("dibujar", LETTER_OPTIONS_BY_MENU[menuOption] ? menuOption : "a");
	const firstLetter = letterOptions[0];
	const [pointerPosition, setPointerPosition] = useState(() => getLetterStart(firstLetter));
	const [isDragging, setIsDragging] = useState(false);
	const [completed, setCompleted] = useState(false);
	// Tramo en curso: vive en un ref porque se lee y avanza dentro de los movimientos del dedo.
	const phaseRef = useRef(1);
	// Evita completar dos veces la letra si llegan más movimientos antes de re-renderizar.
	const strokeFinishedRef = useRef(false);
	const [drawnSegments, setDrawnSegments] = useState([]);
	const [draftSegment, setDraftSegment] = useState(null);
	const [activeLetter, setActiveLetter] = useState(firstLetter);
	const [showTargets, setShowTargets] = useState(true);
	const [curveProgress, setCurveProgress] = useState(0);
	const curveProgressRef = useRef(0);
	const completedVowelsRef = useRef(new Set());
	const rewardGrantedRef = useRef(false);
	// Avance (0 a 1) del segmento recto en curso; se conserva al soltar para continuar desde ahí.
	const segmentProgressRef = useRef(0);
	const boardRef = useRef(null);
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [celebrationAudio] = useState(() => runtime.audio(sound("Felicitaciones.mp3"), { preload: true }));
	const letter = activeLetter;
	const curve = CURVE_TRACES[activeLetter];

	function getBoardPoint(event) {
		const board = boardRef.current;
		if (!board) return START_POINT;
		const point = event?.touches?.[0] ?? event?.changedTouches?.[0] ?? event;
		const bounds = board.getBoundingClientRect();
		return {
			x: ((point?.clientX ?? 0) - bounds.left - board.clientLeft) / board.clientWidth,
			y: ((point?.clientY ?? 0) - bounds.top - board.clientTop) / board.clientHeight,
		};
	}

	// Corta "Felicitaciones" y evita que su final reinicie una letra que ya no está activa.
	function stopCelebration() {
		celebrationAudio.onended = null;
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
	}

	function awardCompletedLetter() {
		if (letterOptions.length === 1) {
			rewardGrantedRef.current = true;
			otorgarPremio(0, 3);
			return;
		}
		completedVowelsRef.current.add(activeLetter);
		if (completedVowelsRef.current.size === letterOptions.length && !rewardGrantedRef.current) {
			rewardGrantedRef.current = true;
			otorgarPremio(0, 3);
		}
	}

	function leaveActivity() {
		if (letterOptions.length > 1 && !rewardGrantedRef.current) {
			const completedCount = completedVowelsRef.current.size;
			const cantidad = completedCount >= 3 ? 2 : completedCount > 0 ? 1 : 0;
			if (cantidad > 0) {
				rewardGrantedRef.current = true;
				otorgarPremio(0, cantidad);
				return;
			}
		}
		window.history.back();
	}

	function resetActivity() {
		stopCelebration();
		setPointerPosition(getLetterStart(firstLetter));
		setIsDragging(false);
		setCompleted(false);
		changePhase(1);
		setDrawnSegments([]);
		setDraftSegment(null);
		segmentProgressRef.current = 0;
		updateCurveProgress(0);
		setActiveLetter(firstLetter);
		setShowTargets(true);
		stopTalking();
	}

	function switchLetter(nextLetter) {
		if (!ENABLED_LETTERS.includes(nextLetter) || !letterOptions.includes(nextLetter)) {
			return;
		}
		stopCelebration();
		stopTalking();
		setIsDragging(false);
		setActiveLetter(nextLetter);
		setShowTargets(true);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		changePhase(1);
		segmentProgressRef.current = 0;
		updateCurveProgress(0);
		setPointerPosition(getLetterStart(nextLetter));
	}

	function changePhase(nextPhase) {
		phaseRef.current = nextPhase;
	}

	function updateCurveProgress(progress) {
		curveProgressRef.current = progress;
		setCurveProgress(progress);
	}

	function restartCurve() {
		stopTalking();
		setShowTargets(true);
		setPointerPosition(curve.start);
		updateCurveProgress(0);
		setCompleted(false);
	}

	function moveCurvePointer(current) {
		const nextProgress = curve.advance(curveProgressRef.current, current);
		if (nextProgress === null) return;
		updateCurveProgress(nextProgress);
		setPointerPosition(curve.getPoint(nextProgress));
		// Al llegar al final se completa sin tener que soltar el dedo.
		if (nextProgress >= CURVE_COMPLETE_PROGRESS && !strokeFinishedRef.current) {
			strokeFinishedRef.current = true;
			setIsDragging(false);
			finishCurveDragging();
		}
	}

	function finishCurveDragging() {
		// Si se suelta antes de terminar, el trazo queda donde está para continuarlo.
		if (curveProgressRef.current < CURVE_COMPLETE_PROGRESS) return;
		updateCurveProgress(1);
		setPointerPosition(curve.start);
		setCompleted(true);
		awardCompletedLetter();
		startTalking();
		celebrationAudio.onended = () => {
			celebrationAudio.onended = null;
			celebrationAudio.pause();
			celebrationAudio.currentTime = 0;
			restartCurve();
		};
		celebrationAudio.currentTime = 0;
		celebrationAudio.play().catch(() => {
			celebrationAudio.onended = null;
			restartCurve();
		});
	}

	// Muestra la celebración y, al terminar (o si el audio falla), aplica el reinicio de la letra.
	function celebrateAndReset(onReset) {
		setCompleted(true);
		awardCompletedLetter();
		startTalking();
		const finish = () => {
			celebrationAudio.onended = null;
			celebrationAudio.pause();
			celebrationAudio.currentTime = 0;
			stopTalking();
			onReset();
		};
		celebrationAudio.onended = finish;
		celebrationAudio.currentTime = 0;
		celebrationAudio.play().catch(finish);
	}

	function restartL() {
		setShowTargets(true);
		setPointerPosition(L_START_POINT);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		changePhase(1);
	}

	function restartT() {
		setShowTargets(true);
		setPointerPosition(T_VERTICAL_START);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		changePhase(1);
	}

	function restartI() {
		stopTalking();
		setShowTargets(true);
		setPointerPosition(I_START_POINT);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		changePhase(1);
	}

	function tapIDot(point) {
		if (!samePoint(point, I_DOT_POINT, 0.12)) return;
		setCompleted(true);
		awardCompletedLetter();
		startTalking();
		celebrationAudio.onended = () => {
			celebrationAudio.onended = null;
			celebrationAudio.pause();
			celebrationAudio.currentTime = 0;
			restartI();
		};
		celebrationAudio.currentTime = 0;
		celebrationAudio.play().catch(() => {
			celebrationAudio.onended = null;
			restartI();
		});
	}

	function getCurrentSegment() {
		const phase = phaseRef.current;
		if (activeLetter === "I") {
			return { start: I_START_POINT, target: I_END_POINT };
		}
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
		if (activeLetter === "L") {
			if (phase === 1) {
				return { start: L_START_POINT, target: L_CORNER_POINT };
			}
			return { start: L_CORNER_POINT, target: L_END_POINT };
		}
		if (activeLetter === "T") {
			if (phase === 1) {
				return { start: T_VERTICAL_START, target: T_VERTICAL_END };
			}
			return { start: T_HORIZONTAL_START, target: T_HORIZONTAL_END };
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
		// En la i, después del palo alcanza con tocar el punto.
		if (activeLetter === "I" && phaseRef.current === 2) {
			tapIDot(point);
			event.preventDefault();
			return;
		}
		// Se retoma desde donde quedó el trazo (al principio, es el punto de inicio).
		if (!samePoint(point, pointerPosition, 0.12)) return;
		strokeFinishedRef.current = false;
		setIsDragging(true);
		if (typeof event?.pointerId !== "undefined") {
			boardRef.current?.setPointerCapture(event.pointerId);
		}
		event.preventDefault();
	}

	function movePointer(event) {
		if (!isDragging || completed) return;
		const current = getBoardPoint(event);
		if (curve) {
			moveCurvePointer(current);
			return;
		}
		const { start, target } = getCurrentSegment();
		const directionX = target.x - start.x;
		const directionY = target.y - start.y;
		const projected = (current.x - start.x) * directionX + (current.y - start.y) * directionY;
		const maxLengthSquared = directionX * directionX + directionY * directionY;
		if (maxLengthSquared === 0) return;
		// El trazo nunca retrocede: si el dedo vuelve atrás, se mantiene el avance logrado.
		const ratio = Math.max(clamp(projected / maxLengthSquared, 0, 1), segmentProgressRef.current);
		if (ratio === 0) return;
		segmentProgressRef.current = ratio;
		const nextPosition = {
			x: start.x + directionX * ratio,
			y: start.y + directionY * ratio,
		};
		setPointerPosition(nextPosition);
		setDraftSegment([start, nextPosition]);
		// L y M se hacen de una sola pasada: al llegar al final del tramo se sigue con el próximo sin soltar.
		if (CONTINUOUS_LETTERS.includes(activeLetter) && ratio >= SEGMENT_AUTO_ADVANCE && !strokeFinishedRef.current) {
			if (phaseRef.current === 2) {
				strokeFinishedRef.current = true;
				setIsDragging(false);
			}
			completeSegment(start, target);
		}
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
		if (curve) {
			setIsDragging(false);
			finishCurveDragging();
			return;
		}
		const { start, target } = getCurrentSegment();
		if (samePoint(pointerPosition, target, 0.1)) {
			completeSegment(start, target);
		}
		setIsDragging(false);
	}

	// Cierra el tramo actual: lo deja dibujado y pasa al siguiente o celebra la letra.
	function completeSegment(start, target) {
		const phase = phaseRef.current;
		segmentProgressRef.current = 0;
		setPointerPosition(target);
		setDrawnSegments((existing) => [...existing, [start, target]]);
		setDraftSegment(null);
		if (activeLetter === "I") {
			changePhase(2);
			setPointerPosition(I_DOT_POINT);
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
		} else if (activeLetter === "E") {
			if (phase === 1) {
				changePhase(2);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else if (phase === 2) {
				changePhase(3);
				setPointerPosition(E_FOURTH_POINT);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else if (phase === 3) {
				changePhase(4);
				setPointerPosition(E_SIXTH_POINT);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else if (phase === 4) {
				setCompleted(true);
				awardCompletedLetter();
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
					changePhase(1);
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
					changePhase(1);
				});
			}
		} else if (activeLetter === "L") {
			if (phase === 1) {
				changePhase(2);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else {
				celebrateAndReset(restartL);
			}
		} else if (activeLetter === "T") {
			if (phase === 1) {
				changePhase(2);
				setPointerPosition(T_HORIZONTAL_START);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else {
				celebrateAndReset(restartT);
			}
		} else if (phase === 1) {
			changePhase(2);
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
		} else if (phase === 2) {
			changePhase(3);
			setPointerPosition(HORIZONTAL_START_POINT);
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
		} else {
			setCompleted(true);
			awardCompletedLetter();
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
				changePhase(1);
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
				changePhase(1);
			});
		}
	}

	return (
		<div className="page activity-page page-dibujar">
			<BackButton onClick={leaveActivity} />
			<FullscreenButton toggle />
			<button className="dibujar-clear" type="button" onClick={resetActivity} aria-label="Reiniciar actividad">Limpiar</button>
			<main className="dibujar-layout">
				<div className="dibujar-workspace">
					<div className="dibujar-vowel-picker" aria-label="Selector de letras">
						{letterOptions.map((letter) => {
							const enabled = ENABLED_LETTERS.includes(letter);
							const selected = letter === activeLetter;
							return (
								<button
									key={letter}
									type="button"
									className={selected ? "dibujar-vowel-button selected" : "dibujar-vowel-button"}
									disabled={!enabled}
									onClick={() => switchLetter(letter)}
									aria-label={`Seleccionar letra ${letter}`}
								>
									{letter}
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
						<img className="dibujar-guide-image" src={TRACE_IMAGES[letter]} alt={`Guía para trazar la vocal ${letter}`} draggable={false} />
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
						{showTargets && activeLetter === "I" && (
							<>
								<div className="dibujar-point dibujar-point-start" style={{ left: `${I_START_POINT.x * 100}%`, top: `${I_START_POINT.y * 100}%` }}>1</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${I_DOT_POINT.x * 100}%`, top: `${I_DOT_POINT.y * 100}%` }}>2</div>
							</>
						)}
						{showTargets && activeLetter === "L" && (
							<>
								<div className="dibujar-point dibujar-point-start" style={{ left: `${L_START_POINT.x * 100}%`, top: `${L_START_POINT.y * 100}%` }}>1</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${L_CORNER_POINT.x * 100}%`, top: `${L_CORNER_POINT.y * 100}%` }}>2</div>
							</>
						)}
						{showTargets && activeLetter === "T" && (
							<>
								<div className="dibujar-point dibujar-point-start" style={{ left: `${T_VERTICAL_START.x * 100}%`, top: `${T_VERTICAL_START.y * 100}%` }}>1</div>
								<div className="dibujar-point dibujar-point-end" style={{ left: `${T_HORIZONTAL_START.x * 100}%`, top: `${T_HORIZONTAL_START.y * 100}%` }}>2</div>
							</>
						)}
						{showTargets && curve && (
							<div className="dibujar-point dibujar-point-start" style={{ left: `${curve.start.x * 100}%`, top: `${curve.start.y * 100}%` }}>1</div>
						)}
						<svg className="dibujar-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
							{activeLetter === "I" && completed && (
								<ellipse cx={I_DOT_POINT.x * 100} cy={I_DOT_POINT.y * 100} rx="7" ry="7" fill="#fc2cd2" />
							)}
							{curve && curveProgress > 0 && (
								<polyline
									points={getCurveArcPoints(curve, curveProgress)}
									fill="none"
									stroke="#fc2cd2"
									strokeWidth="10"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							)}
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
					</section>
				</div>
			</main>
			<Character character={character} mouth={mouth} />
			<PremioComida premio={premio} />
		</div>
	);
}
