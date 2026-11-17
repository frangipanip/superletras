import { STORAGE_KEYS, readStorage, writeStorage } from "./storage";

// Lo que se juntó en cada actividad por letra, sumando todas las partidas, con tope 3:
// { l: { inicio: 3, flores: 2 }, rr: { mariposas: 1 } }. La actividad está completa (tilde en el
// menú) recién al llegar a 3, aunque se junte en varias partidas. Hasta la 3.87.0 se guardaba el
// mejor puntaje con la misma clave y formato: ese valor queda como suma inicial.
// Las letras de todos los mundos son distintas, así que no hace falta separarlas por mundo. Solo
// vive en este dispositivo (no se sincroniza con la API); en Mundo 1 también cuenta la comida
// ganada (ver actividadCompleta), que sí viaja con el código de jugador.
// Lo leen los componentes con useSyncExternalStore (subscribeProgreso / getProgreso).

// Lo que pide cada actividad para darse por completa (las comidas del monstruo y las estrellas).
export const NECESARIAS_POR_ACTIVIDAD = 3;

function leer() {
	try {
		const guardado = JSON.parse(readStorage(STORAGE_KEYS.actividadesCompletadas) || "{}");
		return guardado && typeof guardado === "object" ? guardado : {};
	} catch {
		return {};
	}
}

let progreso = leer();
const listeners = new Set();

export function subscribeProgreso(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getProgreso() {
	return progreso;
}

// Suma lo obtenido en una partida terminada (1 a 3), sin pasar de NECESARIAS_POR_ACTIVIDAD.
export function marcarCompletada(letra, actividad, puntaje = 1) {
	if (!letra || !actividad) {
		return;
	}
	const anterior = progreso[letra]?.[actividad] || 0;
	const sumado = Math.max(1, Math.min(3, Number(puntaje) || 1));
	const nuevo = Math.min(NECESARIAS_POR_ACTIVIDAD, anterior + sumado);
	if (nuevo <= anterior) {
		return;
	}
	progreso = { ...progreso, [letra]: { ...progreso[letra], [actividad]: nuevo } };
	writeStorage(STORAGE_KEYS.actividadesCompletadas, JSON.stringify(progreso));
	listeners.forEach((listener) => listener());
}

// Lo juntado en la actividad (0 si nunca se terminó).
export function puntajeDe(progresoActual, letra, actividad) {
	return progresoActual[letra]?.[actividad] || 0;
}

// Completa: se juntaron las 3 estrellas o, en Mundo 1, las 3 comidas (`ganadas`, estén dadas al
// monstruo o no). Las comidas se pasan desde el menú porque viven en recompensas.js.
export function actividadCompleta(progresoActual, letra, actividad, comidasGanadas = 0) {
	return Math.max(puntajeDe(progresoActual, letra, actividad), comidasGanadas) >= NECESARIAS_POR_ACTIVIDAD;
}
