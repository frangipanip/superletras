import { img } from "../lib/assets";
import "./CharacterLocator.css";

export default function CharacterLocator({ character, direction, onClick }) {
	if (!character) return null;

	return (
		<button
			className={`character-locator direction-${direction}`}
			type="button"
			aria-label="Ir hasta mi personaje"
			onClick={onClick}
		>
			<img src={img(character === "supernena" ? "cabezasupernena.png" : "cabezasupernene.png")} alt="" draggable={false} />
		</button>
	);
}
