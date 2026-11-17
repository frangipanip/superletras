import { MUNDO4_MOUTH_IMAGES } from "../lib/assets";
import { PeluchesPlataformas } from "./PeluchesMundo3";

// Palabras de Mundo 4 por letra y sonido. El sonido puede estar en el medio ("taZA", "oCHO"), por
// eso la consigna es "contiene". El dibujo equivocado es de otro sonido de la misma letra: nunca
// suena igual que el pedido (no se mezcla CE con SE ni Z con S).
// Imagen: peluches/MUNDO4/<id>.png. Audio: sonido/<personaje>/peluche/MUNDO4/<id>.mp3.
const GRUPOS = {
	c: {
		ca: ["casa", "cama"],
		co: ["copa", "conejo"],
		cu: ["cuna", "cubo"]
	},
	ce: {
		ce: ["cebra", "cepillo"],
		ci: ["cine", "cinta"]
	},
	q: {
		que: ["queso", "paquete"],
		qui: ["mosquito", "maquina"]
	},
	// ZU tiene una sola palabra: se pide una vez.
	z: {
		za: ["zapato", "taza"],
		zo: ["zorro", "pozo"],
		zu: ["azul"]
	},
	ch: {
		cha: ["chancho"],
		che: ["leche"],
		cho: ["chocolate", "ocho"],
		chu: ["chupete", "lechuza"]
	}
};
const ACENTOS = {
	maquina: "máquina"
};

export default function PeluchesMundo4() {
	return (
		<PeluchesPlataformas
			titulo="Peluches - Mundo 4"
			grupos={GRUPOS}
			acentos={ACENTOS}
			carpeta="MUNDO4"
			letraPorDefecto="c"
			mouthImages={MUNDO4_MOUTH_IMAGES}
			consignaAudio={(letra, consigna) => `${consigna}.mp3`}
			usaContiene={() => true}
			className="page-peluches-m4"
		/>
	);
}
