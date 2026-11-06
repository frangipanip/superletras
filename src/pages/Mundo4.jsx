import { useEffect, useRef, useState } from "react";
import CharacterLocator from "../components/CharacterLocator";
import UserNav from "../components/UserNav";
import { useCharacterLocator } from "../hooks/useCharacterLocator";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO4_CHARACTER_FRAMES, MUNDO4_CHARACTERS, MUNDO4_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import SeaLifeEffects from "../components/SeaLifeEffects";
import "./Mundo4.css";

const LETTERS = ["C", "CE", "Q", "Z", "CH"];
const LETTER_BLOCKS = {
	C: img("almejaC.png"),
	CE: img("almejaCE.png"),
	Q: img("almejaQ.png"),
	Z: img("almejaZ.png"),
	CH: img("almejaCH.png")
};
const LETTER_SOUNDS = {
	C: "suenaC.mp3",
	CE: "suenaCE.mp3",
	Q: "suenaQ.mp3",
	Z: "suenaZ.mp3",
	CH: "suenaCH.mp3"
};
const CHARACTER_FRAME_DURATION = 375;
const ACTIVITY_SIGN_IMAGES = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"MEMOTESTbtn.png",
	"BARCOSbtn.png",
	"PASTELbtn.png",
	"PUZZLEbtn.png",
	"DECORAbtn.png",
	"GLOBOSbtn.png"
];
const PATH_BUTTONS = [
	[20, 72], [24, 76], [28, 70], [32, 67], [36, 71],
	[40, 76], [44, 72], [48, 68], [52, 72], [56, 77],
	[60, 73], [64, 68], [68, 72], [72, 77], [76, 73],
	[80, 69], [84, 73], [88, 78], [92, 74]
];

export const MUNDO4_IMAGES = [
	img("FONDOM4.jpg"),
	img("MENUM4.png"),
	img("boton.svg"),
	...ACTIVITY_SIGN_IMAGES.map(img),
	...Object.values(LETTER_BLOCKS),
	...Object.values(MUNDO4_CHARACTERS).map(({ image }) => image),
	...Object.values(MUNDO4_CHARACTER_FRAMES).flatMap((frames) => frames.slice(1, -1)),
	...MUNDO4_MOUTH_IMAGES
];

export default function Mundo4() {
	usePageTitle("Mundo 4");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO4_MOUTH_IMAGES);
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
	const [characterFrame, setCharacterFrame] = useState(0);
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo4MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const pageRef = useRef(null);
	const menuPanelRef = useRef(null);
	const compactMenuRef = useRef(null);
	const compactMenuToggleRef = useRef(null);
	const characterSpotRef = useRef(null);
	const letterAudioRef = useRef(null);
	const { offscreen: characterOffscreen, direction: characterDirection, scrollToCharacter } =
		useCharacterLocator(pageRef, characterSpotRef, character);
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

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo4-compact-menu, .mundo4-menu-panel, .mundo4-character, .mundo4-path, .character-locator")) return;
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
		if (drag.moved) {
			drag.moved = false;
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function selectLetter(letter) {
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
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo4MenuOption, letter);
		setCompactMenuOpen(false);
	}

	useEffect(() => {
		if (!character) return undefined;
		let timer = 0;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		function updateAnimation() {
			runtime.clearInterval(timer);
			timer = 0;
			setCharacterFrame(0);
			if (document.visibilityState === "visible" && document.hasFocus() && !reducedMotion.matches) {
				timer = runtime.setInterval(() => {
					setCharacterFrame((current) => (current + 1) % MUNDO4_CHARACTER_FRAMES[character].length);
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
		if (!character) return undefined;
		playIntroAudio();
		return () => {
			introAudio.onended = null;
			introAudio.pause();
			introAudio.currentTime = 0;
			if (letterAudioRef.current) {
				letterAudioRef.current.onended = null;
				letterAudioRef.current.pause();
				letterAudioRef.current.currentTime = 0;
				letterAudioRef.current = null;
			}
			stopTalking();
		};
	}, [character]);

	return (
		<div
			ref={pageRef}
			className={`page page-mundo4${dragging ? " dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			{characterOffscreen && (
				<CharacterLocator character={character} direction={characterDirection} onClick={scrollToCharacter} />
			)}
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo4-compact-menu" aria-label="Elegir letra">
					<button
						ref={compactMenuToggleRef}
						className="mundo4-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedLetter || LETTERS[0]}`}
						aria-expanded={compactMenuOpen}
						aria-controls="mundo4-compact-menu-options"
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<img src={LETTER_BLOCKS[selectedLetter || LETTERS[0]]} alt="" draggable={false} />
					</button>
					{compactMenuOpen && (
						<div className="mundo4-compact-menu__options" id="mundo4-compact-menu-options">
							{LETTERS.map((letter) => (
								<button
									className={selectedLetter === letter ? "mundo4-compact-menu__option selected" : "mundo4-compact-menu__option"}
									key={letter}
									type="button"
									aria-label={`Elegir letra ${letter}`}
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
			<main className="mundo4-scene">
				<img className="mundo4-background" src={img("FONDOM4.jpg")} alt="" draggable={false} />
				<SeaLifeEffects variant="mundo4" />
				<div className="mundo4-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div
							className="mundo4-path-activity mundo4-path-activity-hidden"
							key={`${left}-${top}-${index}`}
							style={{ left: `${left}%`, top: `${top}%` }}
						>
							<img className="mundo4-path-sign" src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")} alt="" draggable={false} />
							<button
								className="mundo4-path-button"
								type="button"
								disabled
								aria-label={`Actividad del camino ${index + 1}, próximamente`}
							>
								<img src={img("boton.svg")} alt="" draggable={false} />
							</button>
						</div>
					))}
				</div>

				{character && (
					<button ref={characterSpotRef} className="mundo4-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
						<img
							className="mundo4-character-image"
							src={MUNDO4_CHARACTER_FRAMES[character][characterFrame]}
							alt={MUNDO4_CHARACTERS[character].alt}
							draggable={false}
						/>
						{mouth.visible && <img className="mundo4-character-mouth" src={mouth.src} alt="" />}
					</button>
				)}

				<aside ref={menuPanelRef} className="mundo4-menu-panel" aria-label="Letras del Mundo 4">
					<img className="mundo4-menu-image" src={img("MENUM4.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo4-letter mundo4-letter-${index + 1}${selectedLetter === letter ? " selected" : ""}`}
							key={letter}
							type="button"
							aria-label={`Seleccionar letra ${letter}`}
							aria-pressed={selectedLetter === letter}
							onClick={() => selectLetter(letter)}
						>
							<span className="mundo4-letter__label" aria-hidden="true">{letter}</span>
						</button>
					))}
				</aside>
			</main>
		</div>
	);
}