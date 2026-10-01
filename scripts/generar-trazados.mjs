// Genera las guías vectoriales de la actividad Dibujar (public/assets/imagenes/trazado<Letra>.svg)
// a partir de los mismos recorridos que acepta la pantalla (src/lib/trazados.js).
// Si se cambia un recorrido, volver a correr: npm run trazados
import { writeFileSync } from "node:fs";
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
	M_START_POINT,
	M_BOTTOM_POINT,
	M_END_POINT,
	M_TOP_LEFT,
	M_TOP_RIGHT,
	O_ELLIPSE,
	U_CURVE,
	U_TOP_Y,
	S_WAYPOINTS,
	getOPoint,
	getUPoint,
	getSPoint,
} from "../src/lib/trazados.js";

// Mismo tamaño (y proporción) que el tablero: las coordenadas 0 a 1 se estiran a este viewBox.
const WIDTH = 322;
const HEIGHT = 317;
const BACKGROUND = "#f2f3ee";
const INK = "#333";
// El trazo rosa de la pantalla mide 10% del tablero (unos 32 px acá): la letra deja aire alrededor.
const OUTLINE_WIDTH = 58;
const INSIDE_WIDTH = 44;
const ARROW_SIZE = 13;

const OUTPUT_DIR = new URL("../public/assets/imagenes/", import.meta.url);

function toPixels(point) {
	return { x: point.x * WIDTH, y: point.y * HEIGHT };
}

function coords(point) {
	const pixels = toPixels(point);
	return `${pixels.x.toFixed(2)} ${pixels.y.toFixed(2)}`;
}

function lerp(first, second, ratio) {
	return { x: first.x + (second.x - first.x) * ratio, y: first.y + (second.y - first.y) * ratio };
}

function linePath(...points) {
	return points.map((point, index) => `${index === 0 ? "M" : "L"} ${coords(point)}`).join(" ");
}

// Flecha con la punta en `tip`, apuntando en la dirección de `from` hacia `tip`.
function arrow(tip, from) {
	const end = toPixels(tip);
	const start = toPixels(from);
	const length = Math.hypot(end.x - start.x, end.y - start.y);
	const ux = (end.x - start.x) / length;
	const uy = (end.y - start.y) / length;
	const baseX = end.x - ux * ARROW_SIZE;
	const baseY = end.y - uy * ARROW_SIZE;
	const half = ARROW_SIZE * 0.6;
	const points = [
		[end.x, end.y],
		[baseX - uy * half, baseY + ux * half],
		[baseX + uy * half, baseY - ux * half],
	];
	return `<polygon points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}" />`;
}

function arrowOnLine(from, to, ratio) {
	return arrow(lerp(from, to, ratio), from);
}

// Flecha sobre un camino curvo dado por getPoint(avance 0 a 1).
function arrowOnCurve(getPoint, progress) {
	return arrow(getPoint(progress), getPoint(progress - 0.01));
}

// La S se traza con Catmull-Rom entre sus puntos: cada tramo se escribe como la cúbica equivalente.
function catmullRomPath(waypoints) {
	let path = `M ${coords(waypoints[0])}`;
	for (let index = 1; index < waypoints.length; index += 1) {
		const from = waypoints[index - 1];
		const to = waypoints[index];
		const before = waypoints[index - 2] ?? from;
		const after = waypoints[index + 1] ?? to;
		const control1 = { x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 };
		const control2 = { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 };
		path += ` C ${coords(control1)}, ${coords(control2)}, ${coords(to)}`;
	}
	return path;
}

function ellipsePath({ cx, cy, rx, ry }) {
	const top = { x: cx, y: cy - ry };
	const bottom = { x: cx, y: cy + ry };
	const radii = `${(rx * WIDTH).toFixed(2)} ${(ry * HEIGHT).toFixed(2)}`;
	// Antihorario desde arriba, igual que la pantalla.
	return `M ${coords(top)} A ${radii} 0 1 0 ${coords(bottom)} A ${radii} 0 1 0 ${coords(top)}`;
}

function uPath() {
	const left = U_CURVE.cx - U_CURVE.rx;
	const right = U_CURVE.cx + U_CURVE.rx;
	const radii = `${(U_CURVE.rx * WIDTH).toFixed(2)} ${(U_CURVE.ry * HEIGHT).toFixed(2)}`;
	return `M ${coords({ x: left, y: U_TOP_Y })} L ${coords({ x: left, y: U_CURVE.cy })} A ${radii} 0 0 0 ${coords({ x: right, y: U_CURVE.cy })} L ${coords({ x: right, y: U_TOP_Y })}`;
}

function mPath() {
	const [leftStart, leftControl1, leftControl2, leftEnd] = M_TOP_LEFT;
	const [rightStart, rightControl1, rightControl2, rightEnd] = M_TOP_RIGHT;
	return [
		`M ${coords(M_START_POINT)}`,
		`L ${coords(leftStart)}`,
		`C ${coords(leftControl1)}, ${coords(leftControl2)}, ${coords(leftEnd)}`,
		`L ${coords(M_BOTTOM_POINT)}`,
		`L ${coords(rightStart)}`,
		`C ${coords(rightControl1)}, ${coords(rightControl2)}, ${coords(rightEnd)}`,
		`L ${coords(M_END_POINT)}`,
	].join(" ");
}

