import { shuffle } from "./shuffle.js";

export const MUNDO5_SYLLABLES = {
	g: ["GA", "GO", "GU"], ge: ["GE", "GI"], gu: ["GUE", "GUI"],
	j: ["JA", "JE", "JI", "JO", "JU"], "gü": ["GÜE", "GÜI"]
};

export const MUNDO5_PRESENTACIONES = {
	g: "Esta es la letra G.mp3", ge: "Esta es la letra GE.mp3", gu: "Esta es la letra GUE.mp3",
	j: "Esta es la letra J.mp3", "gü": "Esta es la letra GÜE.mp3"
};

const SUAVES = [...MUNDO5_SYLLABLES.g, ...MUNDO5_SYLLABLES.gu, ...MUNDO5_SYLLABLES["gü"]];
const FUERTES = [...MUNDO5_SYLLABLES.ge, ...MUNDO5_SYLLABLES.j];

// GE/GI y JE/JI suenan igual: nunca se usan entre sí como respuestas equivocadas.
export function incorrectasMundo5(modo) {
	return shuffle(modo === "ge" || modo === "j" ? SUAVES : FUERTES).slice(0, 3);
}
