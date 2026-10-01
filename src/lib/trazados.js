// Recorridos de las letras de la actividad Dibujar, en coordenadas del tablero (0 a 1).
// Sin React ni imports: lo usan la pantalla (src/pages/Dibujar.jsx) y el generador de las guías
// (scripts/generar-trazados.mjs), así el dibujo de la guía y el trazo aceptado no se desfasan.

export const START_POINT = { x: 0.13, y: 0.90 };
export const MID_POINT = { x: 0.45, y: 0.14 };
export const END_POINT = { x: 0.77, y: 0.90 };
export const HORIZONTAL_START_POINT = { x: 0.27, y: 0.69 };
export const HORIZONTAL_END_POINT = { x: 0.65, y: 0.69 };
export const E_START_POINT = { x: 0.32, y: 0.14 };
export const E_SECOND_POINT = { x: 0.32, y: 0.85 };
export const E_THIRD_POINT = { x: 0.76, y: 0.85 };
export const E_FOURTH_POINT = { x: 0.38, y: 0.14 };
export const E_FIFTH_POINT = { x: 0.75, y: 0.14 };
export const E_SIXTH_POINT = { x: 0.38, y: 0.48 };
export const E_SEVENTH_POINT = { x: 0.73, y: 0.48 };
// La i minúscula (trazadoI.svg): primero el palo de arriba hacia abajo y después se toca el punto.
export const I_START_POINT = { x: 0.5, y: 0.467 };
export const I_END_POINT = { x: 0.5, y: 0.826 };
export const I_DOT_POINT = { x: 0.5, y: 0.189 };
// La L (trazadoL.svg): un solo trazo en dos tramos sin soltar, baja el palo y dobla hacia la derecha.
export const L_START_POINT = { x: 0.273, y: 0.13 };
export const L_CORNER_POINT = { x: 0.273, y: 0.868 };
export const L_END_POINT = { x: 0.78, y: 0.868 };
// La T (trazadoT.svg): dos tramos sueltos, primero el palo vertical y después la barra de arriba.
// El palo arranca pegado a la barra (no en el corazón) para que los dos trazos se toquen.
export const T_VERTICAL_START = { x: 0.499, y: 0.16 };
export const T_VERTICAL_END = { x: 0.499, y: 0.89 };
export const T_HORIZONTAL_START = { x: 0.21, y: 0.129 };
export const T_HORIZONTAL_END = { x: 0.77, y: 0.129 };
// Curva cúbica de p0 a p3 (sin incluir p0), para redondear las puntas de arriba de la M.
export function cubicPoints(p0, c1, c2, p3, steps = 16) {
	return Array.from({ length: steps }, (_, index) => {
		const t = (index + 1) / steps;
		const u = 1 - t;
		return {
			x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
			y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
		};
	});
}

