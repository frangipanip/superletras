import { MUNDO4_SYLLABLES } from "./mundo4.js";
import { MUNDO5_SYLLABLES } from "./mundo5.js";

const silabas = (consonante) => ["A", "E", "I", "O", "U"].map((vocal) => consonante + vocal);

// Qué se traza en Dibujar en cada mundo, según la letra elegida en el menú (clave en minúscula).
// En Mundo 1 "a" son las vocales; las consonantes se trazan con cada vocal (LA, LE, LI, LO, LU),
// igual que en las otras actividades de sílabas de cada mundo.
export const DIBUJAR_POR_MUNDO = {
	1: { a: ["A", "E", "I", "O", "U"], l: silabas("L"), m: silabas("M"), s: silabas("S"), t: silabas("T") },
	2: { p: silabas("P"), n: silabas("N"), d: silabas("D"), f: silabas("F"), h: silabas("H") },
	3: { r: silabas("R"), rr: silabas("RR"), ar: ["ARA", "ERE", "IRI", "ORO", "URU"], y: silabas("Y"), ll: silabas("LL") },
	4: MUNDO4_SYLLABLES,
	5: MUNDO5_SYLLABLES,
	6: { b: silabas("B"), v: silabas("V"), "ñ": silabas("Ñ"), k: silabas("K"), x: silabas("X") }
};

// Letra por defecto de cada mundo si no llegó ninguna del menú.
export const PRIMERA_LETRA = { 1: "a", 2: "p", 3: "r", 4: "c", 5: "g", 6: "b" };

// Audio con el nombre de la vocal o la sílaba. Las de S y T de Mundo 1 están en mayúscula (salvo
// te.mp3): en el servidor Linux el nombre tiene que ser exacto.
export function audioDeTrazo(texto) {
	if (texto === "TE") return "te.mp3";
	if (/^[ST][AEIOU]$/.test(texto)) return `${texto}.mp3`;
	return `${texto.toLowerCase()}.mp3`;
}
