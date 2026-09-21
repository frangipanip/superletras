import { useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
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
// La i minúscula (trazadoI.jpg): primero el palo de arriba hacia abajo y después se toca el punto.
const I_START_POINT = { x: 0.5, y: 0.467 };
const I_END_POINT = { x: 0.5, y: 0.826 };
const I_DOT_POINT = { x: 0.5, y: 0.189 };
// La L (trazadoL.jpg): un solo trazo en dos tramos sin soltar, baja el palo y dobla hacia la derecha.
const L_START_POINT = { x: 0.273, y: 0.13 };
const L_CORNER_POINT = { x: 0.273, y: 0.868 };
const L_END_POINT = { x: 0.78, y: 0.868 };
// La T (trazadoT.jpg): dos tramos sueltos, primero el palo vertical y después la barra de arriba.
// El palo arranca pegado a la barra (no en el corazón) para que los dos trazos se toquen.
const T_VERTICAL_START = { x: 0.499, y: 0.16 };
const T_VERTICAL_END = { x: 0.499, y: 0.89 };
const T_HORIZONTAL_START = { x: 0.21, y: 0.129 };
const T_HORIZONTAL_END = { x: 0.77, y: 0.129 };
// La M (trazadoM.jpg): cuatro tramos (sube, baja, sube, baja). En la imagen cada tramo arranca
// un poco corrido del final del anterior, así que al terminar uno el puntero salta al inicio del siguiente.
const M_SEGMENTS = [
	[{ x: 0.142, y: 0.9 }, { x: 0.221, y: 0.13 }],
	[{ x: 0.281, y: 0.16 }, { x: 0.503, y: 0.86 }],
	[{ x: 0.536, y: 0.86 }, { x: 0.748, y: 0.18 }],
	[{ x: 0.822, y: 0.13 }, { x: 0.889, y: 0.9 }],
];
const M_START_POINT = M_SEGMENTS[0][0];
// La O se traza sobre la elipse punteada de trazadoO.jpg, en sentido antihorario desde arriba.
const O_ELLIPSE = { cx: 0.499, cy: 0.52, rx: 0.327, ry: 0.361 };
const O_START_POINT = { x: O_ELLIPSE.cx, y: O_ELLIPSE.cy - O_ELLIPSE.ry };
// Distancia radial permitida respecto del camino (1 = sobre la línea punteada).
const O_MIN_RADIUS = 0.55;
const O_MAX_RADIUS = 1.45;
// La U se traza sobre la línea punteada de trazadoU.jpg: baja por la izquierda, curva abajo y sube por la derecha.
const U_CURVE = { cx: 0.4985, cy: 0.587, rx: 0.273, ry: 0.278 };
const U_TOP_Y = 0.142;
const U_TOLERANCE = 0.1;
const U_PATH = buildUPath();
const U_START_POINT = U_PATH[0];
// Máximo avance aceptado por movimiento en las letras curvas: impide saltar de golpe al final.
const CURVE_MAX_STEP = 0.12;
// Avance mínimo para dar el trazo curvo por completado.
const CURVE_COMPLETE_PROGRESS = 0.97;

function distance(first, second) {
	return Math.hypot(second.x - first.x, second.y - first.y);
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function getOPoint(progress) {
	const angle = -Math.PI / 2 - progress * 2 * Math.PI;
	return {
		x: O_ELLIPSE.cx + O_ELLIPSE.rx * Math.cos(angle),
		y: O_ELLIPSE.cy + O_ELLIPSE.ry * Math.sin(angle),
	};
}

// Devuelve el avance (0 a 1) que corresponde a un punto, o null si está lejos del camino.
function getOProgress(point) {
	const dx = (point.x - O_ELLIPSE.cx) / O_ELLIPSE.rx;
	const dy = (point.y - O_ELLIPSE.cy) / O_ELLIPSE.ry;
	const radius = Math.hypot(dx, dy);
	if (radius < O_MIN_RADIUS || radius > O_MAX_RADIUS) return null;
	const turns = (-Math.PI / 2 - Math.atan2(dy, dx)) / (2 * Math.PI);
	return turns - Math.floor(turns);
}

// Avance hacia adelante (antihorario), dando la vuelta entre 1 y 0; null si el punto no sirve.
function advanceO(progress, point) {
	const candidate = getOProgress(point);
	if (candidate === null) return null;
	const delta = (((candidate - progress) % 1) + 1) % 1;
	if (delta === 0 || delta > CURVE_MAX_STEP) return null;
	return Math.min(progress + delta, 1);
}

// Muestrea la U como una lista de puntos con su avance acumulado (0 a 1).
function buildUPath() {
	const left = U_CURVE.cx - U_CURVE.rx;
	const right = U_CURVE.cx + U_CURVE.rx;
	const lineSteps = 40;
	const curveSteps = 80;
	const points = [];
	for (let index = 0; index < lineSteps; index += 1) {
		points.push({ x: left, y: U_TOP_Y + ((U_CURVE.cy - U_TOP_Y) * index) / lineSteps });
	}
	for (let index = 0; index <= curveSteps; index += 1) {
		const angle = Math.PI - (Math.PI * index) / curveSteps;
		points.push({ x: U_CURVE.cx + U_CURVE.rx * Math.cos(angle), y: U_CURVE.cy + U_CURVE.ry * Math.sin(angle) });
	}
	for (let index = 1; index <= lineSteps; index += 1) {
		points.push({ x: right, y: U_CURVE.cy - ((U_CURVE.cy - U_TOP_Y) * index) / lineSteps });
	}
	let length = 0;
	const lengths = points.map((point, index) => {
		if (index > 0) length += distance(points[index - 1], point);
		return length;
	});
	return points.map((point, index) => ({ ...point, progress: lengths[index] / length }));
}

// Interpola un punto a lo largo de un camino muestreado (lista de puntos con .progress de 0 a 1).
function getPathPoint(path, progress) {
	const nextIndex = path.findIndex((point) => point.progress >= progress);
	if (nextIndex <= 0) return nextIndex === 0 ? path[0] : path[path.length - 1];
	const previous = path[nextIndex - 1];
	const next = path[nextIndex];
	const ratio = (progress - previous.progress) / (next.progress - previous.progress);
	return {
		x: previous.x + (next.x - previous.x) * ratio,
		y: previous.y + (next.y - previous.y) * ratio,
	};
}

// Toma el punto del camino más cercano al dedo, mirando solo un poco atrás y adelante del avance actual.
function advancePath(path, progress, point, tolerance) {
	let best = null;
	for (const pathPoint of path) {
		if (Math.abs(pathPoint.progress - progress) > CURVE_MAX_STEP) continue;
		const gap = distance(pathPoint, point);
		if (gap <= tolerance && (!best || gap < best.gap)) {
			best = { progress: pathPoint.progress, gap };
		}
	}
	if (!best || best.progress <= progress) return null;
	return best.progress;
}

function getUPoint(progress) {
	return getPathPoint(U_PATH, progress);
}

function advanceU(progress, point) {
	return advancePath(U_PATH, progress, point, U_TOLERANCE);
}

// La S sigue los centros de los guiones de trazadoS.jpg, desde el corazón hasta la flecha de abajo.
const S_WAYPOINTS = [
	{ x: 0.745, y: 0.245 },
	{ x: 0.725, y: 0.205 },
	{ x: 0.695, y: 0.178 },
	{ x: 0.655, y: 0.152 },
	{ x: 0.6, y: 0.126 },
	{ x: 0.519, y: 0.117 },
	{ x: 0.439, y: 0.125 },
	{ x: 0.364, y: 0.156 },
	{ x: 0.305, y: 0.213 },
	{ x: 0.281, y: 0.29 },
	{ x: 0.301, y: 0.37 },
	{ x: 0.358, y: 0.426 },
	{ x: 0.432, y: 0.459 },
	{ x: 0.509, y: 0.48 },
	{ x: 0.59, y: 0.5 },
	{ x: 0.665, y: 0.528 },
	{ x: 0.728, y: 0.579 },
	{ x: 0.762, y: 0.653 },
	{ x: 0.76, y: 0.734 },
	{ x: 0.722, y: 0.804 },
	{ x: 0.659, y: 0.853 },
	{ x: 0.581, y: 0.88 },
	{ x: 0.5, y: 0.885 },
	{ x: 0.42, y: 0.869 },
	{ x: 0.348, y: 0.832 },
	{ x: 0.275, y: 0.735 },
];
const S_TOLERANCE = 0.1;

// Subdivide cada tramo para que el avance y el dibujo sean continuos entre guion y guion.
function buildSPath() {
	const stepsPerSegment = 8;
	const points = [S_WAYPOINTS[0]];
	for (let index = 1; index < S_WAYPOINTS.length; index += 1) {
		const from = S_WAYPOINTS[index - 1];
		const to = S_WAYPOINTS[index];
		for (let step = 1; step <= stepsPerSegment; step += 1) {
			const ratio = step / stepsPerSegment;
			points.push({ x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio });
		}
	}
	let length = 0;
	const lengths = points.map((point, index) => {
		if (index > 0) length += distance(points[index - 1], point);
		return length;
	});
	return points.map((point, index) => ({ ...point, progress: lengths[index] / length }));
}

const S_PATH = buildSPath();
const S_START_POINT = S_PATH[0];

function getSPoint(progress) {
	return getPathPoint(S_PATH, progress);
}

function advanceS(progress, point) {
	return advancePath(S_PATH, progress, point, S_TOLERANCE);
}

// Letras que se trazan siguiendo un camino curvo continuo en lugar de segmentos rectos.
const CURVE_TRACES = {
	O: { start: O_START_POINT, getPoint: getOPoint, advance: advanceO },
	U: { start: U_START_POINT, getPoint: getUPoint, advance: advanceU },
	S: { start: S_START_POINT, getPoint: getSPoint, advance: advanceS },
};

function getCurveArcPoints(curve, progress) {
	const steps = Math.max(1, Math.ceil(progress * 120));
	return Array.from({ length: steps + 1 }, (_, index) => {
		const point = curve.getPoint((progress * index) / steps);
		return `${point.x * 100},${point.y * 100}`;
	}).join(" ");
}

function getLetterStart(letter) {
	const curve = CURVE_TRACES[letter];
	if (curve) return curve.start;
	const segmentStarts = { E: E_START_POINT, I: I_START_POINT, L: L_START_POINT, T: T_VERTICAL_START, M: M_START_POINT };
	return segmentStarts[letter] ?? START_POINT;
}

function samePoint(first, second, tolerance = 0.08) {
	return distance(first, second) <= tolerance;
}

export default function Dibujar() {
	usePageTitle("Dibujar - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const [letterOptions] = useState(() => LETTER_OPTIONS_BY_MENU[menuOption] || LETTER_OPTIONS_BY_MENU.a);
	const firstLetter = letterOptions[0];
	const [pointerPosition, setPointerPosition] = useState(() => getLetterStart(firstLetter));
	const [isDragging, setIsDragging] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [phase, setPhase] = useState(1);
	const [drawnSegments, setDrawnSegments] = useState([]);
	const [draftSegment, setDraftSegment] = useState(null);
	const [activeLetter, setActiveLetter] = useState(firstLetter);
	const [showTargets, setShowTargets] = useState(true);
	const [curveProgress, setCurveProgress] = useState(0);
	const curveProgressRef = useRef(0);
	// Avance (0 a 1) del segmento recto en curso; se conserva al soltar para continuar desde ahí.
	const segmentProgressRef = useRef(0);
	const boardRef = useRef(null);
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [celebrationAudio] = useState(() => runtime.audio(sound("Felicitaciones.m4a"), { preload: true }));
	const letter = activeLetter;
	const curve = CURVE_TRACES[activeLetter];

	function getBoardPoint(event) {
		if (!boardRef.current) return START_POINT;
		const point = event?.touches?.[0] ?? event?.changedTouches?.[0] ?? event;
		const bounds = boardRef.current.getBoundingClientRect();
		return {
			x: ((point?.clientX ?? 0) - bounds.left) / bounds.width,
			y: ((point?.clientY ?? 0) - bounds.top) / bounds.height,
		};
	}

	// Corta "Felicitaciones" y evita que su final reinicie una letra que ya no está activa.
	function stopCelebration() {
		celebrationAudio.onended = null;
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
	}

	function resetActivity() {
		stopCelebration();
		setPointerPosition(getLetterStart(firstLetter));
		setIsDragging(false);
		setCompleted(false);
		setPhase(1);
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
		setPhase(1);
		segmentProgressRef.current = 0;
		updateCurveProgress(0);
		setPointerPosition(getLetterStart(nextLetter));
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
	}

	function finishCurveDragging() {
		// Si se suelta antes de terminar, el trazo queda donde está para continuarlo.
		if (curveProgressRef.current < CURVE_COMPLETE_PROGRESS) return;
		updateCurveProgress(1);
		setPointerPosition(curve.start);
		setCompleted(true);
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
		setPhase(1);
	}

	function restartT() {
		setShowTargets(true);
		setPointerPosition(T_VERTICAL_START);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		setPhase(1);
	}

	function restartM() {
		setShowTargets(true);
		setPointerPosition(M_START_POINT);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		setPhase(1);
	}

	function restartI() {
		stopTalking();
		setShowTargets(true);
		setPointerPosition(I_START_POINT);
		setDrawnSegments([]);
		setDraftSegment(null);
		setCompleted(false);
		setPhase(1);
	}

	function tapIDot(point) {
		if (!samePoint(point, I_DOT_POINT, 0.12)) return;
		setCompleted(true);
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
		if (activeLetter === "M") {
			const segment = M_SEGMENTS[Math.min(Math.max(phase - 1, 0), M_SEGMENTS.length - 1)];
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
		// En la i, después del palo alcanza con tocar el punto.
		if (activeLetter === "I" && phase === 2) {
			tapIDot(point);
			event.preventDefault();
			return;
		}
		// Se retoma desde donde quedó el trazo (al principio, es el punto de inicio).
		if (!samePoint(point, pointerPosition, 0.12)) return;
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
			segmentProgressRef.current = 0;
			setPointerPosition(target);
			setDrawnSegments((existing) => [...existing, [start, target]]);
			setDraftSegment(null);
			if (activeLetter === "I") {
				setPhase(2);
				setPointerPosition(I_DOT_POINT);
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
			} else if (activeLetter === "E") {
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
			} else if (activeLetter === "L") {
				if (phase === 1) {
					setPhase(2);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else {
					celebrateAndReset(restartL);
				}
			} else if (activeLetter === "T") {
				if (phase === 1) {
					setPhase(2);
					setPointerPosition(T_HORIZONTAL_START);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else {
					celebrateAndReset(restartT);
				}
			} else if (activeLetter === "M") {
				if (phase < M_SEGMENTS.length) {
					setPhase(phase + 1);
					setPointerPosition(M_SEGMENTS[phase][0]);
					correctAudio.currentTime = 0;
					correctAudio.play().catch(() => {});
				} else {
					celebrateAndReset(restartM);
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
						{showTargets && activeLetter === "M" && M_SEGMENTS.map(([segmentStart], index) => (
							<div
								key={index}
								className={index === 0 ? "dibujar-point dibujar-point-start" : "dibujar-point dibujar-point-end"}
								style={{ left: `${segmentStart.x * 100}%`, top: `${segmentStart.y * 100}%` }}
							>
								{index + 1}
							</div>
						))}
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
		</div>
	);
}
