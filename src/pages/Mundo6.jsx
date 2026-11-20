import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import CharacterLocator from "../components/CharacterLocator";
import MonstruoDelMenu from "../components/MonstruoDelMenu";
import UserNav from "../components/UserNav";
import { useCharacterLocator } from "../hooks/useCharacterLocator";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img, MUNDO6_CHARACTER_FRAMES, sound } from "../lib/assets";
import { actividadCompleta, getProgreso, subscribeProgreso } from "../lib/progreso";
import { comidasGanadasPorActividad, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import MarcaCamino from "../components/MarcaCamino";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { etiquetaCamino, estiloMarcoEtiqueta, imagenesEtiquetasDelMundo } from "../lib/etiquetasCamino";
import "./Mundo6.css";

const LETTERS = ["B", "V", "Ñ", "K", "X"];
const LETTER_COLORS = ["#f14c74", "#ffc400", "#10b7e5", "#80ca3e", "#b36be2"];
const LETTER_SOUNDS = {
	B: "suenaB.mp3",
	V: "suenaV.mp3",
	"Ñ": "suenaÑ.mp3",
	K: "suenaK.mp3",
	X: "suenaX.mp3"
};
// Actividades habilitadas del camino, en orden (tiene que coincidir con CAMINOS[6] de caminos.js).
const ACTIVIDADES_M6 = [
	{ clave: "inicio", ruta: "/inicio", cartel: "INICIALESbtn.png", nombre: "Iniciar actividad de sílabas" },
	{ clave: "mariposas", ruta: "/mariposas", cartel: "MARIPOSAbtn.png", nombre: "Iniciar actividad de mariposas con sílabas" },
	{ clave: "flores", ruta: "/flores", cartel: "FLORbtn.png", nombre: "Iniciar actividad del jardín de sílabas" },
	{ clave: "peluches", ruta: "/peluches", cartel: "PELUCHESbtn.png", nombre: "Iniciar actividad de palabras con peluches" },
	{ clave: "elegir", ruta: "/elegir", cartel: "BoVbtn.png", nombre: "Iniciar actividad: ¿va con B o con V?" },
	{ clave: "tren", ruta: "/tren", cartel: "TRENbtn.png", nombre: "Iniciar actividad del tren" },
	{ clave: "dibujar", ruta: "/dibujar", cartel: "DIBUJARbtn.png", nombre: "Iniciar actividad de dibujar sílabas" }
];
const CHARACTER_FRAME_DURATION = 180;
const CHARACTERS = {
	supernena: { image: img("PERSONAJES/supernenaUnicornio.png"), alt: "Supernena unicornio" },
	supernene: { image: img("PERSONAJES/superneneUnicornio.png"), alt: "Supernene unicornio" }
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
const PATH_BUTTONS = [
	[20, 70], [25, 76], [30, 72], [35, 67], [40, 72],
	[45, 77], [50, 73], [55, 68], [60, 72], [65, 77],
	[70, 73], [75, 68], [80, 73], [85, 78], [90, 73],
	[94, 68], [96, 73], [98, 78], [99, 74]
];

export const MUNDO6_IMAGES = [
	img("FONDOM6.jpg"),
	img("MENUM6.png"),
	img("boton.svg"),
	...imagenesEtiquetasDelMundo(6).map(img),
	...ACTIVITY_SIGN_IMAGES.map(img),
	...Object.values(CHARACTERS).map(({ image }) => image),
	...Object.values(MUNDO6_CHARACTER_FRAMES).flat()
];

export default function Mundo6() {
	usePageTitle("Mundo 6");
	const runtime = usePageRuntime();
	const navigate = useNavigate();
	const [character] = useSelectedCharacter();
	const [characterFrame, setCharacterFrame] = useState(0);
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo6MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
	const letterAudioRef = useRef(null);
	const progreso = useSyncExternalStore(subscribeProgreso, getProgreso);
	const recompensas = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const pathLetter = (selectedLetter || LETTERS[0]).toLowerCase();
	const isActivityDone = (index) => {
		const actividad = ACTIVIDADES_M6[index]?.clave;
		return Boolean(actividad) && actividadCompleta(progreso, pathLetter, actividad,
			comidasGanadasPorActividad(recompensas.letras, pathLetter, actividad));
	};
	const nextActivityIndex = ACTIVIDADES_M6.findIndex((_, index) => !isActivityDone(index));
	// Letra que conviene jugar (solo se sugiere): la primera con alguna actividad sin completar.
	const nextLetter = LETTERS.find((letter) =>
		ACTIVIDADES_M6.some(({ clave }) => !actividadCompleta(progreso, letter.toLowerCase(), clave,
			comidasGanadasPorActividad(recompensas.letras, letter.toLowerCase(), clave))));
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const pageRef = useRef(null);
	const menuPanelRef = useRef(null);
	const compactMenuRef = useRef(null);
	const compactMenuToggleRef = useRef(null);
	const characterSpotRef = useRef(null);
	const { offscreen: characterOffscreen, direction: characterDirection, scrollToCharacter } =
		useCharacterLocator(pageRef, characterSpotRef, character);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		const frames = MUNDO6_CHARACTER_FRAMES[character];
		if (!frames) {
			setCharacterFrame(0);
			return undefined;
		}

		let timer = 0;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		function updateAnimation() {
			runtime.clearInterval(timer);
			timer = 0;
			setCharacterFrame(0);
			if (document.visibilityState === "visible" && document.hasFocus() && !reducedMotion.matches) {
				timer = runtime.setInterval(() => {
					setCharacterFrame((current) => (current + 1) % frames.length);
				}, CHARACTER_FRAME_DURATION);
			}
		}

		updateAnimation();
		document.addEventListener("visibilitychange", updateAnimation);
		window.addEventListener("blur", updateAnimation);
		window.addEventListener("focus", updateAnimation);
		reducedMotion.addListener(updateAnimation);
		return () => {
			document.removeEventListener("visibilitychange", updateAnimation);
			window.removeEventListener("blur", updateAnimation);
			window.removeEventListener("focus", updateAnimation);
			reducedMotion.removeListener(updateAnimation);
			runtime.clearInterval(timer);
		};
	}, [character, runtime]);

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

	// Al entrar suena la bienvenida (el unicornio no mueve la boca: solo se oye).
	useEffect(() => {
		if (!character) return undefined;
		introAudio.currentTime = 0;
		introAudio.play().catch(() => {});
		return () => {
			introAudio.pause();
		};
	}, [character]);

	function selectLetter(letter) {
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo6MenuOption, letter);
		setCompactMenuOpen(false);
		introAudio.pause();
		letterAudioRef.current?.pause();
		const audio = runtime.audio(sound(LETTER_SOUNDS[letter]));
		letterAudioRef.current = audio;
		audio.play().catch(() => {});
	}

	function openActivity(index) {
		const actividad = ACTIVIDADES_M6[index];
		if (!actividad) return;
		const letter = selectedLetter || LETTERS[0];
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo6MenuOption, letter);
		navigate(actividad.ruta, { state: { world: 6, menuOption: letter } });
	}

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo6-compact-menu, .mundo6-menu-panel, .mundo6-character, .mundo6-path, .character-locator")) return;
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

	return (
		<div
			ref={pageRef}
			className={`page page-mundo6${dragging ? " dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			<MonstruoDelMenu mundo={6} letra={selectedLetter} />
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo6-compact-menu" aria-label="Elegir letra">
					<button
						ref={compactMenuToggleRef}
						className="mundo6-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedLetter || LETTERS[0]}`}
						aria-expanded={compactMenuOpen}
						aria-controls="mundo6-compact-menu-options"
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<span style={{ "--letter-color": LETTER_COLORS[LETTERS.indexOf(selectedLetter || LETTERS[0])] }}>
							{selectedLetter || LETTERS[0]}
						</span>
					</button>
					{compactMenuOpen && (
						<div className="mundo6-compact-menu__options" id="mundo6-compact-menu-options">
							{LETTERS.map((letter, index) => (
								<button
									className={selectedLetter === letter ? "mundo6-compact-menu__option selected" : "mundo6-compact-menu__option"}
									key={letter}
									type="button"
									aria-label={`Elegir letra ${letter}`}
									aria-pressed={selectedLetter === letter}
									style={{ "--letter-color": LETTER_COLORS[index] }}
									onClick={() => selectLetter(letter)}
								>
									{letter}
								</button>
							))}
						</div>
					)}
				</nav>
			)}
			{characterOffscreen && character && (
				<CharacterLocator character={character} direction={characterDirection} onClick={scrollToCharacter} />
			)}
			<main className="mundo6-scene" aria-label="Mundo 6">
				<img className="mundo6-background" src={img("FONDOM6.jpg")} alt="" draggable={false} />
				<div className="mundo6-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div
							className={`mundo6-path-activity${ACTIVIDADES_M6[index] ? "" : " mundo6-path-activity-hidden"}`}
							key={`${left}-${top}-${index}`}
							style={{ left: `${left}%`, top: `${top}%` }}
						>
							{index === nextActivityIndex && <span className="camino-siguiente-brillo" aria-hidden="true" />}
							<MarcaCamino letra={pathLetter} actividad={ACTIVIDADES_M6[index]?.clave} hecha={isActivityDone(index)} />
							<img
								className={`mundo6-path-sign${etiquetaCamino(6, ACTIVIDADES_M6[index]?.clave) ? " camino-etiqueta" : ""}`}
								src={img(etiquetaCamino(6, ACTIVIDADES_M6[index]?.clave) || ACTIVIDADES_M6[index]?.cartel || ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")}
								style={estiloMarcoEtiqueta(6, pathLetter)}
								alt=""
								draggable={false}
							/>
							<button
								className={`mundo6-path-button${ACTIVIDADES_M6[index] ? " is-available" : ""}`}
								type="button"
								disabled={!ACTIVIDADES_M6[index]}
								aria-label={ACTIVIDADES_M6[index]?.nombre || `Actividad del camino ${index + 1}, próximamente`}
								onClick={() => openActivity(index)}
							>
								<img src={img("boton.svg")} alt="" draggable={false} />
							</button>
						</div>
					))}
				</div>
				{character && (
					<div ref={characterSpotRef} className="mundo6-character">
						<img
							src={MUNDO6_CHARACTER_FRAMES[character]?.[characterFrame] || CHARACTERS[character].image}
							alt={CHARACTERS[character].alt}
							draggable={false}
						/>
					</div>
				)}
				<aside ref={menuPanelRef} className="mundo6-menu-panel" aria-label="Letras del Mundo 6">
					<img className="mundo6-menu-image" src={img("MENUM6.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo6-letter mundo6-letter-${index + 1}${selectedLetter === letter ? " selected" : ""}${nextLetter === letter ? " menu-letra-siguiente" : ""}`}
							key={letter}
							type="button"
							aria-label={`Seleccionar letra ${letter}`}
							aria-pressed={selectedLetter === letter}
							style={{ "--letter-color": LETTER_COLORS[index] }}
							onClick={() => selectLetter(letter)}
						>
							{letter}
						</button>
					))}
				</aside>
			</main>
		</div>
	);
}
