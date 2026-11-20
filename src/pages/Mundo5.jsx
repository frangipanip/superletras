import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import CharacterLocator from "../components/CharacterLocator";
import UserNav from "../components/UserNav";
import { useCharacterLocator } from "../hooks/useCharacterLocator";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO5_CHARACTERS, MUNDO5_MOUTH_IMAGES, sound } from "../lib/assets";
import { actividadCompleta, getProgreso, subscribeProgreso } from "../lib/progreso";
import { comidasGanadasPorActividad, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import MarcaCamino from "../components/MarcaCamino";
import MonstruoDelMenu from "../components/MonstruoDelMenu";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { etiquetaCamino, estiloMarcoEtiqueta, imagenesEtiquetasDelMundo } from "../lib/etiquetasCamino";
import "./Mundo5.css";

const LETTERS = ["G", "GE", "GU", "J", "GÜ"];
const LETTER_LABELS = {
	GU: "GUE",
	"GÜ": "GÜE"
};
const LETTER_SOUNDS = {
	G: "suenaG.mp3",
	GE: "suenaGE.mp3",
	GU: "suenaGU.mp3",
	J: "suenaJ.mp3",
	"GÜ": "suenaGÜE.mp3"
};
const LETTER_BLOCKS = {
	G: img("robotG.png"),
	GE: img("robotGE.png"),
	GU: img("robotGU.png"),
	J: img("robotJ.png"),
	"GÜ": img("robotGUdiresis.png")
};
const LETTER_COLORS = {
	G: "red",
	GE: "yellow",
	GU: "blue",
	J: "green",
	"GÜ": "purple"
};
const ACTIVITY_SIGN_IMAGES = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"BARCOSbtn.png",
	"PASTELbtn.png",
	"PUZZLEbtn.png",
	"DECORAbtn.png",
	"GLOBOSbtn.png"
];
// Actividades habilitadas del camino, en orden (tiene que coincidir con CAMINOS[5] de caminos.js).
const ACTIVIDADES_M5 = [
	{ clave: "inicio", ruta: "/inicio", cartel: "INICIALESbtn.png", nombre: "Iniciar actividad de sílabas" },
	{ clave: "tren", ruta: "/tren", cartel: "TRENbtn.png", nombre: "Iniciar actividad del tren" },
	{ clave: "peluches", ruta: "/peluches", cartel: "PELUCHESbtn.png", nombre: "Iniciar actividad de palabras con peluches" },
	{ clave: "elegir", ruta: "/elegir", cartel: "JoGbtn.png", nombre: "Iniciar actividad: ¿va con J o con G?" },
	{ clave: "mariposas", ruta: "/mariposas", cartel: "MARIPOSAbtn.png", nombre: "Iniciar actividad de robots voladores" },
	{ clave: "flores", ruta: "/flores", cartel: "FLORbtn.png", nombre: "Iniciar actividad del jardín de robots" },
	{ clave: "dibujar", ruta: "/dibujar", cartel: "DIBUJARbtn.png", nombre: "Iniciar actividad de dibujar sílabas" }
];
const PATH_BUTTONS = [
	[10, 83], //INICIO
	[17, 83], //MARIPOSAS
	[26, 83], //FLORES
	[35, 83], //PELUCHES
	[44, 83], //DIBUJAR
	[53, 83], //TREN
	[62, 83],
	[71, 83],
	[80, 83],
	[90, 83],
	[12.5, 83],
	[21.5, 83],
	[30.5, 83], [39.5, 83], [48.5, 83],
	[57.5, 83], [66.5, 83], [75.5, 83], [85, 83]
];

function readSavedPerches() {
	try {
		const guardadas = JSON.parse(readStorage(STORAGE_KEYS.mundo5Perches) || "{}");
		return Object.fromEntries(Object.entries(guardadas).filter(([letra, indice]) =>
			LETTERS.includes(letra) && Number.isInteger(indice) && indice >= 0 && indice < ACTIVIDADES_M5.length));
	} catch {
		return {};
	}
}

export const MUNDO5_IMAGES = [
	img("FONDOM5.png"),
	img("FONDOM5bis.png"),
	img("MENUM5.png"),
	...Object.values(LETTER_BLOCKS),
	...Object.values(MUNDO5_CHARACTERS).map(({ image }) => image),
	...MUNDO5_MOUTH_IMAGES,
	img("boton.svg"),
	...imagenesEtiquetasDelMundo(5).map(img),
	...ACTIVITY_SIGN_IMAGES.map(img)
];

