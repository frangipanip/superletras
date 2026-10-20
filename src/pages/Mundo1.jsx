import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router";
import Monstruo, { imagenMonstruo, imagenMonstruoNivel2 } from "../components/Monstruo";
import PufCrema, { PUF_CHARACTER_CLASS, PUF_IN_MS } from "../components/PufCrema";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { useTeleport } from "../hooks/useTeleport";
import { img, MUNDO1_CHARACTERS, MUNDO1_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import { COMIDAS } from "../../shared/comidas.js";
import { cantidadComida, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import "./Mundo1.css";

const MENU_OPTIONS = [
	{ key: "a", image: "Abtn.png", audio: "suenaA.mp3" },
	{ key: "l", image: "Lbtn.png", audio: "suenaL.mp3" },
	{ key: "m", image: "Mbtn.png", audio: "suenaM.mp3" },
	{ key: "s", image: "Sbtn.png", audio: "suenaS.mp3" },
	{ key: "t", image: "Tbtn.png", audio: "suenaT.mp3" }
];

const SCOOP_IMAGES = {
	a: "bochaA.png",
	l: "bochaL.png",
	s: "bochaS.png",
	m: "bochaM.png",
	t: "bochaT.png"
};

const PATH_BUTTONS = [
	{ left: 35, top: 76 },
	{ left: 47, top: 77 },
	{ left: 59, top: 73 },
	{ left: 72, top: 69 },
	{ left: 85, top: 77 },
	{ left: 97, top: 77 },
	{ left: 109, top: 77 },
	{ left: 145, top: 72 },
	{ left: 163, top: 77 },
	{ left: 176, top: 83 }
];
const CELEBRATION_FRAMES = Array.from({ length: 29 }, (_, index) =>
	img(`monstruos/festejoS${index}.png`)
);

const ACTIVITY_SIGN_IMAGES = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"MEMOTESTbtn.png",
	"BARCOSbtn.png"
];

// Todo lo que muestra la pantalla al entrar; Mundos lo precarga para que no aparezca de a partes.
export const MUNDO1_IMAGES = [
	img("FONDOM1.jpg"),
	img("FONDOM1bis.jpg"),
	img("MENUM1.png"),
	img("nube.png"),
	img("boton.svg"),
	img("GLOBOSbtn.png"),
	img("cartelPALABRAS.png"),
	...CELEBRATION_FRAMES,
	...ACTIVITY_SIGN_IMAGES.map(img),
	...MENU_OPTIONS.map(({ image }) => img(image)),
	...Object.values(SCOOP_IMAGES).map(img),
	img("cabezasupernena.png"),
	img("cabezasupernene.png"),
	...Object.values(MUNDO1_CHARACTERS).map(({ image }) => image),
	...MENU_OPTIONS.map(({ key }) => imagenMonstruo(key)),
	...MENU_OPTIONS.map(({ key }) => imagenMonstruoNivel2(key)),
	...MUNDO1_MOUTH_IMAGES
];

const PATH_ROUTES = ["/inicio", "/mariposas", "/flores", "/peluches", "/tren", "/dibujar", "/memotest", "/barcos", null, null];

// Índices de PATH_ROUTES habilitados por letra: el resto del camino queda apagado
// hasta que la actividad tenga los audios de esa letra. Sin entrada, la letra no abre nada.
const AVAILABLE_ACTIVITIES = {
	a: [0, 1, 2, 3, 4, 5, 6, 7],
	l: [0, 1, 2, 3, 4, 5, 6, 7],
	m: [0, 1, 2, 3, 4, 5, 6, 7],
	s: [0, 1, 2, 3, 4, 5, 6, 7],
	t: [0, 1, 2, 3, 4, 5, 6, 7]
};

// Desplazamiento con el mouse: se arrastra la escena con click sostenido.
// Por debajo de este movimiento (px) cuenta como click y no como arrastre.
const DRAG_THRESHOLD = 6;

// Ubica al personaje parado junto a un botón del camino.
function getPerchStyle(index) {
	const { left, top } = PATH_BUTTONS[index];
	return { left: `${left}%`, top: `${top}%` };
}

function readUnlockedWordPaths() {
	try {
		const saved = JSON.parse(readStorage(STORAGE_KEYS.mundo1WordPathsUnlocked) || "{}");
		return Object.fromEntries(MENU_OPTIONS
			.filter(({ key }) => saved[key] === true)
			.map(({ key }) => [key, true]));
	} catch {
		return {};
	}
}

function readSavedPerches() {
	try {
		const saved = JSON.parse(readStorage(STORAGE_KEYS.mundo1Perches) || "{}");
		return Object.fromEntries(Object.entries(saved).filter(([letter, index]) =>
			MENU_OPTIONS.some(({ key }) => key === letter) && Number.isInteger(index) && PATH_BUTTONS[index]
		));
	} catch {
		return {};
	}
}

export default function Mundo1() {
	usePageTitle("Mundo 1");
	const navigate = useNavigate();
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { letras: recompensasPorLetra } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO1_MOUTH_IMAGES);
	const [selectedOption, setSelectedOption] = useState(() => readStorage(STORAGE_KEYS.mundo1MenuOption));
	const [unlockedWordPaths, setUnlockedWordPaths] = useState(readUnlockedWordPaths);
	const wordPathUnlocked = Boolean(selectedOption && unlockedWordPaths[selectedOption]);
	const selectedMonsterEvolved = Boolean(selectedOption && COMIDAS.every(({ clave, necesarias }) =>
		cantidadComida(recompensasPorLetra, selectedOption, clave).dadas >= necesarias
	));
	const [savedPerches, setSavedPerches] = useState(readSavedPerches);
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const [characterOffscreen, setCharacterOffscreen] = useState(false);
	const [characterDirection, setCharacterDirection] = useState("left");
	const [celebrationFrame, setCelebrationFrame] = useState(0);
	const [celebrationPlaying, setCelebrationPlaying] = useState(false);
	const [evolvedMonsterArriving, setEvolvedMonsterArriving] = useState(selectedMonsterEvolved);
	const wordSequenceActive = useRef(false);
	const wordSequenceId = useRef(0);
	const wordSequenceLetter = useRef(null);
	const pageRef = useRef(null);
	const menuPanelRef = useRef(null);
	const compactMenuRef = useRef(null);
	const characterSpotRef = useRef(null);
	// Al elegir una actividad el personaje se teletransporta (puf de crema) hasta su botón.
	// teleport.position: índice del botón (o null = lugar inicial) donde se dibuja durante el viaje.
	const { teleport, teleportCharacter } = useTeleport(runtime);
	// Botón de la última actividad visitada: al volver con "Volver", el personaje queda parado junto a él.
	const routePerch = location.state?.menuOption === selectedOption && PATH_BUTTONS[location.state?.activityIndex]
		? location.state.activityIndex
		: null;
	const perchIndex = routePerch ?? (PATH_BUTTONS[savedPerches[selectedOption]] ? savedPerches[selectedOption] : null);
	const characterIndex = teleport ? teleport.position : perchIndex;
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
	const [wordsAudio] = useState(() => runtime.audio("/assets/sonido/logropalabras.mp3", { preload: true }));
	const [discoverWordsAudio] = useState(() => runtime.audio("/assets/sonido/descubrirpalabras.mp3", { preload: true }));
	const [letUsSayWordsAudio] = useState(() => runtime.audio("/assets/sonido/vamospalabras.mp3", { preload: true }));
	// Estado del arrastre con el mouse; lo leen los handlers de pointer sin esperar un render.
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);
	const [menuAudios] = useState(() =>
		Object.fromEntries(MENU_OPTIONS.map(({ key, audio }) => [key, runtime.audio(sound(audio), { preload: true })]))
	);
	const availableActivities = AVAILABLE_ACTIVITIES[selectedOption] || null;

	useEffect(() => {
		if (!selectedMonsterEvolved) {
			setEvolvedMonsterArriving(false);
			return undefined;
		}
		setEvolvedMonsterArriving(true);
		const timer = runtime.setTimeout(() => setEvolvedMonsterArriving(false), PUF_IN_MS);
		return () => runtime.clearTimeout(timer);
	}, [runtime, selectedMonsterEvolved, selectedOption]);

	useEffect(() => {
		if (selectedOption !== "s" || !celebrationPlaying) return undefined;
		const timer = runtime.setTimeout(() => {
			setCelebrationFrame((frame) => frame < 20 ? frame + 1 : frame < 28 ? frame + 1 : 21);
		}, 120);
		return () => runtime.clearTimeout(timer);
	}, [celebrationFrame, celebrationPlaying, runtime, selectedOption]);

	useEffect(() => () => {
		wordSequenceId.current += 1;
		wordSequenceActive.current = false;
		wordSequenceLetter.current = null;
		wordsAudio.onended = null;
		discoverWordsAudio.onended = null;
		letUsSayWordsAudio.onended = null;
		wordsAudio.pause();
		wordsAudio.currentTime = 0;
		discoverWordsAudio.pause();
		discoverWordsAudio.currentTime = 0;
		letUsSayWordsAudio.pause();
		letUsSayWordsAudio.currentTime = 0;
	}, [wordsAudio, discoverWordsAudio, letUsSayWordsAudio]);

	function finishWordAudioSequence(sequenceId, completed) {
		if (wordSequenceId.current !== sequenceId) return;
		const letter = wordSequenceLetter.current;
		wordSequenceActive.current = false;
		wordSequenceLetter.current = null;
		wordsAudio.onended = null;
		discoverWordsAudio.onended = null;
		letUsSayWordsAudio.onended = null;
		setCelebrationPlaying(false);
		setCelebrationFrame(0);
		if (completed && letter) {
			const nextUnlockedWordPaths = { ...unlockedWordPaths, [letter]: true };
			setUnlockedWordPaths(nextUnlockedWordPaths);
			writeStorage(STORAGE_KEYS.mundo1WordPathsUnlocked, JSON.stringify(nextUnlockedWordPaths));

			const firstWordPathIndex = 7;
			const nextPerches = { ...savedPerches, [letter]: firstWordPathIndex };
			setSavedPerches(nextPerches);
			writeStorage(STORAGE_KEYS.mundo1Perches, JSON.stringify(nextPerches));
			if (location.state?.activityIndex !== undefined) {
				const { activityIndex, ...state } = location.state;
				navigate(location.pathname, { replace: true, state });
			}
			if (character && perchIndex !== firstWordPathIndex) {
				teleportCharacter(perchIndex, firstWordPathIndex);
			}
		}
	}

	function cancelWordAudioSequence() {
		wordSequenceId.current += 1;
		wordSequenceActive.current = false;
		wordSequenceLetter.current = null;
		[wordsAudio, discoverWordsAudio, letUsSayWordsAudio].forEach((audio) => {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		});
		setCelebrationPlaying(false);
		setCelebrationFrame(0);
	}

	function playWordAudio(audio, next, sequenceId, audioName) {
		audio.currentTime = 0;
		audio.onended = () => {
			if (wordSequenceId.current === sequenceId) next();
		};
		audio.play().catch((error) => {
			if (wordSequenceId.current !== sequenceId) return;
			finishWordAudioSequence(sequenceId, false);
			console.error(`No se pudo reproducir el audio ${audioName}.`, error);
		});
	}

	function startWordAudioSequence(letter, sequenceId) {
		if (wordSequenceId.current !== sequenceId) return;
		setCelebrationFrame(letter === "s" ? 1 : 0);
		setCelebrationPlaying(letter === "s");
		playWordAudio(wordsAudio, () => {
			setCelebrationFrame(0);
			playWordAudio(discoverWordsAudio, () => {
				setCelebrationFrame(0);
				playWordAudio(letUsSayWordsAudio, () => {
					finishWordAudioSequence(sequenceId, true);
				}, sequenceId, "vamospalabras.mp3");
			}, sequenceId, "descubrirpalabras.mp3");
		}, sequenceId, "logropalabras.mp3");
	}

	function handleEvolvedMonsterClick() {
		if (!selectedMonsterEvolved || !selectedOption || teleport || evolvedMonsterArriving || wordSequenceActive.current) return;
		const letter = selectedOption;
		const sequenceId = wordSequenceId.current + 1;
		wordSequenceId.current = sequenceId;
		wordSequenceActive.current = true;
		wordSequenceLetter.current = letter;

		introAudio.onended = null;
		introAudio.pause();
		stopMenuAudios();
		stopTalking();
		startWordAudioSequence(letter, sequenceId);
	}

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
		if (teleport) return;
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
		if (!page) return;
		const characterSpot = characterSpotRef.current;
		if (perchIndex !== null && characterSpot) {
			const pageBounds = page.getBoundingClientRect();
			const characterBounds = characterSpot.getBoundingClientRect();
			page.scrollLeft += characterBounds.left + characterBounds.width / 2 - (pageBounds.left + pageBounds.width / 2);
		}
		updateCharacterVisibility();
	}

	function updateCharacterVisibility() {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot || !character || teleport) {
			setCharacterOffscreen(false);
			return;
		}
		const viewport = page.getBoundingClientRect();
		const characterBounds = characterSpot.getBoundingClientRect();
		const visible = characterBounds.right > viewport.left && characterBounds.left < viewport.right &&
			characterBounds.bottom > viewport.top && characterBounds.top < viewport.bottom;
		setCharacterOffscreen(!visible);
		setCharacterDirection(characterBounds.left + characterBounds.width / 2 >= viewport.left + viewport.width / 2 ? "right" : "left");
	}

	function scrollToCharacter() {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot) return;
		const viewport = page.getBoundingClientRect();
		const characterBounds = characterSpot.getBoundingClientRect();
		const destination = page.scrollLeft + characterBounds.left + characterBounds.width / 2 - viewport.width / 2;
		page.scrollTo({ left: Math.max(0, Math.min(page.scrollWidth - page.clientWidth, destination)), behavior: "smooth" });
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

	useEffect(() => {
		const page = pageRef.current;
		if (!page) return undefined;
		updateCharacterVisibility();
		page.addEventListener("scroll", updateCharacterVisibility, { passive: true });
		window.addEventListener("resize", updateCharacterVisibility);
		return () => {
			page.removeEventListener("scroll", updateCharacterVisibility);
			window.removeEventListener("resize", updateCharacterVisibility);
		};
	}, [character, characterIndex, teleport]);

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
			if (!compactMenuRef.current?.contains(event.target)) {
				setCompactMenuOpen(false);
			}
		}

		document.addEventListener("pointerdown", closeCompactMenuOutside);
		return () => document.removeEventListener("pointerdown", closeCompactMenuOutside);
	}, [compactMenuOpen]);

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
		if (teleport) return;
		cancelWordAudioSequence();
		setCompactMenuOpen(false);
		// Otra letra: se olvida la última actividad (deja de brillar y el personaje vuelve a su lugar).
		if (optionKey !== selectedOption && location.state?.activityIndex !== undefined) {
			const { activityIndex, ...state } = location.state;
			navigate(location.pathname, { replace: true, state });
		}
		setSelectedOption(optionKey);
		writeStorage(STORAGE_KEYS.mundo1MenuOption, optionKey);
		playMenuAudio(optionKey);
	}

	function openPathActivity(index) {
		const route = PATH_ROUTES[index];
		if (!route || !isActivityAvailable(index) || teleport || wordSequenceActive.current) {
			return;
		}
		const nextPerches = { ...savedPerches, [selectedOption]: index };
		setSavedPerches(nextPerches);
		writeStorage(STORAGE_KEYS.mundo1Perches, JSON.stringify(nextPerches));
		writeStorage(STORAGE_KEYS.mundo1MenuOption, selectedOption);
		const goToActivity = () => {
			// Se anota en la entrada actual del historial, para encontrarla al volver.
				navigate(location.pathname, { replace: true, state: { ...location.state, activityIndex: index, menuOption: selectedOption } });
			navigate(route, { state: { menuOption: selectedOption, world: 1 } });
		};
		if (!character || perchIndex === index) {
			goToActivity();
			return;
		}
		introAudio.onended = null;
		introAudio.pause();
		stopMenuAudios();
		stopTalking();
		teleportCharacter(perchIndex, index).then(goToActivity);
	}

	function openMonster() {
		if (teleport) return;
		const letra = selectedOption || "a";
		writeStorage(STORAGE_KEYS.mundo1MenuOption, letra);
		navigate("/monstruo", { state: { letra } });
	}

	function handlePointerDown(event) {
		drag.moved = false;
		// En touch se arrastra con el scroll nativo; esto es solo para el mouse (botón izquierdo).
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		// Los menús fijos no mueven la escena.
		if (event.target.closest(".top-nav, .mundo1-compact-menu, .mundo1-monster-button, .mundo1-character-locator, .mundo1-festejo")) return;
		drag.pointerId = event.pointerId;
		drag.startX = event.clientX;
		drag.startScroll = pageRef.current.scrollLeft;
	}

	function handlePointerMove(event) {
		if (drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.startX;
		if (!drag.moved) {
			if (Math.abs(dx) < DRAG_THRESHOLD) return;
			drag.moved = true;
			setDragging(true);
			// Recién ahora se captura: si se capturara al apretar, un click normal apuntaría a la página y no al botón.
			pageRef.current.setPointerCapture(event.pointerId);
		}
		pageRef.current.scrollLeft = drag.startScroll - dx;
	}

	function endDrag(event) {
		if (drag.pointerId !== event.pointerId) return;
		drag.pointerId = null;
		setDragging(false);
	}

	// Al soltar después de arrastrar no tiene que abrirse la actividad que quedó bajo el mouse.
	function handleClickCapture(event) {
		if (drag.moved) {
			drag.moved = false;
			event.preventDefault();
			event.stopPropagation();
		}
	}

	return (
		<div
			ref={pageRef}
			className={`page page-mundo1${teleport ? " traveling" : ""}${dragging ? " dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo1-compact-menu" aria-label="Elegir letra">
					<button
						className="mundo1-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedOption?.toUpperCase() || "A"}`}
						aria-expanded={compactMenuOpen}
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<LetterScoop letter={selectedOption || "a"} />
					</button>
					{compactMenuOpen && (
						<div className="mundo1-compact-menu__options">
							{MENU_OPTIONS.map(({ key }) => (
								<button
									key={key}
									className={selectedOption === key ? "mundo1-compact-menu__option selected" : "mundo1-compact-menu__option"}
									type="button"
									aria-label={`Elegir letra ${key.toUpperCase()}`}
									aria-pressed={selectedOption === key}
									onClick={() => selectMenuOption(key)}
								>
									<LetterScoop letter={key} />
								</button>
							))}
						</div>
					)}
				</nav>
			)}

			{/* Fijo arriba al centro: sigue ahí aunque se recorra el camino. */}
			<button className="mundo1-monster-button" type="button" aria-label="Ver al monstruo y sus comidas" onClick={openMonster}>
				<img className="mundo1-monster-cloud" src={img("nube.png")} alt="" aria-hidden="true" draggable={false} />
				<Monstruo letra={selectedOption || "a"} />
			</button>
			{characterOffscreen && character && (
				<button className={`mundo1-character-locator direction-${characterDirection}`} type="button" aria-label="Ir hasta mi personaje" onClick={scrollToCharacter}>
					<img src={img(character === "supernena" ? "cabezasupernena.png" : "cabezasupernene.png")} alt="" draggable={false} />
				</button>
			)}

			<div className="mundo1-scene">
				<div className="mundo1-base">
					<img className="mundo1-background" src={img("FONDOM1.jpg")} alt="" draggable={false} onLoad={scrollToPerch} />
					{PATH_BUTTONS.map(({ left, top }, index) => (
						<div
							className={`${index >= 7 && !wordPathUnlocked ? "path-activity-hidden " : ""}${selectedOption && !isActivityAvailable(index) ? "path-activity path-activity-unavailable" : "path-activity"}${index === characterIndex ? " path-activity-current" : ""}`}
							key={`${left}-${top}`}
							style={{ left: `${left}%`, top: `${top}%` }}
						>
							{index === characterIndex && <span className="path-activity-glow" aria-hidden="true" />}
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
					<img
						className={`mundo1-word-sign${selectedMonsterEvolved ? " unlocked" : " locked"}`}
						src={img("cartelPALABRAS.png")}
						alt={selectedMonsterEvolved ? "Cartel Palabras desbloqueado" : "Cartel Palabras bloqueado hasta evolucionar el monstruo"}
						draggable={false}
					/>
					{selectedMonsterEvolved && (
						<div className="mundo1-evolved-monster" key={selectedOption}>
							<div className={evolvedMonsterArriving ? PUF_CHARACTER_CLASS.in : undefined}>
								{selectedOption === "s" ? (
									<button className="mundo1-festejo" type="button" aria-label="Ir al monstruo y escuchar las palabras" onClick={handleEvolvedMonsterClick}>
										<img src={CELEBRATION_FRAMES[celebrationFrame]} alt="" draggable={false} />
									</button>
								) : (
									<button className="mundo1-festejo mundo1-festejo-static" type="button" aria-label="Ir al monstruo y escuchar las palabras" onClick={handleEvolvedMonsterClick}>
										<Monstruo letra={selectedOption} evolucionado className="mundo1-evolved-monster__image" />
									</button>
								)}
							</div>
							{evolvedMonsterArriving && <PufCrema mode="in" className="mundo1-evolved-monster__puf" />}
						</div>
					)}
					{character && (
						<div
							ref={characterSpotRef}
							className={characterIndex === null ? "mundo1-character-spot" : "mundo1-character-spot perched"}
							style={characterIndex === null ? undefined : getPerchStyle(characterIndex)}
						>
							<div className={teleport ? PUF_CHARACTER_CLASS[teleport.stage] : undefined}>
								<button
									className="mundo1-character"
									type="button"
									aria-label="Reproducir presentación"
									onClick={playIntroAudio}
								>
									<img src={MUNDO1_CHARACTERS[character].image} alt={MUNDO1_CHARACTERS[character].alt} />
									{mouth.visible && <img className={mouth.shifted ? "character-mouth shifted-mouth" : "character-mouth"} src={mouth.src} alt="" />}
								</button>
							</div>
							{teleport && <PufCrema mode={teleport.stage} className="mundo1-puf" />}
						</div>
					)}

					<aside ref={menuPanelRef} className="menu-panel" aria-label="Menú del mundo 1">
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
				<img className="mundo1-background-extension" src={img("FONDOM1bis.jpg")} alt="" draggable={false} />
			</div>
		</div>
	);
}

function LetterScoop({ letter }) {
	return (
		<span className="mundo1-letter-scoop" data-letter={letter}>
			<img src={img(SCOOP_IMAGES[letter])} alt="" />
		</span>
	);
}
