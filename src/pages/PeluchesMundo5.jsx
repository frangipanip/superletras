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
			className="page-peluches-m5"
		/>
	);
}
