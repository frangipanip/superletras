import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton.jsx";
import { GuestProfile } from "../components/GuestProfile.jsx";
import { CHARACTER_KEY, CHARACTERS, readStorage, writeStorage } from "../lib/storage.js";
import "../styles/mundos.css";

const CHARACTER_KEYS = Object.keys(CHARACTERS);
const LEVEL_ROWS = [
	[1, 2, 3],
	[4, 5, 6]
];

function detectMobileLayout() {
	const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
	return mobileUserAgent || window.innerWidth <= 600;
}

export default function Mundos() {
	const navigate = useNavigate();
	const [isMobileLayout] = useState(detectMobileLayout);
	const [selected, setSelected] = useState(() => {
		const saved = readStorage(CHARACTER_KEY);
		return CHARACTER_KEYS.includes(saved) ? saved : null;
	});

	function selectCharacter(character) {
		setSelected(character);
		writeStorage(CHARACTER_KEY, character);
	}

	return (
		<div className={`screen mundos-screen${isMobileLayout ? " mobile-layout" : ""}`}>
			<nav aria-label="Navegación y usuario">
				<BackButton />
				<GuestProfile />
			</nav>

			<main
				className={`worlds-row${selected ? " has-selection" : ""}`}
				aria-label="Selección de mundo"
			>
				{CHARACTER_KEYS.map((id) => {
					const { label, image } = CHARACTERS[id];
					const isSelected = selected === id;

					return (
						<button
							key={id}
							className={`hero-button${isSelected ? " selected" : ""}`}
							type="button"
							data-character={id}
							aria-label={`Elegir ${label}`}
							aria-pressed={selected ? isSelected : undefined}
							onClick={() => selectCharacter(id)}
						>
							<img src={image} alt={label} />
						</button>
					);
				})}

				<section className="levels-layout" aria-label="Selección de nivel">
					{LEVEL_ROWS.map((row) => (
						<div className="level-row" key={row.join("-")}>
							{row.map((level) => (
								<button
									key={level}
									className="level-button"
									type="button"
									aria-label={`Nivel ${level}`}
									onClick={() => {
										// Por ahora solo el nivel 1 tiene pantalla propia.
										if (level === 1) {
											navigate("/mundo1");
										}
									}}
								>
									<img src={`/assets/imagenes/${level}btn.png`} alt={`Nivel ${level}`} />
								</button>
							))}
						</div>
					))}
				</section>
			</main>
		</div>
	);
}
