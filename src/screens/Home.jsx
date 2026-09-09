import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHARACTER_KEY, CHARACTERS, readStorage, writeStorage } from "../lib/storage.js";
import "../styles/home.css";

const CHARACTER_KEYS = Object.keys(CHARACTERS);

export default function Home() {
	const navigate = useNavigate();
	const [selected, setSelected] = useState(() => {
		const saved = readStorage(CHARACTER_KEY);
		return CHARACTER_KEYS.includes(saved) ? saved : null;
	});

	function selectCharacter(character) {
		setSelected(character);
		writeStorage(CHARACTER_KEY, character);
	}

	return (
		<div className="screen home-screen">
			<main className={`characters-row${selected ? " has-selection" : ""}`}>
				<CharacterButton id="supernena" selected={selected} onSelect={selectCharacter} />

				<button
					className="play-button"
					type="button"
					aria-label="Reproducir"
					disabled={!selected}
					onClick={() => {
						navigate("/mundos");
					}}
				>
					<img src="/assets/imagenes/boton.png" alt="Reproducir" />
				</button>

				<CharacterButton id="supernene" selected={selected} onSelect={selectCharacter} />
			</main>
		</div>
	);
}

function CharacterButton({ id, selected, onSelect }) {
	const { label, image } = CHARACTERS[id];
	const isSelected = selected === id;

	return (
		<button
			className={`character-button${isSelected ? " selected" : ""}`}
			type="button"
			aria-label={`Elegir ${label}`}
			aria-pressed={selected ? isSelected : undefined}
			onClick={() => onSelect(id)}
		>
			<img src={image} alt={label} />
		</button>
	);
}
