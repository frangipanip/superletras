import { useRef, useState } from "react";
import UserNav from "../components/UserNav";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img } from "../lib/assets";
import { STORAGE_KEYS, readStorage, writeStorage } from "../lib/storage";
import "./Mundo4.css";

const LETTERS = ["C", "CE", "Q", "Z", "CH"];
const CHARACTER_IMAGES = {
	supernena: img("PERSONAJES/supernenaSirena.png"),
	supernene: img("PERSONAJES/superneneSirena.png")
};

export const MUNDO4_IMAGES = [
	img("FONDOM4.png"),
	img("MENUM4.png"),
	...Object.values(CHARACTER_IMAGES)
];

export default function Mundo4() {
	usePageTitle("Mundo 4");
	const [character] = useSelectedCharacter();
	const [selectedLetter, setSelectedLetter] = useState(() => {
		const saved = readStorage(STORAGE_KEYS.mundo4MenuOption);
		return LETTERS.includes(saved) ? saved : null;
	});
	const pageRef = useRef(null);
	const drag = useRef({ pointerId: null, startX: 0, startScroll: 0, moved: false }).current;
	const [dragging, setDragging] = useState(false);

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
				<img className="mundo4-background" src={img("FONDOM4.png")} alt="" draggable={false} />

				{character && (
					<div className="mundo4-character">
						<img src={CHARACTER_IMAGES[character]} alt={character === "supernena" ? "Supernena" : "Supernene"} draggable={false} />
					</div>
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
							{letter}
						</button>
					))}
				</aside>
			</main>
		</div>
	);
}