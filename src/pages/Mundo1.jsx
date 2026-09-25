import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Monstruo, { imagenMonstruo } from "../components/Monstruo";
import Tornado from "../components/Tornado";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, MOUTH_IMAGES, img, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
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
	{ left: 62, top: 73 },
	{ left: 69, top: 73 },
	{ left: 76.8, top: 80 },
	{ left: 85.6, top: 68 },
	{ left: 94, top: 80 }
];

const ACTIVITY_SIGN_IMAGES = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"MEMOTESTbtn.png"
];

// Todo lo que muestra la pantalla al entrar; Mundos lo precarga para que no aparezca de a partes.
export const MUNDO1_IMAGES = [
	img("FONDOM1.jpg"),
	img("MENUM1.png"),
	img("boton.svg"),
	img("GLOBOSbtn.png"),
	...ACTIVITY_SIGN_IMAGES.map(img),
	...MENU_OPTIONS.map(({ image }) => img(image)),
	...MENU_OPTIONS.map(({ key }) => imagenMonstruo(key)),
	...MOUTH_IMAGES
];

const PATH_ROUTES = ["/inicio", "/mariposas", "/flores", "/peluches", "/tren", "/dibujar", "/memotest", null, null, null];

// Índices de PATH_ROUTES habilitados por letra: el resto del camino queda apagado
// hasta que la actividad tenga los audios de esa letra. Sin entrada, la letra no abre nada.
const AVAILABLE_ACTIVITIES = {
	a: [0, 1, 2, 3, 4, 5, 6],
	l: [0, 1, 2, 3, 4, 5, 6],
	m: [0, 1, 2, 3, 4, 5, 6],
	s: [0, 1, 2, 3, 4, 5, 6],
	t: [0, 1, 2, 3, 4, 5, 6]
};

// Desplazamiento con el mouse: al acercarse a un borde la escena avanza sola,
// más rápido cuanto más pegado al borde.
const EDGE_ZONE = 0.15; // fracción del ancho de la pantalla
const EDGE_MAX_SPEED = 900; // px por segundo en el borde mismo

// Viaje en tornado al elegir una actividad: el héroe se va girando y reaparece en el botón.
// Deben coincidir con las duraciones de mundo1-spin-out / mundo1-spin-in en Mundo1.css.
const TORNADO_OUT_MS = 1100;
const TORNADO_IN_MS = 1100;
const TORNADO_PAUSE_MS = 250;

// Ubica al personaje parado junto a un botón del camino.
function getPerchStyle(index) {
	const { left, top } = PATH_BUTTONS[index];
	return { left: `${left}%`, top: `${top}%` };
}

