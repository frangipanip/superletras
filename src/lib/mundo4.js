import { shuffle } from "./shuffle.js";

export const MUNDO4_SYLLABLES = {
	c: ["CA", "CO", "CU"],
	ce: ["CE", "CI"],
	q: ["QUE", "QUI"],
	z: ["ZA", "ZE", "ZI", "ZO", "ZU"],
	ch: ["CHA", "CHE", "CHI", "CHO", "CHU"]
};

const C_SYLLABLES = ["CA", "CE", "CI", "CO", "CU"];
const S_T_SYLLABLES = ["SA", "SE", "SI", "SO", "SU", "TA", "TE", "TI", "TO", "TU"];

export function createMundo4IncorrectSyllables(mode) {
	const consonantSyllables = {
		c: S_T_SYLLABLES,
		ce: S_T_SYLLABLES,
		q: S_T_SYLLABLES,
		z: [...S_T_SYLLABLES.slice(0, 5), ...C_SYLLABLES],
		ch: [...S_T_SYLLABLES.slice(0, 5), ...C_SYLLABLES]
	};
	if (mode === "ce") {
		return [
			shuffle(MUNDO4_SYLLABLES.c)[0],
			...shuffle(consonantSyllables.ce).slice(0, 2)
		];
	}
	if (mode === "q") {
		return [
			shuffle(MUNDO4_SYLLABLES.c)[0],
			shuffle(MUNDO4_SYLLABLES.ce)[0],
			shuffle(S_T_SYLLABLES.slice(5))[0]
		];
	}
	return shuffle(consonantSyllables[mode]).slice(0, 3);
}