// La M (trazadoM.svg): un solo trazo sobre las líneas punteadas (sube, baja, sube, baja).
// Las dos puntas de arriba van redondeadas (las curvas arrancan y terminan sobre las líneas punteadas)
// y el pico de abajo termina en punta.
// Las puntas de arriba quedan bajas a propósito: el trazo es grueso y si suben más toca el borde de la letra.
export const M_START_POINT = { x: 0.143, y: 0.868 };
export const M_BOTTOM_POINT = { x: 0.52, y: 0.85 };
export const M_END_POINT = { x: 0.888, y: 0.899 };
// Cada punta: [inicio, control 1, control 2, fin] de una curva cúbica.
export const M_TOP_LEFT = [{ x: 0.2013, y: 0.33 }, { x: 0.21, y: 0.12 }, { x: 0.275, y: 0.12 }, { x: 0.3341, y: 0.33 }];
export const M_TOP_RIGHT = [{ x: 0.7051, y: 0.33 }, { x: 0.765, y: 0.12 }, { x: 0.84, y: 0.12 }, { x: 0.8392, y: 0.33 }];
export const M_WAYPOINTS = [
	M_START_POINT,
	M_TOP_LEFT[0],
	...cubicPoints(...M_TOP_LEFT),
	M_BOTTOM_POINT,
	M_TOP_RIGHT[0],
	...cubicPoints(...M_TOP_RIGHT),
	M_END_POINT,
];
export const M_TOLERANCE = 0.1;
// La O se traza sobre la elipse punteada de trazadoO.svg, en sentido antihorario desde arriba.
export const O_ELLIPSE = { cx: 0.499, cy: 0.52, rx: 0.327, ry: 0.361 };
export const O_START_POINT = { x: O_ELLIPSE.cx, y: O_ELLIPSE.cy - O_ELLIPSE.ry };
// Distancia radial permitida respecto del camino (1 = sobre la línea punteada).
export const O_MIN_RADIUS = 0.55;
export const O_MAX_RADIUS = 1.45;
// La U se traza sobre la línea punteada de trazadoU.svg: baja por la izquierda, curva abajo y sube por la derecha.
export const U_CURVE = { cx: 0.4985, cy: 0.587, rx: 0.273, ry: 0.278 };
export const U_TOP_Y = 0.142;
export const U_TOLERANCE = 0.1;
export const U_PATH = buildUPath();
export const U_START_POINT = U_PATH[0];
// Letras de tramos rectos que se trazan sin levantar el dedo entre tramo y tramo.
export const CONTINUOUS_LETTERS = ["L"];
// Avance del tramo a partir del cual se pasa solo al siguiente mientras se arrastra.
export const SEGMENT_AUTO_ADVANCE = 0.95;
// Máximo avance aceptado por movimiento en las letras curvas: impide saltar de golpe al final.
export const CURVE_MAX_STEP = 0.12;
// Cuánto se mira hacia adelante y hacia atrás sobre los caminos por puntos (U, S, M), en largo de tablero.
export const PATH_MAX_FORWARD = 0.12;
export const PATH_MAX_BACK = 0.06;
// Avance mínimo para dar el trazo curvo por completado.
export const CURVE_COMPLETE_PROGRESS = 0.97;

