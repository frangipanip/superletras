import { ACTIVIDADES, esActividadDePalabras } from "../../shared/actividades.js";
import { STORAGE_KEYS, readStorage, writeStorage } from "./storage";

// Actividades del camino de cada mundo, en orden (la ruta es /<clave>). Mundo 1 sale de
// shared/actividades.js; los otros mundos tienen su camino armado en su pantalla y tienen que
// coincidir con esto.
export const CAMINOS = {
	1: ACTIVIDADES.map(({ clave }) => clave),
	2: ["inicio", "mariposas", "flores", "peluches", "tren", "dibujar"],
	3: ["inicio", "mariposas", "flores", "peluches", "tren", "dibujar"],
	4: ["inicio", "mariposas", "flores", "peluches", "tren", "dibujar"],
	5: ["inicio", "mariposas", "flores", "peluches", "tren", "dibujar", "elegir"],
	6: ["inicio", "mariposas", "flores", "peluches", "tren", "dibujar", "elegir"]
};

const INDICES_PERCHES_M5_ORDEN_ANTERIOR = [0, 4, 3, 6, 1, 2, 5];

export function leerPosicionesMundo5() {
	let posiciones = {};
	try {
		posiciones = JSON.parse(readStorage(STORAGE_KEYS.mundo5Perches) || "{}") || {};
	} catch {
		posiciones = {};
	}

	if (readStorage(STORAGE_KEYS.mundo5PerchesOrder) !== "2") {
		posiciones = Object.fromEntries(Object.entries(posiciones).map(([letra, indice]) => [
			letra,
			Number.isInteger(indice) && INDICES_PERCHES_M5_ORDEN_ANTERIOR[indice] !== undefined
				? INDICES_PERCHES_M5_ORDEN_ANTERIOR[indice]
				: indice
		]));
		writeStorage(STORAGE_KEYS.mundo5Perches, JSON.stringify(posiciones));
		writeStorage(STORAGE_KEYS.mundo5PerchesOrder, "2");
	}

	return posiciones;
}

function palabrasDesbloqueadas(letra) {
	try {
		return JSON.parse(readStorage(STORAGE_KEYS.mundo1WordPathsUnlocked) || "{}")[letra] === true;
	} catch {
		return false;
	}
}

// La actividad que sigue a `clave` en el camino del mundo, o null si es la última o si la
// siguiente todavía está bloqueada (las de palabras de Mundo 1 hasta evolucionar el monstruo).
export function siguienteActividad(mundo, clave, letra) {
	const camino = CAMINOS[mundo];
	const indice = camino ? camino.indexOf(clave) : -1;
	const siguiente = indice >= 0 ? camino[indice + 1] : null;
	if (!siguiente) {
		return null;
	}
	if (mundo === 1 && esActividadDePalabras(siguiente) && !palabrasDesbloqueadas(letra)) {
		return null;
	}
	return siguiente;
}

// Dónde guarda cada menú la actividad junto a la que se para el personaje, por letra (el índice
// es el de CAMINOS). Mundo 1 usa la letra en minúscula; los otros, en mayúscula.
const POSICIONES_EN_CAMINO = {
	1: STORAGE_KEYS.mundo1Perches,
	2: STORAGE_KEYS.mundo2Perches,
	3: STORAGE_KEYS.mundo3Perches,
	4: STORAGE_KEYS.mundo4Perches,
	5: STORAGE_KEYS.mundo5Perches,
	6: STORAGE_KEYS.mundo6Perches
};

// Anota `clave` como la última actividad jugada de la letra: al volver al menú (por ejemplo,
// después de encadenar actividades con "siguiente") el personaje aparece junto a ella.
export function anotarPosicionEnCamino(mundo, letra, clave) {
	const storageKey = POSICIONES_EN_CAMINO[mundo];
	const indice = CAMINOS[mundo]?.indexOf(clave) ?? -1;
	if (!storageKey || !letra || indice < 0) {
		return;
	}
	let posiciones = {};
	if (mundo === 5) {
		posiciones = leerPosicionesMundo5();
	} else {
		try {
			posiciones = JSON.parse(readStorage(storageKey) || "{}") || {};
		} catch {
			posiciones = {};
		}
	}
	const clavePorLetra = mundo === 1 ? letra.toLowerCase() : letra.toUpperCase();
	writeStorage(storageKey, JSON.stringify({ ...posiciones, [clavePorLetra]: indice }));
}
