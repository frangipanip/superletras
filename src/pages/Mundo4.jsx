import { useEffect, useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO4_CHARACTER_FRAMES, MUNDO4_CHARACTERS, MUNDO4_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import SeaLifeEffects from "../components/SeaLifeEffects";
import "./Mundo4.css";

const LETTERS = ["C", "CE", "Q", "Z", "CH"];
const CHARACTER_FRAME_DURATION = 375;

export const MUNDO4_IMAGES = [
	img("FONDOM4.jpg"),
	img("MENUM4.png"),
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
	const pageRef = useRef(null);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

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
		if (event.target.closest(".top-nav, .mundo4-menu-panel, .mundo4-character")) return;
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
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo4MenuOption, letter);
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
			<main className="mundo4-scene">
				<img className="mundo4-background" src={img("FONDOM4.jpg")} alt="" draggable={false} />
				<SeaLifeEffects variant="mundo4" />

				{character && (
					<button className="mundo4-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
						<img
							className="mundo4-character-image"
							src={MUNDO4_CHARACTER_FRAMES[character][characterFrame]}
							alt={MUNDO4_CHARACTERS[character].alt}
							draggable={false}
						/>
						{mouth.visible && <img className="mundo4-character-mouth" src={mouth.src} alt="" />}
					</button>
				)}

				<aside className="mundo4-menu-panel" aria-label="Letras del Mundo 4">
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
							<span aria-hidden="true">{letter}</span>
						</button>
					))}
				</aside>
			</main>
		</div>
	);
}