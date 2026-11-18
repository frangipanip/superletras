import { getPathPoint } from "../lib/trazados";

// Guía de Dibujar: contorno de la letra, línea punteada en el centro y flechas con la dirección,
// dibujada con los mismos trazos que valida el dedo (src/lib/trazados.js). Unidades: el tablero
// mide `ancho` x 1 y el viewBox lo multiplica por 100.
const FONDO = "#f2f3ee";
const TINTA = "#333";
const CONTORNO = 18.3;
const INTERIOR = 13.9;
const FLECHA = 4.1;

const xy = (punto) => `${(punto.x * 100).toFixed(2)},${(punto.y * 100).toFixed(2)}`;

function flecha(punta, desde) {
	const largo = Math.hypot(punta.x - desde.x, punta.y - desde.y) || 1;
	const ux = (punta.x - desde.x) / largo;
	const uy = (punta.y - desde.y) / largo;
	const base = { x: punta.x * 100 - ux * FLECHA, y: punta.y * 100 - uy * FLECHA };
	const medio = FLECHA * 0.6;
	return [
		[punta.x * 100, punta.y * 100],
		[base.x - uy * medio, base.y + ux * medio],
		[base.x + uy * medio, base.y - ux * medio],
	].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

// Dónde van las flechas de un trazo (avance de 0 a 1): en las rectas, cerca del final de cada tramo
// largo; en las curvas, repartidas a lo largo.
function avancesDeFlechas(trazo) {
	const { path, puntos, curva } = trazo;
	const largo = path[path.length - 1].distance;
	if (curva) {
		return largo > 0.9 ? [0.22, 0.52, 0.84] : largo > 0.5 ? [0.3, 0.75] : [0.65];
	}
	let recorrido = 0;
	const avances = [];
	for (let index = 1; index < puntos.length; index += 1) {
		const tramo = Math.hypot(puntos[index].x - puntos[index - 1].x, puntos[index].y - puntos[index - 1].y);
		if (tramo > 0.15) avances.push((recorrido + tramo * 0.75) / largo);
		recorrido += tramo;
	}
	return avances;
}

export default function GuiaTrazado({ ancho, trazos }) {
	const lineas = trazos.filter((trazo) => trazo.path);
	const puntos = trazos.filter((trazo) => trazo.punto);
	const formas = [
		...lineas.map((trazo) => trazo.path.map(xy).join(" ")),
		// Un punto es una línea de largo cero: con punta redonda queda un círculo del mismo grosor.
		...puntos.map((trazo) => `${xy(trazo.punto)} ${xy(trazo.punto)}`),
	];
	const capa = (color, grosor) => formas.map((forma, index) => (
		<polyline key={index} points={forma} stroke={color} strokeWidth={grosor} />
	));
	return (
		<svg className="dibujar-guia" viewBox={`0 0 ${ancho * 100} 100`} aria-hidden="true">
			<rect width={ancho * 100} height="100" fill={FONDO} />
			<g fill="none" strokeLinecap="round" strokeLinejoin="round">
				{capa("#111", CONTORNO)}
				{capa(FONDO, INTERIOR)}
				{lineas.map((trazo, index) => (
					<polyline key={index} points={trazo.path.map(xy).join(" ")} stroke={TINTA} strokeWidth="0.95" strokeDasharray="2.8 2.5" />
				))}
			</g>
			<g fill={TINTA}>
				{lineas.flatMap((trazo, index) => avancesDeFlechas(trazo).map((avance) => (
					<polygon key={`${index}-${avance}`} points={flecha(getPathPoint(trazo.path, avance), getPathPoint(trazo.path, avance - 0.02))} />
				)))}
				{puntos.map((trazo, index) => (
					<circle key={index} cx={trazo.punto.x * 100} cy={trazo.punto.y * 100} r="2.2" />
				))}
			</g>
		</svg>
	);
}
