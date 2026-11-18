import { img } from "../lib/assets";
import "./Monstruo.css";

// Cuadros de cada monstruo (public/assets/imagenes/monstruos): la letra va en la panza.
// 1: normal · 2: boca abierta · 3: masticando · 4: se relame · 5: feliz.
// 6: normal en el nivel 1; brazos arriba con la boca abierta en el nivel 2 (evolucionado).
export const CUADROS_MONSTRUO = { normal: 1, abre: 2, mastica: 3, relame: 4, feliz: 5 };

// Dónde está la boca (fracción de la imagen) de los monstruos que no la tienen en el centro, para
// que la comida vuele ahí. La calcula scripts/cortar-hoja-monstruo.py al cortar cada hoja.
const BOCA_CENTRO = { x: 0.5, y: 0.54 };
const BOCAS = {
	1: {
		p: { x: 0.5, y: 0.71 }, n: { x: 0.5, y: 0.68 }, d: { x: 0.53, y: 0.7 }, f: { x: 0.52, y: 0.69 },
		h: { x: 0.5, y: 0.68 }, r: { x: 0.55, y: 0.75 }, rr: { x: 0.55, y: 0.74 }, ar: { x: 0.58, y: 0.76 },
		y: { x: 0.6, y: 0.79 }, ll: { x: 0.58, y: 0.81 },
		c: { x: 0.56, y: 0.62 }, q: { x: 0.53, y: 0.67 }, ce: { x: 0.54, y: 0.66 }, z: { x: 0.56, y: 0.6 }, ch: { x: 0.61, y: 0.66 },
		g: { x: 0.6, y: 0.79 }, ge: { x: 0.61, y: 0.72 }, gu: { x: 0.6, y: 0.73 }, j: { x: 0.56, y: 0.74 }, "gü": { x: 0.59, y: 0.78 },
		b: { x: 0.64, y: 0.68 }, v: { x: 0.64, y: 0.7 }, "ñ": { x: 0.7, y: 0.72 }, k: { x: 0.66, y: 0.65 }, x: { x: 0.67, y: 0.78 }
	},
	2: {
		m: { x: 0.5, y: 0.6 }, p: { x: 0.58, y: 0.56 }, n: { x: 0.62, y: 0.54 }, d: { x: 0.65, y: 0.54 },
		f: { x: 0.64, y: 0.52 }, h: { x: 0.68, y: 0.55 }, r: { x: 0.53, y: 0.46 }, rr: { x: 0.75, y: 0.52 },
		ar: { x: 0.53, y: 0.53 }, y: { x: 0.69, y: 0.64 }, ll: { x: 0.56, y: 0.68 },
		c: { x: 0.58, y: 0.6 }, q: { x: 0.64, y: 0.6 }, ce: { x: 0.66, y: 0.55 }, z: { x: 0.55, y: 0.62 }, ch: { x: 0.7, y: 0.6 },
		g: { x: 0.59, y: 0.51 }, ge: { x: 0.58, y: 0.63 }, gu: { x: 0.57, y: 0.52 }, j: { x: 0.53, y: 0.54 }, "gü": { x: 0.52, y: 0.62 },
		b: { x: 0.73, y: 0.53 }, v: { x: 0.68, y: 0.54 }, "ñ": { x: 0.73, y: 0.55 }, k: { x: 0.69, y: 0.53 }, x: { x: 0.7, y: 0.53 }
	}
};

export function bocaMonstruo(letra, evolucionado = false) {
	return BOCAS[evolucionado ? 2 : 1][letra] ?? BOCA_CENTRO;
}

// Nombre de la letra en el archivo: sin diéresis ni eñe, para el servidor Linux y las URLs.
const ARCHIVOS = { "gü": "gdieresis", "ñ": "enie" };
function archivo(letra) {
	return ARCHIVOS[letra] || letra;
}

export function imagenMonstruo(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${archivo(letra)}-${cuadro}.webp`);
}

export function imagenMonstruoNivel2(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${archivo(letra)}-nivel2-${cuadro}.webp`);
}

export function imagenesMonstruo(letra) {
	return [...new Set([1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruo(letra, cuadro)))];
}

export function imagenesMonstruoNivel2(letra) {
	return [...new Set([1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruoNivel2(letra, cuadro)))];
}

export default function Monstruo({ letra, cuadro = CUADROS_MONSTRUO.normal, evolucionado = false, className = "" }) {
	const clases = ["monstruo", className].filter(Boolean).join(" ");
	const src = evolucionado ? imagenMonstruoNivel2(letra, cuadro) : imagenMonstruo(letra, cuadro);
	const estado = evolucionado ? " evolucionado" : "";
	return <img className={clases} src={src} alt={`Monstruo${estado} de la letra ${letra.toUpperCase()}`} draggable={false} />;
}
