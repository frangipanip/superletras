// Actividades del camino de Mundo 1 y su tipo. Lo usan la app (src/pages/Mundo1.jsx) y queda
// en shared/ para que la API pueda distinguir las recompensas de sílabas y de palabras.
// "clave" es la misma que usa COMIDAS (shared/comidas.js) y la ruta es /<clave>.
// Las de palabras se desbloquean al evolucionar el monstruo de la letra.
export const TIPOS_ACTIVIDAD = { silabas: "silabas", palabras: "palabras" };

export const ACTIVIDADES = [
	{ clave: "inicio", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "mariposas", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "flores", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "peluches", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "tren", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "dibujar", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "memotest", tipo: TIPOS_ACTIVIDAD.silabas },
	{ clave: "barcos", tipo: TIPOS_ACTIVIDAD.palabras },
	{ clave: "pastel", tipo: TIPOS_ACTIVIDAD.palabras },
	{ clave: "puzzle", tipo: TIPOS_ACTIVIDAD.palabras }
];

export const ACTIVIDAD_POR_CLAVE = Object.fromEntries(ACTIVIDADES.map((actividad) => [actividad.clave, actividad]));

export function esActividadDePalabras(clave) {
	return ACTIVIDAD_POR_CLAVE[clave]?.tipo === TIPOS_ACTIVIDAD.palabras;
}
