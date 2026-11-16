import { STORAGE_KEYS, readStorage, writeStorage } from "./storage";

// Actividades completadas por letra, con el mejor puntaje (1 a 3 estrellas):
// { l: { inicio: 3, flores: 2 }, rr: { mariposas: 1 } }. Las letras de todos los mundos son
// distintas, así que no hace falta separarlas por mundo. Solo vive en este dispositivo
// (no se sincroniza con la API); en Mundo 1 los menús también cuentan como completada toda
// actividad con comida ganada, así quien ya jugaba no arranca de cero.
// Lo leen los componentes con useSyncExternalStore (subscribeProgreso / getProgreso).

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

export function marcarCompletada(letra, actividad, puntaje = 1) {
	if (!letra || !actividad) {
		return;
	}
	const anterior = progreso[letra]?.[actividad] || 0;
	const nuevo = Math.max(1, Math.min(3, Number(puntaje) || 1));
	if (nuevo <= anterior) {
		return;
	}
	progreso = { ...progreso, [letra]: { ...progreso[letra], [actividad]: nuevo } };
	writeStorage(STORAGE_KEYS.actividadesCompletadas, JSON.stringify(progreso));
	listeners.forEach((listener) => listener());
}

// Puntaje de la actividad (0 si nunca se completó).
export function puntajeDe(progresoActual, letra, actividad) {
	return progresoActual[letra]?.[actividad] || 0;
}
