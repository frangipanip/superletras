import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import ActivityPath, { ACTIVITY_PATH_SIGNS, WORLD_ACTIVITY_PATHS } from "../components/ActivityPath";
import CharacterLocator from "../components/CharacterLocator";
import UserNav from "../components/UserNav";
import { useCharacterLocator } from "../hooks/useCharacterLocator";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO3_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo3.css";

const LETTERS = ["R", "RR", "AR", "Y", "LL"];
const LETTER_BLOCKS = {
	R: img("bloqueR.png"),
	RR: img("bloqueRR.png"),
	AR: img("bloqueAR.png"),
	Y: img("bloqueY.png"),
	LL: img("bloqueLL.png")
};
const CLOUDS = [
	{ id: 1, direction: "right", left: "0%", top: "13%", width: "clamp(68px, 7vw, 116px)", duration: "38s", delay: "-11s", mid: "12vw", end: "34vw" },
	{ id: 2, direction: "left", left: "8%", top: "28%", width: "clamp(95px, 10vw, 168px)", duration: "56s", delay: "-37s", mid: "-11vw", end: "-31vw" },
	{ id: 3, direction: "right", left: "17%", top: "8%", width: "clamp(56px, 5.5vw, 94px)", duration: "43s", delay: "-16s", mid: "14vw", end: "38vw" },
	{ id: 4, direction: "left", left: "25%", top: "34%", width: "clamp(112px, 12vw, 202px)", duration: "63s", delay: "-49s", mid: "-13vw", end: "-36vw" },
	{ id: 5, direction: "right", left: "34%", top: "19%", width: "clamp(78px, 8vw, 136px)", duration: "49s", delay: "-27s", mid: "10vw", end: "29vw" },
	{ id: 6, direction: "left", left: "42%", top: "10%", width: "clamp(132px, 14vw, 235px)", duration: "59s", delay: "-42s", mid: "-15vw", end: "-39vw" },
	{ id: 7, direction: "right", left: "51%", top: "31%", width: "clamp(64px, 6.5vw, 110px)", duration: "35s", delay: "-8s", mid: "13vw", end: "35vw" },
	{ id: 8, direction: "left", left: "59%", top: "15%", width: "clamp(104px, 11vw, 184px)", duration: "61s", delay: "-51s", mid: "-12vw", end: "-34vw" },
	{ id: 9, direction: "right", left: "68%", top: "25%", width: "clamp(80px, 8vw, 136px)", duration: "46s", delay: "-22s", mid: "11vw", end: "32vw" },
	{ id: 10, direction: "left", left: "76%", top: "9%", width: "clamp(122px, 13vw, 218px)", duration: "65s", delay: "-56s", mid: "-14vw", end: "-37vw" },
	{ id: 11, direction: "right", left: "85%", top: "33%", width: "clamp(58px, 6vw, 102px)", duration: "41s", delay: "-18s", mid: "12vw", end: "33vw" },
	{ id: 12, direction: "left", left: "93%", top: "21%", width: "clamp(94px, 9.5vw, 160px)", duration: "53s", delay: "-33s", mid: "-10vw", end: "-30vw" }
];
const CHARACTER_IMAGES = {
	supernena: img("PERSONAJES/supernenaBloque.png"),
	supernene: img("PERSONAJES/superneneBloque.png")
};
const LETTER_SOUNDS = {
	R: "suenaR.mp3",
	RR: "suenaRR.mp3",
	AR: "suenaAR.mp3",
	Y: "suenaY.mp3",
	LL: "suenaLL.mp3"
};

export const MUNDO3_IMAGES = [
	img("FONDOM3.jpg"),
	img("menuM3.png"),
	img("nubeM3.png"),
	img("boton.svg"),
	...ACTIVITY_PATH_SIGNS.map(img),
	...Object.values(LETTER_BLOCKS),
	...Object.values(CHARACTER_IMAGES),
	...MUNDO3_MOUTH_IMAGES
];

export default function Mundo3() {
	usePageTitle("Mundo 3");
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO3_MOUTH_IMAGES);
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo3MenuOption);
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

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo3-compact-menu, .mundo3-menu-panel, .mundo3-character, .activity-path, .character-locator")) return;
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
		writeStorage(STORAGE_KEYS.mundo3MenuOption, letter);
		setCompactMenuOpen(false);
	}

	function openInicioActivity() {
		const letter = selectedLetter || LETTERS[0];
		writeStorage(STORAGE_KEYS.mundo3MenuOption, letter);
		navigate("/inicio", { state: { menuOption: letter, world: 3 } });
	}

	return (
		<div
			ref={pageRef}
			className={`page page-mundo3${dragging ? " dragging" : ""}`}
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
				<nav ref={compactMenuRef} className="mundo3-compact-menu" aria-label="Elegir letra">
					<button
						ref={compactMenuToggleRef}
						className="mundo3-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedLetter || LETTERS[0]}`}
						aria-expanded={compactMenuOpen}
						aria-controls="mundo3-compact-menu-options"
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<img src={LETTER_BLOCKS[selectedLetter || LETTERS[0]]} alt="" draggable={false} />
					</button>
					{compactMenuOpen && (
						<div className="mundo3-compact-menu__options" id="mundo3-compact-menu-options">
							{LETTERS.map((letter) => (
								<button
									className={selectedLetter === letter ? "mundo3-compact-menu__option selected" : "mundo3-compact-menu__option"}
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
			<main className="mundo3-scene">
				<img className="mundo3-background" src={img("FONDOM3.jpg")} alt="" draggable={false} />
				<div className="mundo3-clouds" aria-hidden="true">
					{CLOUDS.map((cloud) => (
						<img
							className={`mundo3-cloud mundo3-cloud--${cloud.direction}`}
							key={cloud.id}
							src={img("nubeM3.png")}
							alt=""
							draggable={false}
							style={{
								"--left": cloud.left,
								"--top": cloud.top,
								"--width": cloud.width,
								"--duration": cloud.duration,
								"--delay": cloud.delay,
								"--drift-mid": cloud.mid,
								"--drift-end": cloud.end
							}}
						/>
					))}
				</div>

				<ActivityPath
					positions={WORLD_ACTIVITY_PATHS.mundo3}
					visibleCount={1}
					onActivityClick={openInicioActivity}
				/>

				{character && (
					<div className="mundo3-character" ref={characterSpotRef}>
						<img src={CHARACTER_IMAGES[character]} alt={character === "supernena" ? "Supernena" : "Supernene"} draggable={false} />
						<img className="mundo3-character__mouth" src={mouth.src} alt="" hidden={!mouth.visible} draggable={false} />
					</div>
				)}

				<aside ref={menuPanelRef} className="mundo3-menu-panel" aria-label="Letras del Mundo 3">
					<img className="mundo3-menu-image" src={img("menuM3.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo3-letter mundo3-letter-${index + 1}${selectedLetter === letter ? " selected" : ""}`}
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