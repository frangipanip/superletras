// Recompensas de las actividades de cada letra. Lo usan la app (src/lib/recompensas.js)
// y la API (server/index.js), así los dos topes coinciden.
// "necesarias" es lo que come el monstruo de cada letra: también es el máximo que se
// puede ganar de esa comida por letra.
export const COMIDAS = [
	{ clave: "cerezas", emoji: "🍒", nombre: "Cerezas", actividad: "inicio", necesarias: 3 },
	{ clave: "confites", emoji: "🍬", nombre: "Confites", actividad: "mariposas", necesarias: 3 },
	{ clave: "chocolate", emoji: "🍫", nombre: "Chocolate", actividad: "flores", necesarias: 3 },
	{ clave: "frutillas", emoji: "🍓", nombre: "Frutillas", actividad: "peluches", necesarias: 3 },
	{ clave: "cucuruchos", emoji: "🍦", nombre: "Cucuruchos", actividad: "tren", necesarias: 3 },
	{ clave: "galletitas", emoji: "🍪", nombre: "Galletitas", actividad: "dibujar", necesarias: 3 }
];

// Segunda tanda, para el monstruo ya evolucionado (solo Mundo 1, que tiene actividades de
// palabras): las mismas comidas en el mismo orden, ganadas en las actividades de palabras. Se
// guardan con otra clave para no mezclarse con las de sílabas. Si se agrega una actividad de
// palabras, se le agrega acá su comida (las que sobran no molestan).
export const COMIDAS_PALABRAS = [
	{ ...COMIDAS[0], clave: "cerezas-palabras", actividad: "barcos" },
	{ ...COMIDAS[1], clave: "confites-palabras", actividad: "pastel" },
	{ ...COMIDAS[2], clave: "chocolate-palabras", actividad: "puzzle" },
	{ ...COMIDAS[3], clave: "frutillas-palabras", actividad: "decora" },
	{ ...COMIDAS[4], clave: "cucuruchos-palabras", actividad: "escribir" },
	{ ...COMIDAS[5], clave: "galletitas-palabras", actividad: "oraciones" }
];

const TODAS_LAS_COMIDAS = [...COMIDAS, ...COMIDAS_PALABRAS];
export const COMIDA_POR_CLAVE = Object.fromEntries(TODAS_LAS_COMIDAS.map((comida) => [comida.clave, comida]));
export const COMIDA_POR_ACTIVIDAD = Object.fromEntries(TODAS_LAS_COMIDAS.map((comida) => [comida.actividad, comida]));

// Estrellas ganadas por letra: se guardan junto a las comidas con esta clave ({ ganadas, dadas: 0 }).
export const CLAVE_ESTRELLAS = "estrellas";
// Actividades que nunca dan comida y siempre dan estrellas ("¿J o G?" y "¿B o V?").
export const ACTIVIDADES_SOLO_ESTRELLAS = ["elegir"];

// Lo que da una partida terminada con `puntaje` (1 a 3): la comida que le falta a la actividad
// (sin pasar del tope del monstruo) o, si ya se ganaron todas o la actividad no da comida,
// estrellas según cómo se jugó. Faltaba 1 y se sacó 3: da esa 1, sin estrellas.
export function repartirPremio(comida, ganadas, puntaje) {
	const falta = comida ? Math.max(0, comida.necesarias - ganadas) : 0;
	if (falta === 0) {
		return { comida: 0, estrellas: Math.max(0, puntaje) };
	}
	return { comida: Math.max(0, Math.min(puntaje, falta)), estrellas: 0 };
}

// Letras con monstruo, por mundo: las claves del menú de cada mundo en minúscula (son todas
// distintas, así que las comidas de una letra nunca se mezclan con las de otra). Mundo 6 no
// tiene monstruos: sus actividades dan estrellas.
export const LETRAS_POR_MUNDO = {
	1: ["a", "l", "m", "s", "t"],
	2: ["p", "n", "d", "f", "h"],
	3: ["r", "rr", "ar", "y", "ll"],
	4: ["c", "q", "ce", "z", "ch"],
	5: ["g", "ge", "gu", "j", "gü"]
};
export const LETRAS = Object.values(LETRAS_POR_MUNDO).flat();
export const MUNDO_DE_LETRA = Object.fromEntries(
	Object.entries(LETRAS_POR_MUNDO).flatMap(([mundo, letras]) => letras.map((letra) => [letra, Number(mundo)]))
);

// Letras cuyo monstruo evolucionado sigue comiendo (las de palabras, por ahora solo Mundo 1).
export const LETRAS_CON_PALABRAS = LETRAS_POR_MUNDO[1];

// Comidas que el monstruo de la letra está pidiendo ahora: las de sílabas hasta evolucionar y,
// en Mundo 1, después las de palabras. `cantidad(clave)` devuelve { ganadas, dadas }.
export function comidasDelMonstruo(letra, cantidad) {
	const evolucionado = COMIDAS.every(({ clave, necesarias }) => cantidad(clave).dadas >= necesarias);
	return evolucionado && LETRAS_CON_PALABRAS.includes(letra) ? COMIDAS_PALABRAS : COMIDAS;
}

// Premio al completar una actividad: 3 sin errores, 2 con 1 o 2, 1 con 3 o más.
// Dibujar acepta una cantidad explícita para agrupar el premio de sus letras.
export function premioPorErrores(actividad, errores, cantidadSolicitada) {
	if (actividad === "dibujar") {
		if (cantidadSolicitada !== undefined) {
			return Math.max(0, Math.floor(Number(cantidadSolicitada) || 0));
		}
		return 1;
	}
	if (errores <= 0) {
		return 3;
	}
	return errores <= 2 ? 2 : 1;
}
