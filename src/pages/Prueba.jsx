import { useRef, useState } from "react";
import { img } from "../lib/assets";
import SeaLifeEffects from "../components/SeaLifeEffects";
import "./Prueba.css";

const HOUSE_IMAGES = ["casa2.png", "casa3.png", "casa4.png", "casa5.png", "casa6.png"];

function Seaweed() {
	return (
		<svg className="prueba-alga" viewBox="0 0 100 160">
			<path className="prueba-alga-tallo" d="M50 158C34 128 66 108 47 82 31 60 59 36 48 4" />
			<path className="prueba-alga-hoja" d="M46 129C17 127 8 110 14 93 32 94 46 107 46 129Z" />
			<path className="prueba-alga-hoja" d="M52 107C79 105 91 88 84 71 66 73 54 88 52 107Z" />
			<path className="prueba-alga-hoja" d="M45 79C20 77 12 61 18 47 34 49 45 62 45 79Z" />
			<path className="prueba-alga-hoja" d="M51 57C74 55 84 40 78 25 63 27 52 40 51 57Z" />
		</svg>
	);
}

function Seashell({ className = "prueba-caracola" }) {
	return (
		<svg className={className} viewBox="0 0 80 68">
			<path d="M9 48C7 26 19 8 40 8 61 8 73 26 71 48Q40 66 9 48Z" fill="currentColor" stroke="#bd805f" strokeWidth="2" />
			<path d="M40 60Q25 37 17 22M40 60Q32 33 31 13M40 60V10M40 60Q48 33 49 13M40 60Q55 37 63 22" fill="none" stroke="#fff0d5" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
			<path d="M12 48Q40 61 68 48" fill="none" stroke="#d18b67" strokeWidth="3" />
		</svg>
	);
}

export default function Prueba() {
	const viewportRef = useRef(null);
	const drag = useRef(null);
	const [dragging, setDragging] = useState(false);

	function handlePointerDown(event) {
		if (drag.current || (event.pointerType === "mouse" && event.button !== 0)) return;
		drag.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startScroll: viewportRef.current.scrollLeft,
			moved: false
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event) {
		if (drag.current?.pointerId !== event.pointerId) return;
		const distance = event.clientX - drag.current.startX;
		if (!drag.current.moved && Math.abs(distance) < 5) return;
		if (!drag.current.moved) {
			drag.current.moved = true;
			setDragging(true);
		}
		viewportRef.current.scrollLeft = drag.current.startScroll - distance;
	}

	function handlePointerEnd(event) {
		if (drag.current?.pointerId !== event.pointerId) return;
		drag.current = null;
		setDragging(false);
	}

	return (
		<main
			ref={viewportRef}
			className={`page page-prueba${dragging ? " dragging" : ""}`}
			tabIndex="0"
			aria-label="Escena del mar"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
			onDragStart={(event) => event.preventDefault()}
		>
			<div className="prueba-world">
				<div
					className="prueba-camino"
					aria-hidden="true"
					style={{ backgroundImage: `url("${img("prueba/camino.png")}")` }}
				/>
				<img className="prueba-castillo" src={img("prueba/castilo.png")} alt="" draggable={false} />
				<img className="prueba-menu-m4" src={img("MENUM4.png")} alt="" draggable={false} />
				<img className="prueba-cartel" src={img("prueba/cartel.png")} alt="" draggable={false} />
				<div className="prueba-casas" aria-hidden="true">
					{HOUSE_IMAGES.map((house) => (
						<img className="prueba-casa" key={house} src={img(`prueba/${house}`)} alt="" draggable={false} />
					))}
				</div>
				<div className="prueba-fondo-marino" aria-hidden="true">
					<div className="prueba-algas">
						{Array.from({ length: 26 }, (_, index) => <Seaweed key={index} />)}
					</div>
					<div className="prueba-caracolas">
						{Array.from({ length: 16 }, (_, index) => <Seashell key={index} />)}
					</div>
				</div>
				<SeaLifeEffects />
			</div>
		</main>
	);
}