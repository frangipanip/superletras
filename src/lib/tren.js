import { MUNDO4_SYLLABLES } from "./mundo4.js";

const conVocales = (letra) => ["A", "E", "I", "O", "U"].map((vocal) => `${letra}${vocal}`);

export const SILABAS_TREN = {
	2: Object.fromEntries(["p", "n", "d", "f", "h"].map((letra) => [letra, conVocales(letra.toUpperCase())])),
	3: {
		r: conVocales("R"), rr: conVocales("RR"), ar: ["ARA", "ERE", "IRI", "ORO", "URU"],
		y: ["YA", "YE", "YO", "YU"], ll: conVocales("LL")
	},
	4: MUNDO4_SYLLABLES,
	5: { g: ["GA", "GO", "GU"], ge: ["GE", "GI"], gu: ["GUE", "GUI"], j: conVocales("J"), "gü": ["GÜE", "GÜI"] },
	6: Object.fromEntries(["b", "v", "ñ", "k", "x"].map((letra) => [letra, conVocales(letra.toUpperCase())]))
};

export function crearConfigTren(mundo, letra) {
	const sequences = SILABAS_TREN[mundo][letra];
	return {
		sequences,
		sequenceTokens: Object.fromEntries(sequences.map((silaba) => [silaba,
			letra === "ar" ? Array.from(silaba) : [silaba.slice(0, -1), silaba.slice(-1)]
		])),
		distractores: letra === "gu" ? ["G"] : letra === "gü" ? ["GU"] : letra === "q" ? ["Q"] : null,
		speechAudios: {
			vagones: "Vagones.mp3",
			...Object.fromEntries(sequences.map((silaba) => [silaba, `${silaba.toLowerCase()}.mp3`])),
			fabuloso: "Fabuloso.mp3"
		}
	};
}

export function arteTren(mundo) {
	return mundo === 1
		? { fondo: "escenarioTren.png", locomotora: "locomotora.png", vagones: [1, 2, 3, 4].map((n) => `vagon${n}.png`) }
		: { fondo: `escenarioTrenM${mundo}.png`, locomotora: `locomotoraM${mundo}.png`, vagones: [`vagonM${mundo}.png`] };
}
