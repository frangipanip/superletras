// Recorridos de las letras de la actividad Dibujar. Cada letra (glifo) es una lista de trazos en
// orden; cada trazo es una lista de puntos que el dedo recorre sin volver atrás (se puede soltar y
// seguir desde donde quedó) o un punto para tocar (el de la i, los de la Ü).
// Coordenadas de cada letra: 0 a 1 de alto, en la misma unidad a lo ancho (una celda cuadrada).
// La guía que se ve (contorno, línea punteada y flechas) se dibuja con estos mismos recorridos
// (src/components/GuiaTrazado.jsx), así lo que se ve y lo que acepta el dedo no se desfasan.

const ARRIBA = 0.13;
const ABAJO = 0.87;
const MEDIO = 0.5;

export function distance(first, second) {
	return Math.hypot(second.x - first.x, second.y - first.y);
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

const p = (x, y) => ({ x, y });

// Arco de elipse de `desde` a `hasta` (grados; 0 = derecha, 90 = abajo, la pantalla tiene la y hacia abajo).
function arco(cx, cy, rx, ry, desde, hasta, pasos = 28) {
	return Array.from({ length: pasos + 1 }, (_, index) => {
		const angulo = ((desde + ((hasta - desde) * index) / pasos) * Math.PI) / 180;
		return p(cx + rx * Math.cos(angulo), cy + ry * Math.sin(angulo));
	});
}

// Curva cúbica de p0 a p3 (sin incluir p0), para redondear las puntas de arriba de la M.
function cubicPoints(p0, c1, c2, p3, steps = 16) {
	return Array.from({ length: steps }, (_, index) => {
		const t = (index + 1) / steps;
		const u = 1 - t;
		return {
			x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
			y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
		};
	});
}

// Punto de una curva Catmull-Rom entre p1 y p2 (p0 y p3 son los vecinos que dan la dirección).
function catmullRom(p0, p1, p2, p3, t) {
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

// Subdivide cada tramo (según su largo) en puntos cada 0,01 con su avance acumulado (0 a 1) y
// su distancia desde el principio. Con suave, los tramos se unen con una curva en lugar de rectas.
export function buildWaypointPath(waypoints, suave = false) {
	const points = [waypoints[0]];
	for (let index = 1; index < waypoints.length; index += 1) {
		const from = waypoints[index - 1];
		const to = waypoints[index];
		const before = waypoints[index - 2] ?? from;
		const after = waypoints[index + 1] ?? to;
		const steps = Math.max(1, Math.ceil(distance(from, to) / 0.01));
		for (let step = 1; step <= steps; step += 1) {
			const ratio = step / steps;
			points.push(suave
				? catmullRom(before, from, to, after, ratio)
				: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio });
		}
	}
	let length = 0;
	const lengths = points.map((point, index) => {
		if (index > 0) length += distance(points[index - 1], point);
		return length;
	});
	return points.map((point, index) => ({ ...point, progress: length ? lengths[index] / length : 1, distance: lengths[index] }));
}

// ---- Letras de Mundo 1 (los mismos recorridos que tenían sus guías trazado<Letra>.svg) ----

// La M: sube, baja, sube, baja; las dos puntas de arriba redondeadas y bajas a propósito (el trazo
// es grueso y si suben más toca el borde de la letra).
const M_TOP_LEFT = [p(0.2013, 0.33), p(0.21, 0.12), p(0.275, 0.12), p(0.3341, 0.33)];
const M_TOP_RIGHT = [p(0.7051, 0.33), p(0.765, 0.12), p(0.84, 0.12), p(0.8392, 0.33)];
const M_PUNTOS = [
	p(0.143, 0.868),
	M_TOP_LEFT[0],
	...cubicPoints(...M_TOP_LEFT),
	p(0.52, 0.85),
	M_TOP_RIGHT[0],
	...cubicPoints(...M_TOP_RIGHT),
	p(0.888, 0.899),
];

// La O: elipse en sentido antihorario desde arriba.
const O_PUNTOS = arco(0.499, 0.52, 0.327, 0.361, -90, -450, 96);

// La U: baja por la izquierda, curva abajo y sube por la derecha.
const U_PUNTOS = [p(0.2255, 0.142), p(0.2255, 0.587), ...arco(0.4985, 0.587, 0.273, 0.278, 180, 0), p(0.7715, 0.142)];

// La S sigue los centros de los guiones de su guía, desde arriba a la derecha hasta abajo a la izquierda.
const S_PUNTOS = [
	p(0.745, 0.245), p(0.725, 0.205), p(0.695, 0.178), p(0.655, 0.152), p(0.6, 0.126), p(0.519, 0.117),
	p(0.439, 0.125), p(0.364, 0.156), p(0.305, 0.213), p(0.281, 0.29), p(0.301, 0.37), p(0.358, 0.426),
	p(0.432, 0.459), p(0.509, 0.48), p(0.59, 0.5), p(0.665, 0.528), p(0.728, 0.579), p(0.762, 0.653),
	p(0.76, 0.734), p(0.722, 0.804), p(0.659, 0.853), p(0.581, 0.88), p(0.5, 0.885), p(0.42, 0.869),
	p(0.348, 0.832), p(0.275, 0.735),
];

// Recorrido de la C (y de la G): de arriba a la derecha, por la izquierda, hasta abajo a la derecha.
const C_ARCO = (hasta) => arco(0.53, 0.5, 0.31, 0.37, -42, hasta, 40);

const linea = (...puntos) => ({ puntos });
const curva = (puntos) => ({ puntos, curva: true });
const suave = (...puntos) => ({ puntos, suave: true, curva: true });
const tocar = (x, y) => ({ punto: p(x, y) });
const palo = (x, desde = ARRIBA, hasta = ABAJO) => linea(p(x, desde), p(x, hasta));

// Cada glifo: lista de trazos. Las mayúsculas de imprenta; "i" es la i minúscula de las vocales de
// Mundo 1 (palo y punto). En las sílabas la I va en mayúscula (un palo).
export const GLIFOS = {
	A: [linea(p(0.13, 0.9), p(0.45, 0.14), p(0.77, 0.9)), linea(p(0.27, 0.69), p(0.65, 0.69))],
	E: [
		linea(p(0.32, 0.14), p(0.32, 0.85), p(0.76, 0.85)),
		linea(p(0.38, 0.14), p(0.75, 0.14)),
		linea(p(0.38, 0.48), p(0.73, 0.48)),
	],
	i: [linea(p(0.5, 0.467), p(0.5, 0.826)), tocar(0.5, 0.189)],
	I: [palo(0.5)],
	O: [curva(O_PUNTOS)],
	U: [curva(U_PUNTOS)],
	L: [linea(p(0.273, 0.13), p(0.273, 0.868), p(0.78, 0.868))],
	S: [suave(...S_PUNTOS)],
	T: [linea(p(0.499, 0.16), p(0.499, 0.89)), linea(p(0.21, 0.129), p(0.77, 0.129))],
	M: [curva(M_PUNTOS)],

	// Mundos 2 a 6.
	P: [palo(0.3), curva([p(0.3, ARRIBA), p(0.48, ARRIBA), ...arco(0.48, 0.315, 0.23, 0.185, -90, 90), p(0.3, MEDIO)])],
	B: [
		palo(0.3),
		curva([p(0.3, ARRIBA), p(0.46, ARRIBA), ...arco(0.46, 0.3, 0.21, 0.17, -90, 90), p(0.3, 0.47)]),
		curva([p(0.3, 0.47), p(0.48, 0.47), ...arco(0.48, 0.67, 0.24, 0.2, -90, 90), p(0.3, ABAJO)]),
	],
	R: [
		palo(0.3),
		curva([p(0.3, ARRIBA), p(0.48, ARRIBA), ...arco(0.48, 0.315, 0.23, 0.185, -90, 90), p(0.3, MEDIO)]),
		linea(p(0.46, MEDIO), p(0.76, ABAJO)),
	],
	D: [palo(0.27), curva([p(0.27, ARRIBA), p(0.4, ARRIBA), ...arco(0.4, MEDIO, 0.35, 0.37, -90, 90), p(0.27, ABAJO)])],
	N: [linea(p(0.24, ABAJO), p(0.24, ARRIBA), p(0.76, ABAJO), p(0.76, ARRIBA))],
	Ñ: [
		linea(p(0.24, ABAJO), p(0.24, 0.32), p(0.76, ABAJO), p(0.76, 0.32)),
		suave(p(0.26, 0.15), p(0.38, 0.08), p(0.5, 0.12), p(0.62, 0.16), p(0.74, 0.09)),
	],
	F: [palo(0.3), linea(p(0.3, ARRIBA), p(0.74, ARRIBA)), linea(p(0.3, 0.49), p(0.66, 0.49))],
	H: [palo(0.26), palo(0.74), linea(p(0.26, MEDIO), p(0.74, MEDIO))],
	K: [palo(0.28), linea(p(0.74, ARRIBA), p(0.31, 0.52), p(0.76, ABAJO))],
	V: [linea(p(0.18, ARRIBA), p(0.5, ABAJO), p(0.82, ARRIBA))],
	X: [linea(p(0.22, ARRIBA), p(0.78, ABAJO)), linea(p(0.78, ARRIBA), p(0.22, ABAJO))],
	Y: [linea(p(0.2, ARRIBA), p(0.5, MEDIO)), linea(p(0.8, ARRIBA), p(0.5, MEDIO), p(0.5, ABAJO))],
	Z: [linea(p(0.22, ARRIBA), p(0.78, ARRIBA), p(0.22, ABAJO), p(0.78, ABAJO))],
	C: [curva(C_ARCO(-318))],
	G: [curva([...C_ARCO(-360), p(0.6, MEDIO)])],
	Q: [curva(O_PUNTOS), linea(p(0.58, 0.68), p(0.8, 0.88))],
	J: [curva([p(0.68, ARRIBA), p(0.68, 0.6), ...arco(0.47, 0.6, 0.21, 0.27, 0, 180)])],
	Ü: [
		curva([p(0.23, 0.33), p(0.23, 0.62), ...arco(0.5, 0.62, 0.27, 0.25, 180, 0), p(0.77, 0.33)]),
		tocar(0.37, 0.15),
		tocar(0.63, 0.15),
	],
};

// Margen a cada lado de una letra (el contorno de la guía mide 0,18 de ancho), separación entre
// letras de una sílaba y margen del tablero.
const MARGEN_LETRA = 0.1;
const SEPARACION = 0.05;
const MARGEN_TABLERO = 0.05;

function puntosDeTrazo(trazo) {
	return trazo.punto ? [trazo.punto] : trazo.puntos;
}

function anchoDeGlifo(glifo) {
	const xs = GLIFOS[glifo].flatMap(puntosDeTrazo).map((punto) => punto.x);
	return { min: Math.min(...xs), max: Math.max(...xs) };
}

// Las letras de un texto: cada carácter es una letra (LLA = L, L, A; GÜE = G, Ü, E). Con `vocales`,
// la I es la i minúscula de las vocales de Mundo 1.
export function glifosDeTexto(texto, vocales = false) {
	return [...texto].map((letra) => (vocales && letra === "I" ? "i" : letra));
}

function anchoDeTexto(glifos) {
	return glifos.reduce((total, glifo) => {
		const { min, max } = anchoDeGlifo(glifo);
		return total + max - min + 2 * MARGEN_LETRA;
	}, 0) + SEPARACION * (glifos.length - 1);
}

// Ancho del tablero (el alto es 1) para que entre la más ancha de las opciones de la lista: así el
// tablero no cambia de tamaño al pasar de una sílaba a otra.
export function anchoDeTablero(textos, vocales = false) {
	return Math.max(...textos.map((texto) => anchoDeTexto(glifosDeTexto(texto, vocales)))) + 2 * MARGEN_TABLERO;
}

// Arma los trazos de un texto ubicados en el tablero (centrado a lo ancho), en orden de escritura.
// Cada trazo: { glifo, path } (camino muestreado) o { glifo, punto } para tocar.
export function armarTrazos(texto, anchoTablero, vocales = false) {
	const glifos = glifosDeTexto(texto, vocales);
	let x = (anchoTablero - anchoDeTexto(glifos)) / 2;
	const trazos = [];
	for (const glifo of glifos) {
		const { min, max } = anchoDeGlifo(glifo);
		const dx = x + MARGEN_LETRA - min;
		const mover = (punto) => p(punto.x + dx, punto.y);
		for (const trazo of GLIFOS[glifo]) {
			if (trazo.punto) {
				trazos.push({ glifo, punto: mover(trazo.punto) });
			} else {
				const puntos = trazo.puntos.map(mover);
				trazos.push({ glifo, puntos, curva: Boolean(trazo.curva), path: buildWaypointPath(puntos, trazo.suave) });
			}
		}
		x += max - min + 2 * MARGEN_LETRA + SEPARACION;
	}
	return trazos;
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

// Cuánto se mira hacia adelante y hacia atrás del avance actual, en largo de tablero, y a qué
// distancia del camino tiene que estar el dedo.
export const PATH_MAX_FORWARD = 0.12;
export const PATH_MAX_BACK = 0.06;
export const PATH_TOLERANCE = 0.13;
// Avance mínimo para dar el trazo por completado.
export const CURVE_COMPLETE_PROGRESS = 0.97;

// Toma el punto del camino más cercano al dedo, mirando solo un poco atrás y adelante del avance
// actual. La ventana se mide sobre el largo del camino (no en %): así en las puntas (M, N, V),
// donde el tramo que sube y el que baja están pegados, no se salta al otro tramo.
export function advancePath(path, progress, point, tolerance = PATH_TOLERANCE) {
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

// Puntos del camino hasta `progress` (para dibujar el trazo rosa). Usa siempre los mismos puntos
// fijos más el actual al final: si se remuestrea según el avance, en las esquinas parece que vibra.
export function puntosHasta(path, progress) {
	return [...path.filter((point) => point.progress < progress), getPathPoint(path, progress)];
}

export function samePoint(first, second, tolerance = 0.08) {
	return distance(first, second) <= tolerance;
}
