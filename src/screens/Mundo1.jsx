import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton.jsx";
import { GuestProfile } from "../components/GuestProfile.jsx";
import { CHARACTER_KEY, CHARACTERS, readStorage } from "../lib/storage.js";
import "../styles/mundo1.css";

const MENU_OPTIONS = [
	{ id: "a", letter: "a", image: "/assets/imagenes/Abtn.png", sound: "/assets/sonidos/Vocales.m4a" },
	{ id: "l", letter: "l", image: "/assets/imagenes/Lbtn.png", sound: "/assets/sonidos/Ele.m4a" },
	{ id: "m", letter: "m", image: "/assets/imagenes/Mbtn.png", sound: "/assets/sonidos/Eme.m4a" },
	{ id: "s", letter: "s", image: "/assets/imagenes/Sbtn.png", sound: "/assets/sonidos/Ese.m4a" },
	{ id: "t", letter: "t", image: "/assets/imagenes/Tbtn.png", sound: "/assets/sonidos/Te.m4a" }
];

const BACKGROUND_OPTIONS = [
	// Por ahora solo las silabas tienen pantalla propia.
	{ id: "syllables", label: "Sílabas", to: "/mundo1/silabas-a" },
	{ id: "words", label: "Palabras" },
	{ id: "sentences", label: "Oraciones" }
];

export default function Mundo1() {
	const navigate = useNavigate();
	const [selectedOption, setSelectedOption] = useState("a");
	const audiosRef = useRef(null);

	const character = useMemo(() => {
		const saved = readStorage(CHARACTER_KEY);
		return CHARACTERS[saved] ? { id: saved, ...CHARACTERS[saved] } : null;
	}, []);

	const option = MENU_OPTIONS.find((item) => item.id === selectedOption);

	useEffect(() => {
		const audios = Object.fromEntries(
			MENU_OPTIONS.map((item) => {
				const audio = new Audio(item.sound);
				audio.preload = "auto";
				return [item.id, audio];
			})
		);
		audiosRef.current = audios;

		// El navegador puede bloquear este primer play hasta que haya un gesto.
		playMenuAudio("a");

		return () => {
			Object.values(audios).forEach((audio) => {
				audio.pause();
				audio.src = "";
			});
			audiosRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function playMenuAudio(optionId) {
		const audios = audiosRef.current;
		const audio = audios?.[optionId];
		if (!audio) {
			return;
		}

		Object.values(audios).forEach((menuAudio) => {
			menuAudio.pause();
			menuAudio.currentTime = 0;
		});
		audio.play().catch(() => {});
	}

	return (
		<div className="screen mundo1-screen">
			<nav aria-label="Navegación y usuario">
				<BackButton />
				<GuestProfile />
			</nav>

			{BACKGROUND_OPTIONS.map(({ id, label, to }) => (
				<button
					key={id}
					className="background-option"
					type="button"
					data-option={id}
					aria-label={label}
					onClick={() => {
						if (to) {
							navigate(to);
						}
					}}
				/>
			))}

			{character ? (
				<div className="selected-character" aria-label="Personaje seleccionado">
					<img src={character.image} alt={character.label} />
				</div>
			) : null}

			<aside className="menu-panel" aria-label="Menú del mundo 1">
				<img src="/assets/imagenes/MENUM1.png" alt="" />

				{MENU_OPTIONS.map(({ id, image }) => (
					<button
						key={id}
						className={`menu-option${selectedOption === id ? " selected" : ""}`}
						type="button"
						data-option={id}
						aria-label={id.toUpperCase()}
						aria-pressed={selectedOption === id}
						onClick={() => {
							setSelectedOption(id);
							playMenuAudio(id);
						}}
					>
						<img src={image} alt={id.toUpperCase()} />
					</button>
				))}

				{option ? (
					<section
						className="letter-panel"
						data-option={option.id}
						aria-label="Letras del mundo"
					>
						<span className="uppercase-letter">{option.letter.toUpperCase()}</span>
						<span className="lowercase-letter">{option.letter}</span>
					</section>
				) : null}
			</aside>
		</div>
	);
}
