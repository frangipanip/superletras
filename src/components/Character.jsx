import { useLocation } from "react-router";
import { CHARACTERS, MUNDO1_CHARACTERS, MUNDO2_CHARACTERS, MUNDO3_CHARACTERS, MUNDO4_CHARACTERS } from "../lib/assets";

// Personaje elegido en el inicio; no se muestra si todavia no se eligio ninguno.
export default function Character({ character, mouth, image, celebrating = false, label = "Personaje", onClick }) {
	const location = useLocation();
	if (!character) {
		return null;
	}
	const isMundo1 = location.state?.world === 1;
	const isMundo2 = location.state?.world === 2;
	const isMundo3 = location.state?.world === 3;
	const isMundo4 = location.state?.world === 4;
	const characters = isMundo1 ? MUNDO1_CHARACTERS : isMundo2 ? MUNDO2_CHARACTERS : isMundo3 ? MUNDO3_CHARACTERS : isMundo4 ? MUNDO4_CHARACTERS : CHARACTERS;
	const { image: characterImage, alt } = characters[character];
	const className = ["selected-character", isMundo1 && "dulce-character", isMundo2 && "mundo2-character", isMundo3 && "mundo3-character", isMundo4 && "mundo4-character", celebrating && "celebrating"].filter(Boolean).join(" ");

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
					className={!isMundo1 && !isMundo2 && !isMundo3 && !isMundo4 && mouth.shifted ? "character-mouth shifted-mouth" : `character-mouth${isMundo3 ? " mundo3-mouth" : isMundo4 ? " mundo4-mouth" : ""}`}
					src={mouth.src}
					alt=""
					hidden={!mouth.visible}
				/>
			)}
		</button>
	);
}
