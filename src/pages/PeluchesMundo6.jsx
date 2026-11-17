import { PeluchesPlataformas } from "./PeluchesMundo3";

// Palabras de Mundo 6 por letra del menú (en minúscula) y sonido, con consigna "contiene" (la X va
// casi siempre en el medio: taXI, saXO). En la Ñ, MOÑO se contrasta con MONO: la única diferencia es
// la virgulilla. Imagen: peluches/MUNDO6/<id>.png. Audio: sonido/<personaje>/peluche/MUNDO6/<id>.mp3.
const GRUPOS = {
	b: {
		ba: ["barco"],
		be: ["bebe"],
		bo: ["bota", "boxeo"],
		bu: ["burro"]
	},
	v: {
		va: ["vaca", "vaso"],
		ve: ["vela"],
		vi: ["violin"]
	},
	"ñ": {
		"ña": ["araña", "piña", "uña"],
		"ño": ["moño", "niño"]
	},
	k: {
		ka: ["karate"],
		ki: ["kiwi", "kilo"],
		ko: ["koala"]
	},
	x: {
		xa: ["examen"],
		xe: ["boxeo"],
		xi: ["taxi"],
		xo: ["saxo"]
	}
};
const ACENTOS = {
	bebe: "bebé",
	violin: "violín"
};
const PARES = {
	"moño": "mono"
};

export default function PeluchesMundo6() {
	return (
		<PeluchesPlataformas
			titulo="Peluches - Mundo 6"
			grupos={GRUPOS}
			acentos={ACENTOS}
			pares={PARES}
			carpeta="MUNDO6"
			letraPorDefecto="b"
			consignaAudio={(letra, consigna) => `${consigna}.mp3`}
			usaContiene={() => true}
			className="page-peluches-m6"
		/>
	);
}
