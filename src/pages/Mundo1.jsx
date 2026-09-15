import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { CHARACTERS, img, sound } from "../lib/assets";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import "./Mundo1.css";

const MENU_OPTIONS = [
	{ key: "a", image: "Abtn.png", audio: "Vocales.m4a" },
	{ key: "l", image: "Lbtn.png", audio: "Ele.m4a" },
	{ key: "m", image: "Mbtn.png", audio: "Eme.m4a" },
	{ key: "s", image: "Sbtn.png", audio: "Ese.m4a" },
	{ key: "t", image: "Tbtn.png", audio: "Te.m4a" }
];

function readStoredOption() {
	const stored = readStorage(STORAGE_KEYS.mundo1MenuOption);
	return MENU_OPTIONS.some((option) => option.key === stored) ? stored : "a";
}

export default function Mundo1() {
	usePageTitle("Botón 1");
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const [selectedOption, setSelectedOption] = useState(readStoredOption);
	const [menuAudios] = useState(() =>
		Object.fromEntries(MENU_OPTIONS.map(({ key, audio }) => [key, runtime.audio(sound(audio), { preload: true })]))
	);

	function playMenuAudio(optionKey) {
		Object.values(menuAudios).forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		menuAudios[optionKey].play().catch(() => {});
	}

	function selectMenuOption(optionKey) {
		setSelectedOption(optionKey);
		writeStorage(STORAGE_KEYS.mundo1MenuOption, optionKey);
		playMenuAudio(optionKey);
	}

	useEffect(() => {
		selectMenuOption(readStoredOption());
	}, []);

	return (
		<div className="page page-mundo1">
			<UserNav />

			<div className="mundo1-scene">
				<button className="background-option" type="button" data-option="syllables" aria-label="Sílabas" onClick={() => navigate("/silabas")}></button>
				<button className="background-option" type="button" data-option="words" aria-label="Palabras"></button>
				<button className="background-option" type="button" data-option="sentences" aria-label="Oraciones"></button>

				{character && (
					<div className="mundo1-character" aria-label="Personaje seleccionado">
						<img src={CHARACTERS[character].image} alt={CHARACTERS[character].alt} />
					</div>
				)}

				<aside className="menu-panel" aria-label="Menú del mundo 1">
					<img src={img("MENUM1.png")} alt="" />
					{MENU_OPTIONS.map(({ key, image }) => (
						<button
							key={key}
							className={selectedOption === key ? "menu-option selected" : "menu-option"}
							type="button"
							data-option={key}
							aria-label={key.toUpperCase()}
							aria-pressed={selectedOption === key}
							onClick={() => selectMenuOption(key)}
						>
							<img src={img(image)} alt={key.toUpperCase()} />
						</button>
					))}
					<section className="letter-panel" data-option={selectedOption} aria-label="Letras del mundo">
						<span className="uppercase-letter">{selectedOption.toUpperCase()}</span>
						<span className="lowercase-letter">{selectedOption}</span>
					</section>
				</aside>
			</div>
		</div>
	);
}