// Cada letra: los trazos (paths SVG), los puntos para tocar (la i) y las flechas de dirección.
const LETTERS = {
	A: {
		strokes: [linePath(START_POINT, MID_POINT, END_POINT), linePath(HORIZONTAL_START_POINT, HORIZONTAL_END_POINT)],
		arrows: [
			arrowOnLine(START_POINT, MID_POINT, 0.75),
			arrowOnLine(MID_POINT, END_POINT, 0.75),
			arrowOnLine(HORIZONTAL_START_POINT, HORIZONTAL_END_POINT, 0.8),
		],
	},
	E: {
		strokes: [
			linePath(E_START_POINT, E_SECOND_POINT, E_THIRD_POINT),
			linePath(E_FOURTH_POINT, E_FIFTH_POINT),
			linePath(E_SIXTH_POINT, E_SEVENTH_POINT),
		],
		// Las barras arrancan un poco a la derecha del palo: se rellena el contorno para que no quede un escalón.
		fillers: [
			linePath(E_START_POINT, E_FOURTH_POINT),
			linePath({ x: E_START_POINT.x, y: E_SIXTH_POINT.y }, E_SIXTH_POINT),
		],
		arrows: [
			arrowOnLine(E_START_POINT, E_SECOND_POINT, 0.75),
			arrowOnLine(E_SECOND_POINT, E_THIRD_POINT, 0.8),
			arrowOnLine(E_FOURTH_POINT, E_FIFTH_POINT, 0.8),
			arrowOnLine(E_SIXTH_POINT, E_SEVENTH_POINT, 0.8),
		],
	},
	I: {
		strokes: [linePath(I_START_POINT, I_END_POINT)],
		dots: [I_DOT_POINT],
		arrows: [arrowOnLine(I_START_POINT, I_END_POINT, 0.8)],
	},
	O: {
		strokes: [ellipsePath(O_ELLIPSE)],
		arrows: [0.25, 0.5, 0.75].map((progress) => arrowOnCurve(getOPoint, progress)),
	},
	U: {
		strokes: [uPath()],
		arrows: [0.2, 0.5, 0.85].map((progress) => arrowOnCurve(getUPoint, progress)),
	},
	L: {
		strokes: [linePath(L_START_POINT, L_CORNER_POINT, L_END_POINT)],
		arrows: [arrowOnLine(L_START_POINT, L_CORNER_POINT, 0.6), arrowOnLine(L_CORNER_POINT, L_END_POINT, 0.8)],
	},
	S: {
		strokes: [catmullRomPath(S_WAYPOINTS)],
		arrows: [0.25, 0.55, 0.9].map((progress) => arrowOnCurve(getSPoint, progress)),
	},
	T: {
		strokes: [linePath(T_VERTICAL_START, T_VERTICAL_END), linePath(T_HORIZONTAL_START, T_HORIZONTAL_END)],
		arrows: [
			arrowOnLine(T_VERTICAL_START, T_VERTICAL_END, 0.8),
			arrowOnLine(T_HORIZONTAL_START, T_HORIZONTAL_END, 0.8),
		],
	},
	M: {
		strokes: [mPath()],
		arrows: [
			arrowOnLine(M_START_POINT, M_TOP_LEFT[0], 0.8),
			arrowOnLine(M_TOP_LEFT[3], M_BOTTOM_POINT, 0.8),
			arrowOnLine(M_BOTTOM_POINT, M_TOP_RIGHT[0], 0.8),
			arrow(M_END_POINT, lerp(M_TOP_RIGHT[3], M_END_POINT, 0.9)),
		],
	},
};

function buildSvg(letter, { strokes, fillers = [], dots = [], arrows }) {
	// El punto de la i es un trazo de largo cero: con punta redonda queda un círculo del mismo grosor.
	// Contorno y relleno llevan todo; la línea punteada, solo los trazos.
	const outlineShapes = [...strokes, ...fillers, ...dots.map((dot) => `M ${coords(dot)} L ${coords(dot)}`)];
	const layer = (shapes, stroke, width, extra = "") => shapes
		.map((d) => `\t\t<path d="${d}" stroke="${stroke}" stroke-width="${width}"${extra} />`)
		.join("\n");
	const dotCenters = dots
		.map((dot) => {
			const center = toPixels(dot);
			return `\t\t<circle cx="${center.x.toFixed(2)}" cy="${center.y.toFixed(2)}" r="7" />`;
		})
		.join("\n");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
	<!-- Guia para trazar la ${letter}. Generado por scripts/generar-trazados.mjs: no editar a mano. -->
	<rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}" />
	<g fill="none" stroke-linecap="round" stroke-linejoin="round">
${layer(outlineShapes, "#111", OUTLINE_WIDTH)}
${layer(outlineShapes, BACKGROUND, INSIDE_WIDTH)}
${layer(strokes, INK, 3, ' stroke-dasharray="9 8"')}
	</g>
	<g fill="${INK}">
${[...arrows.map((shape) => `\t\t${shape}`), dotCenters].filter(Boolean).join("\n")}
	</g>
</svg>
`;
}

for (const [letter, guide] of Object.entries(LETTERS)) {
	const file = new URL(`trazado${letter}.svg`, OUTPUT_DIR);
	writeFileSync(file, buildSvg(letter, guide));
	console.log(`trazado${letter}.svg`);
}
