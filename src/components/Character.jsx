import { useLocation } from "react-router";
import { CHARACTERS, MUNDO1_CHARACTERS } from "../lib/assets";

// Personaje elegido en el inicio; no se muestra si todavia no se eligio ninguno.
export default function Character({ character, mouth, celebrating = false, label = "Personaje", onClick }) {
	const location = useLocation();
	if (!character) {
		return null;
	}
	const isMundo1 = location.state?.world === 1;
	const { image, alt } = (isMundo1 ? MUNDO1_CHARACTERS : CHARACTERS)[character];
	const className = ["selected-character", isMundo1 && "dulce-character", celebrating && "celebrating"].filter(Boolean).join(" ");

	return (
		<button
			className={className}
			type="button"
			aria-label={label}
			aria-pressed={mouth ? mouth.visible : undefined}
			onClick={onClick}
		>
			<img src={image} alt={alt} />
			{mouth && (
				<img
					className={!isMundo1 && mouth.shifted ? "character-mouth shifted-mouth" : "character-mouth"}
					src={mouth.src}
					alt=""
					hidden={!mouth.visible}
				/>
			)}
		</button>
	);
}
