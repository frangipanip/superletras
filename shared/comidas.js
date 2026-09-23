// Recompensas de las actividades de cada letra. Lo usan la app (src/lib/recompensas.js)
// y la API (server/index.js), así los dos topes coinciden.
// "necesarias" es lo que come el monstruo de cada letra: también es el máximo que se
// puede ganar de esa comida por letra.
export const COMIDAS = [
	{ clave: "cerezas", emoji: "🍒", nombre: "Cerezas", actividad: "inicio", necesarias: 9 },
	{ clave: "confites", emoji: "🍬", nombre: "Confites", actividad: "mariposas", necesarias: 9 },
	{ clave: "chocolate", emoji: "🍫", nombre: "Chocolate", actividad: "flores", necesarias: 12 },
	{ clave: "frutillas", emoji: "🍓", nombre: "Frutillas", actividad: "peluches", necesarias: 9 },
	{ clave: "cucuruchos", emoji: "🍦", nombre: "Cucuruchos", actividad: "tren", necesarias: 9 },
	{ clave: "galletitas", emoji: "🍪", nombre: "Galletitas", actividad: "dibujar", necesarias: 3 },
	{ clave: "caramelos", emoji: "🍬", nombre: "Caramelos", actividad: "memotest", necesarias: 6 }
];

export const COMIDA_POR_CLAVE = Object.fromEntries(COMIDAS.map((comida) => [comida.clave, comida]));
export const COMIDA_POR_ACTIVIDAD = Object.fromEntries(COMIDAS.map((comida) => [comida.actividad, comida]));

// Letras con monstruo: las del menú de Mundo 1.
export const LETRAS = ["a", "l", "m", "s", "t"];

// Premio al completar una actividad: 3 sin errores, 2 con 1 o 2, 1 con 3 o más.
// Dibujar siempre da 1 (se gana al completar la letra).
export function premioPorErrores(actividad, errores) {
	if (actividad === "dibujar") {
		return 1;
	}
	if (errores <= 0) {
		return 3;
	}
	return errores <= 2 ? 2 : 1;
}
