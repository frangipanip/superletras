import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PufCrema, { PUF_CHARACTER_CLASS } from "../components/PufCrema";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { useTeleport } from "../hooks/useTeleport";
import { img, MUNDO2_CHARACTER_FRAMES, MUNDO2_CHARACTERS, MUNDO2_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo2.css";

const LETTERS = ["P", "N", "D", "F", "H"];
const FLOWER_IMAGES = {
	P: "florP.png",
	N: "florN.png",
	D: "florD.png",
	F: "florF.png",
	H: "florH.png"
};
const ACTIVITY_SIGN_IMAGES = [
	"INICIALESbtn.png",
	"MARIPOSAbtn.png",
	"FLORbtn.png",
	"PELUCHESbtn.png",
	"TRENbtn.png",
	"DIBUJARbtn.png",
	"MEMOTESTbtn.png"
];
const PATH_BUTTONS = [
	[23, 65],
	[29, 70],
	[35, 63],
	[41.5 ,69.5],
	[49.5, 65],
	[59, 63],
	[67, 69.5],
	[73, 65],
	[79, 69.5],
	[88, 80],
	[26, 67.5],
	[32, 66.5],
	[38.25, 66.25],
	[45.5, 67.25],
	[54.25, 64],
	[63, 66.25],
	[70, 67.25],
	[76, 67.25],
	[83.5, 74.75]
];
const ACTIVITY_ROUTES = ["/inicio", "/mariposas"];

function readSavedPerches() {
	try {
		const saved = JSON.parse(readStorage(STORAGE_KEYS.mundo2Perches) || "{}");
		return Object.fromEntries(Object.entries(saved).filter(([letter, index]) =>
			LETTERS.includes(letter) && Number.isInteger(index) && index <= 1 && PATH_BUTTONS[index]
		));
	} catch {
		return {};
	}
}

function getPerchStyle(index) {
	const [left, top] = PATH_BUTTONS[index];
	return { left: `${left}%`, top: `${top}%` };
}

export const MUNDO2_IMAGES = [
	img("FONDOM2.jpg"),
	img("MENUM2.png"),
	...LETTERS.map((letter) => img(`${letter}btn.png`)),
	...Object.values(FLOWER_IMAGES).map(img),
	...LETTERS.map((letter) => img(`letra${letter}.png`)),
	...["A", "E", "I", "O", "U"].flatMap((vowel) => [1, 2, 3].map((frame) => img(`mariquita${vowel}${frame}.png`))),
	img("boton.svg"),
	...ACTIVITY_SIGN_IMAGES.map(img),
	img("cabezasupernena.png"),
	img("cabezasupernene.png"),
	...Object.values(MUNDO2_CHARACTERS).map(({ image }) => image),
	...Object.values(MUNDO2_CHARACTER_FRAMES).flatMap((frames) => frames.slice(1, 3)),
	...MUNDO2_MOUTH_IMAGES
];

export default function Mundo2() {
	usePageTitle("Mundo 2");
	const location = useLocation();
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO2_MOUTH_IMAGES);
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
	const [letterAudios] = useState(() => Object.fromEntries(
		LETTERS.map((letter) => [letter, runtime.audio(sound(`suena${letter}.mp3`), { preload: true })])
	));
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo2MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const [savedPerches, setSavedPerches] = useState(readSavedPerches);
	const { teleport, teleportCharacter } = useTeleport(runtime);
	const routePerch = location.state?.menuOption === selectedLetter && PATH_BUTTONS[location.state?.activityIndex]
		? location.state.activityIndex
		: null;
	const perchIndex = routePerch ?? (PATH_BUTTONS[savedPerches[selectedLetter]] ? savedPerches[selectedLetter] : null);
	const characterIndex = teleport ? teleport.position : perchIndex;
	const [menuPanelVisible, setMenuPanelVisible] = useState(true);
	const [compactMenuOpen, setCompactMenuOpen] = useState(false);
	const [characterOffscreen, setCharacterOffscreen] = useState(false);
	const [characterDirection, setCharacterDirection] = useState("left");
	const pageRef = useRef(null);
	const menuPanelRef = useRef(null);
	const compactMenuRef = useRef(null);
	const characterSpotRef = useRef(null);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

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

	function scrollToCharacter(smooth = true) {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot) return;
		const viewport = page.getBoundingClientRect();
		const characterBounds = characterSpot.getBoundingClientRect();
		const destination = page.scrollLeft + characterBounds.left + characterBounds.width / 2 - viewport.width / 2;
		const left = Math.max(0, Math.min(page.scrollWidth - page.clientWidth, destination));
		if (smooth) {
			page.scrollTo({ left, behavior: "smooth" });
		} else {
			page.scrollLeft = left;
		}
	}

	function playIntroAudio() {
		Object.values(letterAudios).forEach((audio) => {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		});
		introAudio.pause();
		introAudio.currentTime = 0;
		startTalking();
		introAudio.onended = stopTalking;
		introAudio.play().catch(stopTalking);
	}

	function selectLetter(letter) {
		const shouldPlayIntro = letter !== selectedLetter && perchIndex !== null && !PATH_BUTTONS[savedPerches[letter]];
		if (letter !== selectedLetter && location.state?.activityIndex !== undefined) {
			const { activityIndex, ...state } = location.state;
			navigate(location.pathname, { replace: true, state });
		}
		setCompactMenuOpen(false);
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo2MenuOption, letter);
		if (shouldPlayIntro) {
			playIntroAudio();
			return;
		}
		introAudio.onended = null;
		introAudio.pause();
		introAudio.currentTime = 0;
		Object.values(letterAudios).forEach((audio) => {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		});
		const audio = letterAudios[letter];
		startTalking();
		audio.onended = stopTalking;
		audio.play().catch(stopTalking);
	}

	function openPathActivity(index) {
		if (teleport) return;
		const route = ACTIVITY_ROUTES[index];
		if (!route) return;
		const letter = selectedLetter || LETTERS[0];
		const nextPerches = { ...savedPerches, [letter]: index };
		setSavedPerches(nextPerches);
		writeStorage(STORAGE_KEYS.mundo2Perches, JSON.stringify(nextPerches));
		writeStorage(STORAGE_KEYS.mundo2MenuOption, letter);
		const goToActivity = () => {
			navigate(location.pathname, { replace: true, state: { ...location.state, activityIndex: index, menuOption: letter } });
			navigate(route, { state: { menuOption: letter, world: 2 } });
		};
		if (!character || perchIndex === index) {
			goToActivity();
			return;
		}
		introAudio.onended = null;
		introAudio.pause();
		Object.values(letterAudios).forEach((audio) => {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		});
		stopTalking();
		teleportCharacter(perchIndex, index).then(goToActivity);
	}

	useEffect(() => {
		scrollToCharacter(false);
		if (perchIndex === null) {
			playIntroAudio();
		}
		return () => {
			introAudio.onended = null;
			introAudio.pause();
			introAudio.currentTime = 0;
			Object.values(letterAudios).forEach((audio) => {
				audio.onended = null;
				audio.pause();
				audio.currentTime = 0;
			});
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

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo2-compact-menu, .mundo2-menu-panel, .mundo2-character")) return;
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

	return (
		<div
			ref={pageRef}
			className={`page page-mundo2${dragging ? " dragging" : ""}${teleport ? " traveling" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			{!menuPanelVisible && (
				<nav ref={compactMenuRef} className="mundo2-compact-menu" aria-label="Elegir letra">
					<button
						className="mundo2-compact-menu__trigger"
						type="button"
						aria-label={`Elegir letra. Seleccionada ${selectedLetter || LETTERS[0]}`}
						aria-expanded={compactMenuOpen}
						onClick={() => setCompactMenuOpen((open) => !open)}
					>
						<img src={img(FLOWER_IMAGES[selectedLetter || LETTERS[0]])} alt="" draggable={false} />
					</button>
					{compactMenuOpen && (
						<div className="mundo2-compact-menu__options">
							{LETTERS.map((letter) => (
								<button
									key={letter}
									className={selectedLetter === letter ? "mundo2-compact-menu__option selected" : "mundo2-compact-menu__option"}
									type="button"
									aria-label={`Elegir letra ${letter}`}
									aria-pressed={selectedLetter === letter}
									onClick={() => selectLetter(letter)}
								>
									<img src={img(FLOWER_IMAGES[letter])} alt="" draggable={false} />
								</button>
							))}
						</div>
					)}
				</nav>
			)}
			{characterOffscreen && character && (
				<button className={`mundo2-character-locator direction-${characterDirection}`} type="button" aria-label="Ir hasta mi personaje" onClick={scrollToCharacter}>
					<img src={img(character === "supernena" ? "cabezasupernena.png" : "cabezasupernene.png")} alt="" draggable={false} />
				</button>
			)}
			<div className="mundo2-scene">
				<img className="mundo2-background" src={img("FONDOM2.jpg")} alt="" draggable={false} onLoad={() => scrollToCharacter(false)} />

				<div className="mundo2-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div className="mundo2-path-activity" key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }}>
							<img
								className={`mundo2-path-sign${index < ACTIVITY_ROUTES.length ? " available" : ""}`}
								src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")}
								alt=""
								draggable={false}
							/>
							<button
								className={`mundo2-path-button${selectedLetter ? ` path-letter-${selectedLetter.toLowerCase()}` : index === 0 ? " path-letter-p" : ""}`}
								type="button"
								disabled={index >= ACTIVITY_ROUTES.length || Boolean(teleport)}
								aria-label={index < ACTIVITY_ROUTES.length ? `Actividad ${index === 0 ? "Inicio" : "Mariposas"}` : `Actividad ${index + 1}, no disponible`}
								onClick={index < ACTIVITY_ROUTES.length ? () => openPathActivity(index) : undefined}
							>
								<img src={img("boton.svg")} alt="" draggable={false} />
							</button>
						</div>
					))}
				</div>

				{character && (
					<div
						ref={characterSpotRef}
						className={`mundo2-character-spot${characterIndex === null ? "" : " perched"}`}
						style={characterIndex === null ? undefined : getPerchStyle(characterIndex)}
					>
						<div className={teleport ? PUF_CHARACTER_CLASS[teleport.stage] : undefined}>
						<button className="mundo2-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
							{MUNDO2_CHARACTER_FRAMES[character].map((src, index) => (
								<img
									key={`${src}-${index}`}
									className={`mundo2-character-frame mundo2-character-frame-${index + 1}`}
									src={src}
									alt=""
									aria-hidden="true"
								/>
							))}
							{mouth.visible && <img className="character-mouth" src={mouth.src} alt="" />}
						</button>
						</div>
						{teleport && <PufCrema mode={teleport.stage} className="mundo2-puf" />}
					</div>
				)}

				<aside ref={menuPanelRef} className="mundo2-menu-panel" aria-label="Letras del Mundo 2">
					<img className="mundo2-menu-image" src={img("MENUM2.png")} alt="" draggable={false} />
					{LETTERS.map((letter, index) => (
						<button
							className={`mundo2-letter mundo2-letter-${index + 1}${selectedLetter === letter ? " selected" : ""}`}
							key={letter}
							data-letter={letter.toLowerCase()}
							type="button"
							aria-label={`Seleccionar letra ${letter}`}
							aria-pressed={selectedLetter === letter}
							onClick={() => selectLetter(letter)}
						>
							<img src={img(`${letter}btn.png`)} alt="" draggable={false} />
						</button>
					))}
				</aside>
			</div>
		</div>
	);
}