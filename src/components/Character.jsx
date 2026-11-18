import { useLocation } from "react-router";
import { CHARACTERS, MUNDO1_CHARACTERS, MUNDO2_CHARACTERS, MUNDO3_CHARACTERS, MUNDO4_CHARACTERS, MUNDO5_CHARACTERS } from "../lib/assets";

// Personajes de cada mundo. Sus bocas (superboca<Mundo>N.png) son del mismo tamaño que el
// dibujo y van encima ocupando todo; sin mundo se usan el personaje y la boca chica de siempre.
const MUNDOS = {
	1: { characters: MUNDO1_CHARACTERS, className: "dulce-character" },
	2: { characters: MUNDO2_CHARACTERS, className: "mundo2-character" },
	3: { characters: MUNDO3_CHARACTERS, className: "mundo3-character" },
	4: { characters: MUNDO4_CHARACTERS, className: "mundo4-character" },
	// No "mundo5-character": esa clase es la del personaje del menú (Mundo5.css, global).
	5: { characters: MUNDO5_CHARACTERS, className: "robot-character" }
};

// Personaje elegido en el inicio; no se muestra si todavia no se eligio ninguno.
export default function Character({ character, mouth, image, celebrating = false, label = "Personaje", onClick }) {
	const location = useLocation();
	if (!character) {
		return null;
	}
	const mundo = MUNDOS[location.state?.world];
	const { image: characterImage, alt } = (mundo ? mundo.characters : CHARACTERS)[character];
	const className = ["selected-character", mundo?.className, celebrating && "celebrating"].filter(Boolean).join(" ");
	const mouthClassName = ["character-mouth", mundo ? "mouth-overlay" : mouth?.shifted && "shifted-mouth"].filter(Boolean).join(" ");

	return (
		<button
			className={className}
			type="button"
			aria-label={label}
			aria-pressed={mouth ? mouth.visible : undefined}
			onClick={onClick}
		>
			<img src={image || characterImage} alt={alt} />
			{mouth && (
				<img
					className={mouthClassName}
					src={mouth.src}
					alt=""
					hidden={!mouth.visible}
				/>
			)}
		</button>
	);
}
