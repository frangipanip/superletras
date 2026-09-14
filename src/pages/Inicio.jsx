import { useNavigate } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { CHARACTERS, img } from "../lib/assets";
import "./Inicio.css";

function CharacterButton({ id, selected, onSelect }) {
	const { image, alt } = CHARACTERS[id];
	return (
		<button
			className={selected ? "character-button selected" : "character-button"}
			type="button"
			aria-label={`Elegir ${alt}`}
			aria-pressed={selected}
			onClick={() => onSelect(id)}
		>
			<img src={image} alt={alt} />
		</button>
	);
}

export default function Inicio() {
	usePageTitle("Superletras");
	const navigate = useNavigate();
	const [character, selectCharacter] = useSelectedCharacter();

	return (
		<div className="page page-inicio">
			<main className={character ? "characters-row has-selection" : "characters-row"}>
				<CharacterButton id="supernena" selected={character === "supernena"} onSelect={selectCharacter} />

				<button className="play-button" type="button" aria-label="Reproducir" disabled={!character} onClick={() => navigate("/mundos")}>
					<img src={img("boton.png")} alt="Reproducir" />
				</button>

				<CharacterButton id="supernene" selected={character === "supernene"} onSelect={selectCharacter} />
			</main>
		</div>
	);
}
