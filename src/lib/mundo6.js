import { shuffle } from "./shuffle.js";

// Sílabas de Mundo 6 por letra del menú (en minúscula), para Mariposas y Flores.
export const MUNDO6_SYLLABLES = {
	b: ["BA", "BE", "BI", "BO", "BU"],
	v: ["VA", "VE", "VI", "VO", "VU"],
	"ñ": ["ÑA", "ÑE", "ÑI", "ÑO", "ÑU"],
	k: ["KA", "KE", "KI", "KO", "KU"],
	x: ["XA", "XE", "XI", "XO", "XU"]
};

// Nombre y sonido de la letra ("B larga suena B", "eñe suena ñ"): el mismo audio del menú.
export const MUNDO6_LETRA_AUDIO = {
	b: "suenaB.mp3", v: "suenaV.mp3", "ñ": "suenaÑ.mp3", k: "suenaK.mp3", x: "suenaX.mp3"
};

// B y V suenan igual: nunca se usan entre sí como respuestas equivocadas.
const NO_MEZCLAR = { b: ["v"], v: ["b"] };

export function incorrectasMundo6(modo) {
	const otras = Object.keys(MUNDO6_SYLLABLES).filter((letra) => letra !== modo && !NO_MEZCLAR[modo]?.includes(letra));
	return shuffle(otras.flatMap((letra) => MUNDO6_SYLLABLES[letra])).slice(0, 3);
}
