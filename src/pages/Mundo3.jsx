import { useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo3.css";

const LETTERS = ["R", "RR", "AR", "Y", "LL"];
const CHARACTER_IMAGES = {
	supernena: img("PERSONAJES/supernenaBloque.png"),
	supernene: img("PERSONAJES/superneneBloque.png")
};

export const MUNDO3_IMAGES = [
	img("FONDOM3.jpg"),
	img("menuM3.png"),
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