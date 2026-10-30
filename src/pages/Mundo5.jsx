import { useEffect, useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO5_CHARACTERS, MUNDO5_MOUTH_IMAGES, sound } from "../lib/assets";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import "./Mundo5.css";

const LETTERS = ["G", "GE", "GU", "J", "GÜ"];
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
	"GLOBOSbtn.png"
];
const PATH_BUTTONS = [8, 17, 26, 35, 44, 53, 62, 71, 80, 90, 12.5, 21.5, 30.5, 39.5, 48.5, 57.5, 66.5, 75.5, 85];
const LETTER_COLORS = {
	G: "red",
	GE: "yellow",
	GU: "blue",
	J: "green",
	"GÜ": "purple"
};

export const MUNDO5_IMAGES = [
	img("FONDOM5.png"),
	img("FONDOM5bis.png"),
	img("MENUM5.png"),
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
	const [introAudio] = useState(() => runtime.audio(sound("InicioMundos.mp3"), { preload: true }));
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

	function selectLetter(letter) {
		setSelectedLetter(letter);
		writeStorage(STORAGE_KEYS.mundo5MenuOption, letter);
	}

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo5-menu-panel, .mundo5-character")) return;
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
			<main className="mundo5-scene" aria-label="Mundo 5">
				<div className="mundo5-backgrounds" aria-hidden="true">
					<img className="mundo5-background" src={img("FONDOM5.png")} alt="" draggable={false} />
					<img className="mundo5-background" src={img("FONDOM5bis.png")} alt="" draggable={false} />
				</div>

				<div className="mundo5-path" aria-label="Camino de actividades">
					{PATH_BUTTONS.map((left, index) => (
						<div className="mundo5-path-activity" key={left} style={{ left: `${left}%` }}>
							<img className="mundo5-path-sign" src={img(ACTIVITY_SIGN_IMAGES[index] || "GLOBOSbtn.png")} alt="" draggable={false} />
							<button
								className={`mundo5-path-button${selectedLetter ? ` path-letter-${LETTER_COLORS[selectedLetter]}` : " path-letter-default"}`}
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
					<button className="mundo5-character" type="button" aria-label="Reproducir presentación" onClick={playIntroAudio}>
						<img src={MUNDO5_CHARACTERS[character].image} alt={MUNDO5_CHARACTERS[character].alt} draggable={false} />
						{mouth.visible && <img className="mundo5-character-mouth" src={mouth.src} alt="" />}
					</button>
				)}

				<aside className="mundo5-menu-panel" aria-label="Letras del Mundo 5">
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
