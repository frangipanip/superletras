import { useEffect, useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO2_CHARACTERS, MUNDO2_MOUTH_IMAGES, sound } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo2.css";

const LETTERS = ["P", "N", "D", "F", "H"];
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
	[23.5, 80], [35.9, 67], [45, 81], [50.9, 54], [57.4, 54],
	[62, 73], [69, 73], [76.8, 80], [85.6, 68], [94, 80]
];

export const MUNDO2_IMAGES = [
	img("FONDOM2.jpg"),
	img("MENUM2.png"),
	img("boton.svg"),
	...ACTIVITY_SIGN_IMAGES.map(img),
	...Object.values(MUNDO2_CHARACTERS).map(({ image }) => image),
	...MUNDO2_MOUTH_IMAGES
];

export default function Mundo2() {
	usePageTitle("Mundo 2");
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
	const pageRef = useRef(null);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

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
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo2MenuOption, letter);
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

	useEffect(() => {
		playIntroAudio();
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

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo2-menu-panel, .mundo2-character")) return;
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
			className={`page page-mundo2${dragging ? " dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={handleClickCapture}
			onDragStart={(event) => event.preventDefault()}
		>
			<UserNav />
			<div className="mundo2-scene">
				<img className="mundo2-background" src={img("FONDOM2.jpg")} alt="" draggable={false} />

				<div className="mundo2-path" aria-label="Actividades todavía no disponibles">
					{PATH_BUTTONS.map(([left, top], index) => (
						<div className="mundo2-path-activity" key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }}>
							<img
								className="mundo2-path-sign"
								src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")}
								alt=""
								draggable={false}
							/>
							<button className={`mundo2-path-button${selectedLetter ? ` path-letter-${selectedLetter.toLowerCase()}` : ""}`} type="button" disabled aria-label={`Actividad ${index + 1}, no disponible`}>
								<img src={img("boton.svg")} alt="" draggable={false} />
							</button>
						</div>
					))}
				</div>

				{character && (
					<div className="mundo2-character-spot">
						<button className="mundo2-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
							<img src={MUNDO2_CHARACTERS[character].image} alt={MUNDO2_CHARACTERS[character].alt} />
							{mouth.visible && <img className="character-mouth" src={mouth.src} alt="" />}
						</button>
					</div>
				)}

				<aside className="mundo2-menu-panel" aria-label="Letras del Mundo 2">
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
							{letter}
						</button>
					))}
				</aside>
			</div>
		</div>
	);
}