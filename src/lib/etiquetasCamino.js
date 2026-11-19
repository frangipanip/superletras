const ETIQUETAS_POR_MUNDO = {
	1: {
		inicio: "vocales",
		mariposas: "osito-gelatina",
		flores: "chupetin",
		peluches: "pedestal-con-peluche",
		tren: "trencito",
		dibujar: "lapiz"
	},
	2: {
		inicio: "vocales",
		mariposas: "mariposas",
		flores: "orugas",
		peluches: "luciernaga",
		tren: "trencito",
		dibujar: "lapiz"
	},
	3: {
		inicio: "vocales",
		mariposas: "bloque-feliz",
		flores: "animalito-de-bloques",
		peluches: "hamaca-de-bloques",
		tren: "trencito",
		dibujar: "lapiz"
	},
	4: {
		inicio: "vocales",
		mariposas: "pez",
		flores: "caballito-de-mar",
		peluches: "cofre",
		tren: "trencito",
		dibujar: "lapiz"
	},
	5: {
		inicio: "vocales",
		mariposas: "palanca",
		flores: "robot",
		peluches: "hamaca-robotica",
		tren: "trencito",
		dibujar: "lapiz"
	},
	6: {
		inicio: "vocales",
		mariposas: "hadas",
		flores: "flores-de-unicornio",
		peluches: "nubes",
		tren: "trencito",
		dibujar: "lapiz"
	}
};

const COLORES_LETRAS = {
	1: { a: "#410a4a", l: "#006633", m: "#b48b18", s: "#910b0b", t: "#17547f" },
	2: { p: "#410a4a", n: "#b48b18", d: "#17547f", f: "#910b0b", h: "#006633" },
	3: { r: "#f14c74", rr: "#ffc400", ar: "#10b7e5", y: "#80ca3e", ll: "#b36be2" },
	4: { c: "#a353ec", ce: "#50cb65", q: "#fdab02", z: "#e2344a", ch: "#01a3fb" },
	5: { g: "#c6281d", ge: "#c87900", gu: "#0878b4", j: "#27833a", "gü": "#7937a4" },
	6: { b: "#f14c74", v: "#ffc400", "ñ": "#10b7e5", k: "#80ca3e", x: "#b36be2" }
};

export function etiquetaCamino(mundo, actividad) {
	const etiqueta = ETIQUETAS_POR_MUNDO[mundo]?.[actividad];
	return etiqueta ? `etiquetas/${etiqueta}.png` : null;
}

export function imagenesEtiquetasDelMundo(mundo) {
	return [...new Set(Object.values(ETIQUETAS_POR_MUNDO[mundo] || {}))]
		.map((etiqueta) => `etiquetas/${etiqueta}.png`);
}

export function estiloMarcoEtiqueta(mundo, letra) {
	const color = COLORES_LETRAS[mundo]?.[letra?.toLowerCase()];
	return { "--etiqueta-color": color || "#410a4a" };
}
