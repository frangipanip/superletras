import { img } from "./assets";

// Dibujos de Peluches de Mundo 1 (imagenes/peluches/<palabra>.png) que también usa Memotest.
// El nombre del archivo es la palabra sin tildes.
export const BANCO_PELUCHES = [
	"anillo", "arbol", "auto", "avion", "bebe", "cartuchera", "colectivo",
	"elefante", "escalera", "escoba", "espejo", "estrella", "frutilla",
	"guitarra", "iglu", "iguana", "iman", "indio", "isla",
	"lago", "lana", "lapiz", "lata", "leche", "lechuga", "leon", "leña",
	"libro", "licuadora", "lila", "limon", "linterna", "lobo", "loro",
	"luciernaga", "luna", "lupa", "luz",
	"mamadera", "mano", "mariposa", "martillo", "media", "megafono", "melon",
	"mesa", "microfono", "microondas", "miel", "milanesa", "mochila", "momia",
	"moneda", "mono", "moto", "mundo", "murcielago", "musica", "muñeca",
	"ojo", "oreja", "oruga", "oso", "oveja", "perro",
	"saco", "sal", "sandia", "sapo", "semaforo", "serpiente", "serrucho", "servilleta",
	"silbato", "silla", "sillon", "sirena", "soga", "sol", "sopa",
	"subibaja", "submarino", "superheroe", "suricata",
	"taco", "taladro", "tambor", "tapa", "taza", "techo", "tele", "telefono",
	"tenedor", "tesoro", "tiburon", "tijera", "timbre", "titere", "tiza", "toalla",
	"tomate", "toro", "torre", "torta", "tren", "tubo", "tucan", "tuerca", "tutu",
	"unicornio", "uno", "urraca", "uva", "uña"
];

export const VOCALES = ["a", "e", "i", "o", "u"];

// Sonidos de cada letra del menú de Mundo 1: con la A, las vocales; con las consonantes, sus sílabas.
export function sonidosDeLetra(letra) {
	return letra === "a" ? VOCALES : VOCALES.map((vocal) => letra + vocal);
}

export function palabrasQueEmpiezanCon(sonido) {
	return BANCO_PELUCHES.filter((palabra) => palabra.startsWith(sonido));
}

export function imagenPeluche(palabra) {
	return img(`peluches/${palabra}.png`);
}

export function imagenPelucheRespaldo(palabra) {
	return img(`peluches/${palabra}.webp`);
}

// Audio de la palabra (para sound()): algunas tienen una versión grabada para Peluches.
export function audioPalabraPeluche(palabra) {
	const usaAudioPeluche = /^[aeioul]/.test(palabra) ||
		["mamadera", "mano", "mariposa", "martillo", "media", "megafono"].includes(palabra);
	return `peluche/${palabra}${usaAudioPeluche ? "PELUCHE" : ""}.mp3`;
}

// Audio de una vocal o sílaba de Mundo 1 (para sound()); los nombres no siguen una sola regla.
export function audioSonidoMundo1(sonido) {
	if (sonido.length === 1) {
		return `${sonido.toLowerCase()}.mp3`;
	}
	const lower = sonido.toLowerCase();
	if (lower.startsWith("s")) {
		return `${sonido.toUpperCase()}.mp3`;
	}
	if (lower === "te") {
		return "te.mp3";
	}
	if (["la", "le", "li", "lo", "lu", "ma", "me", "mi", "mo", "mu"].includes(lower)) {
		return `${lower}.mp3`;
	}
	if (lower.startsWith("t")) {
		return `${sonido.toUpperCase()}.mp3`;
	}
	return `${lower}.wav`;
}
