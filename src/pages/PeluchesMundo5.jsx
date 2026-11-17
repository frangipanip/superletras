import { MUNDO5_MOUTH_IMAGES } from "../lib/assets";
import { PeluchesPlataformas } from "./PeluchesMundo3";

// Palabras de Mundo 5 por letra del menú (en minúscula) y sonido, con consigna "contiene". El dibujo
// equivocado es de otro sonido de la misma letra: GE nunca se contrasta con JE, ni GUE con GE.
// Imagen: peluches/MUNDO5/<id>.png. Audio: sonido/<personaje>/peluche/MUNDO5/<id>.mp3.
const GRUPOS = {
	g: {
		ga: ["gato"],
		go: ["goma", "gota"],
		gu: ["gusano", "laguna"]
	},
	ge: {
		ge: ["gente", "gelatina"],
		gi: ["gigante", "girasol"]
	},
	gu: {
		gue: ["juguete", "manguera", "hormiguero"],
		gui: ["guitarra", "aguila"]
	},
	j: {
		ja: ["jabon", "jaula", "abeja"],
		ji: ["jirafa"],
		jo: ["ojo"],
		ju: ["jugo"]
	},
	"gü": {
		"güe": ["cigüeña"],
		"güi": ["pingüino"]
	}
};
const ACENTOS = {
	jabon: "jabón",
	aguila: "águila"
};

// Hamaca de cadenas con asiento robot (medidas en fracciones de la imagen, ver PeluchesPlataformas).
const HAMACA_M5 = {
	tipo: "hamaca",
	imagen: "hamaca.png",
	proporcion: 1041 / 600,
	objeto: { abajo: 0.25, alto: 0.46, ancho: 0.6 },
	placa: { y: 0.855, alto: 0.1, ancho: 0.72 }
};

export default function PeluchesMundo5() {
	return (
		<PeluchesPlataformas
			titulo="Peluches - Mundo 5"
			grupos={GRUPOS}
			acentos={ACENTOS}
			carpeta="MUNDO5"
			letraPorDefecto="g"
			mouthImages={MUNDO5_MOUTH_IMAGES}
			consignaAudio={(letra, consigna) => `${consigna}.mp3`}
			usaContiene={() => true}
			soporte={HAMACA_M5}
			className="page-peluches-m5"
		/>
	);
}
