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

export const COMIDA_POR_CLAVE = Object.fromEntries(COMIDAS.map((comida) => [comida.clave, comida]));
// "¿J o G?" y "¿B o V?" (elegir) no dan comida: premian con estrellas aunque la letra tenga monstruo.
export const COMIDA_POR_ACTIVIDAD = Object.fromEntries(COMIDAS.map((comida) => [comida.actividad, comida]));

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
