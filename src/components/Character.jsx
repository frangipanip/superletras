import { CHARACTERS } from "../lib/assets";

// Personaje elegido en el inicio; no se muestra si todavia no se eligio ninguno.
export default function Character({ character, mouth, celebrating = false, label = "Personaje", onClick }) {
	if (!character) {
		return null;
	}
	const { image, alt } = CHARACTERS[character];
	const className = celebrating ? "selected-character celebrating" : "selected-character";

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
					className={mouth.shifted ? "character-mouth shifted-mouth" : "character-mouth"}
					src={mouth.src}
					alt=""
					hidden={!mouth.visible}
				/>
			)}
		</button>
	);
}
