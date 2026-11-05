import { useEffect, useRef, useState } from "react";
import CharacterLocator from "../components/CharacterLocator";
import UserNav from "../components/UserNav";
import { useCharacterLocator } from "../hooks/useCharacterLocator";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO5_CHARACTERS, MUNDO5_MOUTH_IMAGES, sound } from "../lib/assets";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import "./Mundo5.css";

const LETTERS = ["G", "GE", "GU", "J", "GÜ"];
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
	"MEMOTESTbtn.png",
	"BARCOSbtn.png",
	"PASTELbtn.png",
	"PUZZLEbtn.png",
	"DECORAbtn.png",
	"GLOBOSbtn.png"
];
const PATH_BUTTONS = [
	[8, 83], [17, 83], [26, 83], [35, 83], [44, 83],
	[53, 83], [62, 83], [71, 83], [80, 83], [90, 83],
	[12.5, 83], [21.5, 83], [30.5, 83], [39.5, 83], [48.5, 83],
	[57.5, 83], [66.5, 83], [75.5, 83], [85, 83]
];

export const MUNDO5_IMAGES = [
	img("FONDOM5.png"),
	img("FONDOM5bis.png"),
	img("MENUM5.png"),
	...Object.values(LETTER_BLOCKS),
	...Object.values(MUNDO5_CHARACTERS).map(({ image }) => image),
	...MUNDO5_MOUTH_IMAGES,
	img("boton.svg"),
	...ACTIVITY_SIGN_IMAGES.map(img)
];

export default function Mundo5() {
	usePageTitle("Mundo 5");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO5_MOUTH_IMAGES);
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo5MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
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
			{characterOffscreen && (
				<CharacterLocator character={character} direction={characterDirection} onClick={scrollToCharacter} />
			)}
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo5-compact-menu" aria-label="Elegir letra">
					<button
						ref={compactMenuToggleRef}
						className="mundo5-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedLetter || LETTERS[0]}`}
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
			<main className="mundo5-scene" aria-label="Mundo 5">
				<div className="mundo5-backgrounds" aria-hidden="true">
					<img className="mundo5-background" src={img("FONDOM5.png")} alt="" draggable={false} />
					<img className="mundo5-background" src={img("FONDOM5bis.png")} alt="" draggable={false} />
				</div>

				<div className="mundo5-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div
							className="mundo5-path-activity mundo5-path-activity-hidden"
							key={`${left}-${top}-${index}`}
							style={{ left: `${left}%`, top: `${top}%` }}
						>
							<img className="mundo5-path-sign" src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")} alt="" draggable={false} />
							<button
								className="mundo5-path-button"
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
					<button ref={characterSpotRef} className="mundo5-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
						<img src={MUNDO5_CHARACTERS[character].image} alt={MUNDO5_CHARACTERS[character].alt} draggable={false} />
						{mouth.visible && <img className="mundo5-character-mouth" src={mouth.src} alt="" />}
					</button>
				)}

				<aside ref={menuPanelRef} className="mundo5-menu-panel" aria-label="Letras del Mundo 5">
					<img className="mundo5-menu-image" src={img("MENUM5.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo5-letter mundo5-letter-${index + 1} letter-color-${LETTER_COLORS[letter]}${selectedLetter === letter ? " selected" : ""}`}
							key={letter}
							type="button"
							aria-label={`Seleccionar letra ${letter}`}
							aria-pressed={selectedLetter === letter}
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
