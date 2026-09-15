import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { CHARACTERS, img, sound } from "../lib/assets";
import "./Mundo1.css";

const MENU_OPTIONS = [
	{ key: "a", image: "Abtn.png", audio: "Vocales.m4a" },
	{ key: "l", image: "Lbtn.png", audio: "Ele.m4a" },
	{ key: "m", image: "Mbtn.png", audio: "Eme.m4a" },
	{ key: "s", image: "Sbtn.png", audio: "Ese.m4a" },
	{ key: "t", image: "Tbtn.png", audio: "Te.m4a" }
];

const PATH_BUTTONS = [
	{ left: 23.5, top: 80 },
	{ left: 35.9, top: 67 },
	{ left: 45, top: 81 },
	{ left: 50.9, top: 54 },
	{ left: 57.4, top: 54 },
	{ left: 60, top: 76 },
	{ left: 69, top: 73 },
	{ left: 76.8, top: 80 },
	{ left: 85.6, top: 68 },
	{ left: 94, top: 80 }
];

// Desplazamiento con el mouse: al acercarse a un borde la escena avanza sola,
// más rápido cuanto más pegado al borde.
const EDGE_ZONE = 0.15; // fracción del ancho de la pantalla
const EDGE_MAX_SPEED = 900; // px por segundo en el borde mismo

export default function Mundo1() {
	usePageTitle("Botón 1");
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const [selectedOption, setSelectedOption] = useState(null);
	const pageRef = useRef(null);
	// Estado del auto-scroll por borde; lo leen callbacks de requestAnimationFrame.
	const edge = useRef({ speed: 0, running: false, position: 0, lastFrame: 0 }).current;
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
		playMenuAudio(optionKey);
	}

	function stepEdgeScroll() {
		const page = pageRef.current;
		const now = performance.now();
		const elapsed = Math.min(now - edge.lastFrame, 50) / 1000;
		edge.lastFrame = now;
		if (!page || edge.speed === 0) {
			edge.running = false;
			return;
		}
		// La posición se acumula con decimales: scrollLeft redondea y a baja velocidad no avanzaría.
		const maxScroll = page.scrollWidth - page.clientWidth;
		edge.position = Math.max(0, Math.min(maxScroll, edge.position + edge.speed * elapsed));
		page.scrollLeft = edge.position;
		// Llegó al final de la escena: se frena hasta que el mouse se vuelva a mover.
		if ((edge.speed < 0 && edge.position === 0) || (edge.speed > 0 && edge.position === maxScroll)) {
			edge.running = false;
			return;
		}
		runtime.requestAnimationFrame(stepEdgeScroll);
	}

	function handlePointerMove(event) {
		// En touch se arrastra con el scroll nativo; el borde es solo para el mouse.
		if (event.pointerType !== "mouse" || event.target.closest(".top-nav")) {
			edge.speed = 0;
			return;
		}
		const width = window.innerWidth;
		const zone = width * EDGE_ZONE;
		const x = event.clientX;
		if (x > width - zone) {
			edge.speed = (EDGE_MAX_SPEED * (x - (width - zone))) / zone;
		} else if (x < zone) {
			edge.speed = (-EDGE_MAX_SPEED * (zone - x)) / zone;
		} else {
			edge.speed = 0;
		}
		if (edge.speed !== 0 && !edge.running) {
			edge.running = true;
			edge.position = pageRef.current.scrollLeft;
			edge.lastFrame = performance.now();
			runtime.requestAnimationFrame(stepEdgeScroll);
		}
	}

	function stopEdgeScroll() {
		edge.speed = 0;
	}

	return (
		<div
			ref={pageRef}
			className="page page-mundo1"
			onPointerMove={handlePointerMove}
			onPointerLeave={stopEdgeScroll}
			onScroll={() => {
				if (!edge.running) {
					edge.position = pageRef.current.scrollLeft;
				}
			}}
		>
			<UserNav />

			<div className="mundo1-scene">
				<img className="mundo1-background" src={img("FONDOM1.jpg")} alt="" draggable={false} />
				{PATH_BUTTONS.map(({ left, top }, index) => (
					<button
						key={`${left}-${top}`}
						className={`path-button path-button-${selectedOption || "disabled"}`}
						type="button"
						disabled={!selectedOption}
						style={{ left: `${left}%`, top: `${top}%` }}
						aria-label={`Actividad del camino ${index + 1}`}
					>
						<img src={img("boton.svg")} alt="" draggable={false} />
					</button>
				))}
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
				</aside>
			</div>
		</div>
	);
}