export default function Mundo1() {
	usePageTitle("Mundo 1");
	const navigate = useNavigate();
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [selectedOption, setSelectedOption] = useState(() => readStorage(STORAGE_KEYS.mundo1MenuOption));
	const pageRef = useRef(null);
	// Viaje en curso: { index, stage: "out" | "in" } o null.
	const [travel, setTravel] = useState(null);
	// Botón de la última actividad visitada: al volver con "Volver", el personaje queda parado junto a él.
	const perchIndex = PATH_BUTTONS[location.state?.activityIndex] ? location.state.activityIndex : null;
	const [introAudio] = useState(() => runtime.audio(sound("Inicio Mundos.mp4"), { preload: true }));
	// Estado del auto-scroll por borde; lo leen callbacks de requestAnimationFrame.
	const edge = useRef({ speed: 0, running: false, position: 0, lastFrame: 0 }).current;
	const [menuAudios] = useState(() =>
		Object.fromEntries(MENU_OPTIONS.map(({ key, audio }) => [key, runtime.audio(sound(audio), { preload: true })]))
	);
	const availableActivities = AVAILABLE_ACTIVITIES[selectedOption] || null;

	function isActivityAvailable(index) {
		return Boolean(availableActivities && availableActivities.indexOf(index) !== -1);
	}

	function stopMenuAudios() {
		Object.values(menuAudios).forEach((audio) => {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		});
	}

	function playIntroAudio() {
		if (travel) return;
		stopMenuAudios();
		introAudio.pause();
		introAudio.currentTime = 0;
		startTalking();
		introAudio.onended = stopTalking;
		introAudio.play().catch(stopTalking);
	}

	// Desplaza la escena para que se vea el botón donde está parado el personaje.
	function scrollToPerch() {
		const page = pageRef.current;
		if (perchIndex === null || !page) return;
		const sceneWidth = page.scrollWidth;
		page.scrollLeft = (sceneWidth * PATH_BUTTONS[perchIndex].left) / 100 - page.clientWidth / 2;
		edge.position = page.scrollLeft;
	}

	useEffect(() => {
		scrollToPerch();
		// La presentación (audio y boca) solo al entrar al mundo, no al volver de una actividad.
		if (perchIndex === null) {
			playIntroAudio();
		}
		return () => {
			introAudio.onended = null;
			introAudio.pause();
			introAudio.currentTime = 0;
			stopMenuAudios();
			stopTalking();
		};
	}, []);

	function playMenuAudio(optionKey) {
		introAudio.pause();
		introAudio.currentTime = 0;
		introAudio.onended = null;
		stopMenuAudios();
		startTalking();
		menuAudios[optionKey].onended = stopTalking;
		menuAudios[optionKey].play().catch(stopTalking);
	}

	function selectMenuOption(optionKey) {
		if (travel) return;
		// Otra letra: se olvida la última actividad (deja de brillar y el personaje vuelve a su lugar).
		if (optionKey !== selectedOption && perchIndex !== null) {
			const { activityIndex, ...state } = location.state;
			navigate(location.pathname, { replace: true, state });
		}
		setSelectedOption(optionKey);
		writeStorage(STORAGE_KEYS.mundo1MenuOption, optionKey);
		playMenuAudio(optionKey);
	}

	function openPathActivity(index) {
		const route = PATH_ROUTES[index];
		if (!route || !isActivityAvailable(index) || travel) {
			return;
		}
		writeStorage(STORAGE_KEYS.mundo1MenuOption, selectedOption);
		const goToActivity = () => {
			// Se anota en la entrada actual del historial, para encontrarla al volver.
			navigate(location.pathname, { replace: true, state: { ...location.state, activityIndex: index } });
			navigate(route, { state: { menuOption: selectedOption } });
		};
		if (!character || perchIndex === index) {
			goToActivity();
			return;
		}
		introAudio.onended = null;
		introAudio.pause();
		stopMenuAudios();
		stopTalking();
		setTravel({ index, stage: "out" });
		runtime.setTimeout(() => setTravel({ index, stage: "in" }), TORNADO_OUT_MS);
		runtime.setTimeout(goToActivity, TORNADO_OUT_MS + TORNADO_IN_MS + TORNADO_PAUSE_MS);
	}

	function openMonster() {
		if (travel) return;
		const letra = selectedOption || "a";
		writeStorage(STORAGE_KEYS.mundo1MenuOption, letra);
		navigate("/monstruo", { state: { letra } });
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
			className={travel ? "page page-mundo1 traveling" : "page page-mundo1"}
			onPointerMove={handlePointerMove}
			onPointerLeave={stopEdgeScroll}
			onScroll={() => {
				if (!edge.running) {
					edge.position = pageRef.current.scrollLeft;
				}
			}}
		>
			<UserNav />

			{/* Fijo arriba al centro: sigue ahí aunque se recorra el camino. */}
			<button className="mundo1-monster-button" type="button" aria-label="Ver al monstruo y sus comidas" onClick={openMonster}>
				<Monstruo letra={selectedOption || "a"} />
			</button>

			<div className="mundo1-scene">
				<img className="mundo1-background" src={img("FONDOM1.jpg")} alt="" draggable={false} onLoad={scrollToPerch} />
				{PATH_BUTTONS.map(({ left, top }, index) => (
					<div
						className={`${selectedOption && !isActivityAvailable(index) ? "path-activity path-activity-unavailable" : "path-activity"}${availableActivities && index >= 7 ? " path-activity-hidden" : ""}${index === perchIndex ? " path-activity-current" : ""}`}
						key={`${left}-${top}`}
						style={{ left: `${left}%`, top: `${top}%` }}
					>
						{index === perchIndex && <span className="path-activity-glow" aria-hidden="true" />}
						<img
							className="path-activity-sign"
							src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")}
							alt=""
							draggable={false}
						/>
						<button
							className={isActivityAvailable(index) ? `path-button path-button-${selectedOption}` : "path-button path-button-disabled"}
							type="button"
							disabled={!isActivityAvailable(index)}
							aria-label={`Actividad del camino ${index + 1}`}
							onClick={() => openPathActivity(index)}
						>
							<img src={img("boton.svg")} alt="" draggable={false} />
						</button>
					</div>
				))}
				{character && (
					<div
						className={perchIndex === null ? "mundo1-character-spot" : "mundo1-character-spot perched"}
						style={perchIndex === null ? undefined : getPerchStyle(perchIndex)}
					>
						<button
							className={`mundo1-character${travel ? ` tornado-${travel.stage}` : ""}`}
							type="button"
							aria-label="Reproducir presentación"
							onClick={playIntroAudio}
						>
							<img src={CHARACTERS[character].image} alt={CHARACTERS[character].alt} />
							{mouth.visible && <img className={mouth.shifted ? "character-mouth shifted-mouth" : "character-mouth"} src={mouth.src} alt="" />}
						</button>
						{travel?.stage === "out" && <Tornado className="mundo1-spot-tornado" />}
					</div>
				)}
				{character && travel?.stage === "in" && (
					<div className="mundo1-character-spot perched arriving" style={getPerchStyle(travel.index)}>
						<img className="mundo1-arrival-character" src={CHARACTERS[character].image} alt="" draggable={false} />
						<Tornado className="mundo1-spot-tornado" />
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