export function distance(first, second) {
	return Math.hypot(second.x - first.x, second.y - first.y);
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

export function getOPoint(progress) {
	const angle = -Math.PI / 2 - progress * 2 * Math.PI;
	return {
		x: O_ELLIPSE.cx + O_ELLIPSE.rx * Math.cos(angle),
		y: O_ELLIPSE.cy + O_ELLIPSE.ry * Math.sin(angle),
	};
}

// Devuelve el avance (0 a 1) que corresponde a un punto, o null si está lejos del camino.
export function getOProgress(point) {
	const dx = (point.x - O_ELLIPSE.cx) / O_ELLIPSE.rx;
	const dy = (point.y - O_ELLIPSE.cy) / O_ELLIPSE.ry;
	const radius = Math.hypot(dx, dy);
	if (radius < O_MIN_RADIUS || radius > O_MAX_RADIUS) return null;
	const turns = (-Math.PI / 2 - Math.atan2(dy, dx)) / (2 * Math.PI);
	return turns - Math.floor(turns);
}

// Avance hacia adelante (antihorario), dando la vuelta entre 1 y 0; null si el punto no sirve.
export function advanceO(progress, point) {
	const candidate = getOProgress(point);
	if (candidate === null) return null;
	const delta = (((candidate - progress) % 1) + 1) % 1;
	if (delta === 0 || delta > CURVE_MAX_STEP) return null;
	return Math.min(progress + delta, 1);
}

// Muestrea la U como una lista de puntos con su avance acumulado (0 a 1).
export function buildUPath() {
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
	return points.map((point, index) => ({ ...point, progress: lengths[index] / length, distance: lengths[index] }));
}

// Interpola un punto a lo largo de un camino muestreado (lista de puntos con .progress de 0 a 1).
export function getPathPoint(path, progress) {
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
// La ventana se mide sobre el largo del camino (no en %): así en las puntas de la M, donde la pata que
// sube y la diagonal que baja están pegadas, no se salta a la otra pata.
export function advancePath(path, progress, point, tolerance) {
	const current = progress * path[path.length - 1].distance;
	let best = null;
	for (const pathPoint of path) {
		const offset = pathPoint.distance - current;
		if (offset < -PATH_MAX_BACK || offset > PATH_MAX_FORWARD) continue;
		const gap = distance(pathPoint, point);
		if (gap <= tolerance && (!best || gap < best.gap)) {
			best = { progress: pathPoint.progress, gap };
		}
	}
	if (!best || best.progress <= progress) return null;
	return best.progress;
}

export function getUPoint(progress) {
	return getPathPoint(U_PATH, progress);
}

export function advanceU(progress, point) {
	return advancePath(U_PATH, progress, point, U_TOLERANCE);
}

// La S sigue los centros de los guiones de trazadoS.svg, desde el corazón hasta la flecha de abajo.
export const S_WAYPOINTS = [
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
export const S_TOLERANCE = 0.14;

// Punto de una curva Catmull-Rom entre p1 y p2 (p0 y p3 son los vecinos que dan la dirección).
export function catmullRom(p0, p1, p2, p3, t) {
	const t2 = t * t;
	const t3 = t2 * t;
	const axis = (key) => 0.5 * (
		2 * p1[key] +
		(p2[key] - p0[key]) * t +
		(2 * p0[key] - 5 * p1[key] + 4 * p2[key] - p3[key]) * t2 +
		(3 * p1[key] - p0[key] - 3 * p2[key] + p3[key]) * t3
	);
	return { x: axis("x"), y: axis("y") };
}

// Subdivide cada tramo (según su largo) para que el avance y el dibujo sean continuos entre punto y punto.
// Con smooth, los tramos se unen con una curva suave en lugar de rectas (la M los quiere rectos).
export function buildWaypointPath(waypoints, smooth = false) {
	const points = [waypoints[0]];
	for (let index = 1; index < waypoints.length; index += 1) {
		const from = waypoints[index - 1];
		const to = waypoints[index];
		const before = waypoints[index - 2] ?? from;
		const after = waypoints[index + 1] ?? to;
		const steps = Math.max(1, Math.ceil(distance(from, to) / 0.01));
		for (let step = 1; step <= steps; step += 1) {
			const ratio = step / steps;
			points.push(smooth
				? catmullRom(before, from, to, after, ratio)
				: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio });
		}
	}
	let length = 0;
	const lengths = points.map((point, index) => {
		if (index > 0) length += distance(points[index - 1], point);
		return length;
	});
	return points.map((point, index) => ({ ...point, progress: lengths[index] / length, distance: lengths[index] }));
}

export const S_PATH = buildWaypointPath(S_WAYPOINTS, true);
export const S_START_POINT = S_PATH[0];

export function getSPoint(progress) {
	return getPathPoint(S_PATH, progress);
}

export function advanceS(progress, point) {
	return advancePath(S_PATH, progress, point, S_TOLERANCE);
}

export const M_PATH = buildWaypointPath(M_WAYPOINTS);

export function getMPoint(progress) {
	return getPathPoint(M_PATH, progress);
}

export function advanceM(progress, point) {
	return advancePath(M_PATH, progress, point, M_TOLERANCE);
}

// Letras que se trazan siguiendo un camino curvo continuo en lugar de segmentos rectos.
export const CURVE_TRACES = {
	O: { start: O_START_POINT, getPoint: getOPoint, advance: advanceO },
	U: { start: U_START_POINT, getPoint: getUPoint, advance: advanceU, path: U_PATH },
	S: { start: S_START_POINT, getPoint: getSPoint, advance: advanceS, path: S_PATH },
	M: { start: M_PATH[0], getPoint: getMPoint, advance: advanceM, path: M_PATH },
};

// Usa siempre los mismos puntos fijos del camino (más el punto actual al final): si se remuestrea
// según el avance, en las esquinas de la M la línea corta distinto en cada movimiento y parece que vibra.
export function getCurveArcPoints(curve, progress) {
	const fixedPoints = curve.path
		? curve.path.filter((point) => point.progress < progress)
		: Array.from({ length: Math.ceil(progress * 120) }, (_, index) => curve.getPoint(index / 120));
	return [...fixedPoints, curve.getPoint(progress)]
		.map((point) => `${point.x * 100},${point.y * 100}`)
		.join(" ");
}

export function getLetterStart(letter) {
	const curve = CURVE_TRACES[letter];
	if (curve) return curve.start;
	const segmentStarts = { E: E_START_POINT, I: I_START_POINT, L: L_START_POINT, T: T_VERTICAL_START };
	return segmentStarts[letter] ?? START_POINT;
}

export function samePoint(first, second, tolerance = 0.08) {
	return distance(first, second) <= tolerance;
}
