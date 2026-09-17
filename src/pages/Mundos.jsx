import { useEffect } from "react";
import { useNavigate } from "react-router";
import UserNav from "../components/UserNav";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { CHARACTERS, img, preloadImages } from "../lib/assets";
import { MUNDO1_IMAGES } from "./Mundo1";
import "./Mundos.css";

const LEVEL_ROWS = [
	[1, 2, 3],
	[4, 5, 6]
];

// Solo el nivel 1 tiene contenido por ahora.
const LEVEL_ROUTES = { 1: "/mundo1" };

export default function Mundos() {
	usePageTitle("Superletras - Mundos");
	const navigate = useNavigate();
	const [character, selectCharacter] = useSelectedCharacter();

	// Mientras se elige personaje y nivel, se van bajando las imágenes del Mundo 1.
	useEffect(() => {
		preloadImages(MUNDO1_IMAGES);
	}, []);

	return (
		<div className="page page-mundos">
			<UserNav />

			<main className={character ? "worlds-row has-selection" : "worlds-row"} aria-label="Selección de mundo">
				{Object.entries(CHARACTERS).map(([id, { image, alt }]) => (
					<button
						key={id}
						className={character === id ? "hero-button selected" : "hero-button"}
						type="button"
						data-character={id}
						aria-label={`Elegir ${alt}`}
						aria-pressed={character === id}
						onClick={() => selectCharacter(id)}
					>
						<img src={image} alt={alt} />
					</button>
				))}

				<section className="levels-layout" aria-label="Selección de nivel">
					{LEVEL_ROWS.map((row) => (
						<div className="level-row" key={row[0]}>
							{row.map((level) => (
								<button
									key={level}
									className={LEVEL_ROUTES[level] ? "level-button" : "level-button unavailable"}
									type="button"
									disabled={!LEVEL_ROUTES[level]}
									aria-label={`Nivel ${level}`}
									onClick={LEVEL_ROUTES[level] ? () => navigate(LEVEL_ROUTES[level]) : undefined}
								>
									<img src={img(`${level}btn.png`)} alt={`Nivel ${level}`} />
								</button>
							))}
						</div>
					))}
				</section>
			</main>
		</div>
	);
}
