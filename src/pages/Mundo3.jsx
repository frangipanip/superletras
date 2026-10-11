import { useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo3.css";

const LETTERS = ["R", "RR", "AR", "Y", "LL"];
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

export const MUNDO3_IMAGES = [
	img("FONDOM3.jpg"),
	img("menuM3.png"),
	img("nubeM3.png"),
	...Object.values(CHARACTER_IMAGES)
];

export default function Mundo3() {
	usePageTitle("Mundo 3");
	const [character] = useSelectedCharacter();
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo3MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const pageRef = useRef(null);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

	function handlePointerDown(event) {
		drag.moved = false;
		if (event.pointerType !== "mouse" || event.button !== 0) return;
		if (event.target.closest(".top-nav, .mundo3-menu-panel, .mundo3-character")) return;
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
		writeStorage(STORAGE_KEYS.mundo3MenuOption, letter);
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

				{character && (
					<div className="mundo3-character">
						<img src={CHARACTER_IMAGES[character]} alt={character === "supernena" ? "Supernena" : "Supernene"} draggable={false} />
					</div>
				)}

				<aside className="mundo3-menu-panel" aria-label="Letras del Mundo 3">
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