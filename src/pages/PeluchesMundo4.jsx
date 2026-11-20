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

// Cofres abiertos en la arena (en lugar de hamacas): el dibujo sale de adentro y la palabra va en el
// cartel del frente. Medidas en fracciones de la imagen (ver PeluchesPlataformas); la pared de adelante
// (desde `frente`) se dibuja otra vez por encima del dibujo.
const COFRE = {
	tipo: "cofre",
	imagen: "cofre.png",
	imagenInicial: "cofreCerrado.png",
	proporcion: 534 / 640,
	abajo: 6,
	altos: { 2: 0.4, 3: 0.33 },
	objeto: { abajo: 0.38, alto: 0.95, ancho: 0.6 },
	placa: { y: 0.75, alto: 0.17, ancho: 0.66 },
	frente: 0.585
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
			soporte={COFRE}
			className="page-peluches-m4"
		/>
	);
}