export default function Mundo5() {
	usePageTitle("Mundo 5");
	const runtime = usePageRuntime();
	const navigate = useNavigate();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO5_MOUTH_IMAGES);
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo5MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const progreso = useSyncExternalStore(subscribeProgreso, getProgreso);
	const recompensas = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const [savedPerches, setSavedPerches] = useState(readSavedPerches);
	const perch = savedPerches[selectedLetter];
	const perchPosition = PATH_BUTTONS[perch];
	const pathLetter = (selectedLetter || LETTERS[0]).toLowerCase();
	const isActivityDone = (index) => {
		const actividad = ACTIVIDADES_M5[index]?.clave;
		return Boolean(actividad) && actividadCompleta(progreso, pathLetter, actividad,
			comidasGanadasPorActividad(recompensas.letras, pathLetter, actividad));
	};
	const nextActivityIndex = ACTIVIDADES_M5.findIndex((_, index) => !isActivityDone(index));
	// Letra que conviene jugar (solo se sugiere): la primera con alguna actividad sin completar.
	const nextLetter = LETTERS.find((letter) =>
		ACTIVIDADES_M5.some(({ clave }) => !actividadCompleta(progreso, letter.toLowerCase(), clave,
			comidasGanadasPorActividad(recompensas.letras, letter.toLowerCase(), clave))));
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
	const pageRef = useRef(null);
	const menuPanelRef = useRef(null);
	const compactMenuRef = useRef(null);
	const compactMenuToggleRef = useRef(null);
	const characterSpotRef = useRef(null);
	const letterAudioRef = useRef(null);
	const { offscreen: characterOffscreen, direction: characterDirection, scrollToCharacter } =
		useCharacterLocator(pageRef, characterSpotRef, character, perch);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		const page = pageRef.current;
		const panel = menuPanelRef.current;
		if (!page || !panel) return undefined;

		function updateMenuPanelVisibility() {
			const viewport = page.getBoundingClientRect();
			const menu = panel.getBoundingClientRect();
			const visibleWidth = Math.max(0, Math.min(menu.right, viewport.right) - Math.max(menu.left, viewport.left));
			const visibleHeight = Math.max(0, Math.min(menu.bottom, viewport.bottom) - Math.max(menu.top, viewport.top));
			const visibleRatio = menu.width && menu.height ? visibleWidth * visibleHeight / (menu.width * menu.height) : 0;
			const visible = visibleRatio > 0.2;
			setMenuPanelVisible(visible);
			if (visible) setCompactMenuOpen(false);
		}

		updateMenuPanelVisibility();
		page.addEventListener("scroll", updateMenuPanelVisibility, { passive: true });
		window.addEventListener("resize", updateMenuPanelVisibility);
		return () => {
			page.removeEventListener("scroll", updateMenuPanelVisibility);
			window.removeEventListener("resize", updateMenuPanelVisibility);
		};
	}, []);

	useEffect(() => {
		if (!compactMenuOpen) return undefined;

		function closeCompactMenuOutside(event) {
			if (!compactMenuRef.current?.contains(event.target)) setCompactMenuOpen(false);
		}

		function closeCompactMenuOnEscape(event) {
			if (event.key !== "Escape") return;
			setCompactMenuOpen(false);
			compactMenuToggleRef.current?.focus();
		}

		document.addEventListener("pointerdown", closeCompactMenuOutside);
		document.addEventListener("keydown", closeCompactMenuOnEscape);
		return () => {
			document.removeEventListener("pointerdown", closeCompactMenuOutside);
			document.removeEventListener("keydown", closeCompactMenuOnEscape);
		};
	}, [compactMenuOpen]);

	function playIntroAudio() {
		introAudio.pause();
		introAudio.currentTime = 0;
		startTalking();
		introAudio.onended = stopTalking;
		introAudio.play().catch(stopTalking);
	}

	function selectLetter(letter) {
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo5MenuOption, letter);
		setCompactMenuOpen(false);

		introAudio.pause();
		introAudio.currentTime = 0;
		introAudio.onended = null;
		if (letterAudioRef.current) {
			letterAudioRef.current.pause();
			letterAudioRef.current.currentTime = 0;
			letterAudioRef.current.onended = null;
		}
		const audio = runtime.audio(sound(LETTER_SOUNDS[letter]));
		letterAudioRef.current = audio;
		startTalking();
		audio.onended = () => {
			audio.onended = null;
			if (letterAudioRef.current === audio) {
				letterAudioRef.current = null;
				stopTalking();
			}
		};
		audio.play().catch(() => {
			if (letterAudioRef.current === audio) {
				letterAudioRef.current = null;
				stopTalking();
			}
		});
	}

	function openActivity(index) {
		const actividad = ACTIVIDADES_M5[index];
		if (!actividad) return;
		const letter = selectedLetter || LETTERS[0];
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo5MenuOption, letter);
		const posiciones = { ...savedPerches, [letter]: index };
		setSavedPerches(posiciones);
		writeStorage(STORAGE_KEYS.mundo5Perches, JSON.stringify(posiciones));
		navigate(actividad.ruta, { state: { world: 5, menuOption: letter } });
	}

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo5-compact-menu, .mundo5-menu-panel, .mundo5-character, .mundo5-path, .character-locator")) return;
		drag.pointerId = event.pointerId;
		drag.startX = event.clientX;
		drag.startScroll = pageRef.current.scrollLeft;
	}

	function handlePointerMove(event) {
		if (drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.startX;
		if (!drag.moved) {
			if (Math.abs(dx) < 6) return;
			drag.moved = true;
			setDragging(true);
			pageRef.current.setPointerCapture(event.pointerId);
		}
		pageRef.current.scrollLeft = drag.startScroll - dx;
	}

	function endDrag(event) {
		if (drag.pointerId !== event.pointerId) return;
		drag.pointerId = null;
		setDragging(false);
	}

	function handleClickCapture(event) {
		if (!drag.moved) return;
		drag.moved = false;
		event.preventDefault();
		event.stopPropagation();
	}

	useEffect(() => {
		if (!character) return undefined;
		playIntroAudio();
		return () => {
			introAudio.onended = null;
			introAudio.pause();
			introAudio.currentTime = 0;
			stopTalking();
		};
	}, [character]);

	return (
		<div
			ref={pageRef}
			className={`page page-mundo5${dragging ? " dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			<MonstruoDelMenu mundo={5} letra={selectedLetter} />
			{characterOffscreen && (
				<CharacterLocator character={character} direction={characterDirection} onClick={scrollToCharacter} />
			)}
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo5-compact-menu" aria-label="Elegir letra">
					<button
						ref={compactMenuToggleRef}
						className="mundo5-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${LETTER_LABELS[selectedLetter] || selectedLetter || LETTERS[0]}`}
						aria-expanded={compactMenuOpen}
						aria-controls="mundo5-compact-menu-options"
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<img src={LETTER_BLOCKS[selectedLetter || LETTERS[0]]} alt="" draggable={false} />
					</button>
					{compactMenuOpen && (
						<div className="mundo5-compact-menu__options" id="mundo5-compact-menu-options">
							{LETTERS.map((letter) => (
								<button
									className={selectedLetter === letter ? "mundo5-compact-menu__option selected" : "mundo5-compact-menu__option"}
									key={letter}
									type="button"
									aria-label={`Elegir letra ${LETTER_LABELS[letter] || letter}`}
									aria-pressed={selectedLetter === letter}
									onClick={() => selectLetter(letter)}
								>
									<img src={LETTER_BLOCKS[letter]} alt="" draggable={false} />
								</button>
							))}
						</div>
					)}
				</nav>
			)}
			<main className="mundo5-scene" aria-label="Mundo 5">
				<div className="mundo5-backgrounds" aria-hidden="true">
					<img className="mundo5-background" src={img("FONDOM5.png")} alt="" draggable={false} />
					<img className="mundo5-background" src={img("FONDOM5bis.png")} alt="" draggable={false} />
				</div>

				<div className="mundo5-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div
							className={`mundo5-path-activity${ACTIVIDADES_M5[index] ? "" : " mundo5-path-activity-hidden"}`}
							key={`${left}-${top}-${index}`}
							style={{ left: `${left}%`, top: `${top}%` }}
						>
							{index === nextActivityIndex && <span className="camino-siguiente-brillo" aria-hidden="true" />}
							<MarcaCamino letra={pathLetter} actividad={ACTIVIDADES_M5[index]?.clave} hecha={isActivityDone(index)} />
							<img
								className={`mundo5-path-sign${etiquetaCamino(5, ACTIVIDADES_M5[index]?.clave) ? " camino-etiqueta" : ""}`}
								src={img(etiquetaCamino(5, ACTIVIDADES_M5[index]?.clave) || ACTIVIDADES_M5[index]?.cartel || ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")}
								style={estiloMarcoEtiqueta(5, pathLetter)}
								alt=""
								draggable={false}
							/>
							<button
								className={`mundo5-path-button${ACTIVIDADES_M5[index] ? " is-available" : ""}`}
								type="button"
								disabled={!ACTIVIDADES_M5[index]}
								aria-label={ACTIVIDADES_M5[index]?.nombre || `Actividad del camino ${index + 1}, próximamente`}
								onClick={() => openActivity(index)}
							>
								<img src={img("boton.svg")} alt="" draggable={false} />
							</button>
						</div>
					))}
				</div>

				{character && (
					<div ref={characterSpotRef} className={`mundo5-character-spot${perchPosition ? " perched" : ""}`} style={perchPosition ? { left: `${perchPosition[0]}%`, top: `${perchPosition[1]}%` } : undefined}>
					<button className="mundo5-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
						<img src={MUNDO5_CHARACTERS[character].image} alt={MUNDO5_CHARACTERS[character].alt} draggable={false} />
						{mouth.visible && <img className="mundo5-character-mouth" src={mouth.src} alt="" />}
					</button>
					</div>
				)}

				<aside ref={menuPanelRef} className="mundo5-menu-panel" aria-label="Letras del Mundo 5">
					<img className="mundo5-menu-image" src={img("MENUM5.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo5-letter mundo5-letter-${index + 1} letter-color-${LETTER_COLORS[letter]}${selectedLetter === letter ? " selected" : ""}${nextLetter === letter ? " menu-letra-siguiente" : ""}`}
							key={letter}
							type="button"
							aria-label={`Seleccionar letra ${LETTER_LABELS[letter] || letter}`}
							aria-pressed={selectedLetter === letter}
							onClick={() => selectLetter(letter)}
						>
							{LETTER_LABELS[letter] || letter}
						</button>
					))}
				</aside>
			</main>
		</div>
	);
}
