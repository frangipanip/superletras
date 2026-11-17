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

// Hamaca de cintas arcoíris con asiento de nube dorada (medidas en fracciones de la imagen, ver PeluchesPlataformas).
const HAMACA_M6 = {
	tipo: "hamaca",
	imagen: "hamaca.png",
	proporcion: 935 / 600,
	objeto: { abajo: 0.26, alto: 0.45, ancho: 0.6 },
	placa: { y: 0.85, alto: 0.11, ancho: 0.64 }
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
			soporte={HAMACA_M6}
			className="page-peluches-m6"
		/>
	);
}
