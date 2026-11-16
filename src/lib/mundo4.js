import { shuffle } from "./shuffle.js";

export const MUNDO4_SYLLABLES = {
	c: ["CA", "CO", "CU"],
	ce: ["CE", "CI"],
	q: ["QUE", "QUI"],
	z: ["ZA", "ZE", "ZI", "ZO", "ZU"],
	ch: ["CHA", "CHE", "CHI", "CHO", "CHU"]
};

// CE/CI y QUE/QUI se practican mezcladas con CA, CO, CU: el contraste es lo que enseña la regla.
export const MUNDO4_CONTRASTE = {
	ce: [...MUNDO4_SYLLABLES.ce, ...MUNDO4_SYLLABLES.c],
	q: [...MUNDO4_SYLLABLES.q, ...MUNDO4_SYLLABLES.c]
};

const C_SYLLABLES = ["CA", "CE", "CI", "CO", "CU"];
const S_SYLLABLES = ["SA", "SE", "SI", "SO", "SU"];
const T_SYLLABLES = ["TA", "TE", "TI", "TO", "TU"];
// Para Z y CE: ninguna de estas suena igual que ZA…ZU ni que CE, CI (la S y la C suave sí).
const OTRO_SONIDO = [
	...T_SYLLABLES,
	"MA", "ME", "MI", "MO", "MU",
	"LA", "LE", "LI", "LO", "LU",
	"PA", "PE", "PI", "PO", "PU"
];

// Sílabas equivocadas de una ronda. Nunca incluye una que suene igual que las correctas:
// en el Río de la Plata ZA = SA y CE = SE, así que elegir bien de oído se marcaba como error.
export function createMundo4IncorrectSyllables(mode) {
	if (mode === "ce") {
		return [
			shuffle(MUNDO4_SYLLABLES.c)[0],
			...shuffle(OTRO_SONIDO).slice(0, 2)
		];
	}
	if (mode === "q") {
		return [
			shuffle(MUNDO4_SYLLABLES.c)[0],
			shuffle(MUNDO4_SYLLABLES.ce)[0],
			shuffle(T_SYLLABLES)[0]
		];
	}
	if (mode === "z") {
		return shuffle(OTRO_SONIDO).slice(0, 3);
	}
	if (mode === "ch") {
		return shuffle([...S_SYLLABLES, ...C_SYLLABLES]).slice(0, 3);
	}
	return shuffle([...S_SYLLABLES, ...T_SYLLABLES]).slice(0, 3);
}
