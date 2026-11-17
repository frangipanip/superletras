import { ACTIVIDADES, esActividadDePalabras } from "../../shared/actividades.js";
import { STORAGE_KEYS, readStorage } from "./storage";

// Actividades del camino de cada mundo, en orden (la ruta es /<clave>). Mundo 1 sale de
// shared/actividades.js; los otros mundos tienen su camino armado en su pantalla y tienen que
// coincidir con esto.
export const CAMINOS = {
	1: ACTIVIDADES.map(({ clave }) => clave),
	2: ["inicio", "mariposas", "flores", "peluches", "tren"],
	3: ["inicio", "mariposas", "flores", "peluches", "tren"],
	4: ["inicio", "mariposas", "flores", "peluches", "tren"],
	5: ["inicio", "tren", "peluches", "elegir"],
	6: ["inicio", "peluches", "elegir", "tren"]
};

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
