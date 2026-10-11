import "./SeaLifeEffects.css";

const FISH_DIRECTIONS = ["derecha", "izquierda", "derecha", "izquierda", "derecha", "izquierda", "derecha", "izquierda", "derecha", "izquierda"];
const FISH_OFFSETS = {
	prueba: ["0vw", "20vw", "90vw", "80vw", "150vw", "220vw", "270vw", "325vw", "410vw", "500vw"],
	mundo4: ["0%", "3.3%", "15%", "13.3%", "25%", "36.7%", "45%", "54.2%", "68.3%", "83.3%"]
};
const JELLYFISH_OFFSETS = {
	prueba: ["18vw", "57vw", "112vw", "180vw", "244vw", "310vw", "370vw", "430vw", "490vw", "550vw"],
	mundo4: ["3%", "9.5%", "18.7%", "30%", "40.7%", "51.7%", "61.7%", "71.7%", "81.7%", "91.7%"]
};

function Fish({ direction, offset }) {
	return (
		<svg className={`sea-life-fish sea-life-fish--${direction}`} style={{ "--offset": offset }} viewBox="0 0 120 60">
			<path d="M84 30 111 11v38z" fill="currentColor" opacity=".72" />
			<path d="M18 30C31 8 66 7 86 30 66 53 31 52 18 30Z" fill="currentColor" />
			<path d="m48 13 12-11 12 14M52 43l12 12 11-15" fill="#fff" opacity=".42" />
			<circle cx="34" cy="26" r="4" fill="#fff" />
			<circle cx="35" cy="26" r="2" fill="#28515b" />
		</svg>
	);
}

function Jellyfish({ offset }) {
	return (
		<svg className="sea-life-jellyfish" style={{ "--x": offset }} viewBox="0 0 100 120">
			<path d="M24 56C15 70 31 79 22 92S29 106 23 116M39 59C33 74 47 83 39 98S44 108 40 118M60 59C68 73 54 85 63 99S58 110 64 118M76 56C87 70 70 80 80 94S73 108 78 116" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".8" />
			<path d="M11 55C11 31 28 12 50 12S89 31 89 55Q50 66 11 55Z" fill="currentColor" stroke="rgba(255,255,255,.8)" strokeWidth="2" />
			<ellipse cx="50" cy="55" rx="39" ry="8" fill="rgba(255,255,255,.28)" />
			<path d="M30 39C34 25 43 20 51 19" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="4" strokeLinecap="round" />
			<circle cx="42" cy="48" r="3" fill="rgba(255,255,255,.5)" />
			<circle cx="58" cy="48" r="3" fill="rgba(255,255,255,.5)" />
		</svg>
	);
}

export default function SeaLifeEffects({ variant = "prueba" }) {
	const fishOffsets = FISH_OFFSETS[variant] ?? FISH_OFFSETS.prueba;
	const jellyfishOffsets = JELLYFISH_OFFSETS[variant] ?? JELLYFISH_OFFSETS.prueba;

	return (
		<>
			<div className="sea-life-fish-school" aria-hidden="true">
				{FISH_DIRECTIONS.map((direction, index) => (
					<Fish direction={direction} offset={fishOffsets[index]} key={index} />
				))}
			</div>
			<div className="sea-life-jellyfish-school" aria-hidden="true">
				{jellyfishOffsets.map((offset, index) => <Jellyfish offset={offset} key={index} />)}
			</div>
			<div className="sea-life-bubbles" aria-hidden="true">
				{Array.from({ length: 18 }, (_, index) => <span className="sea-life-bubble" key={index} />)}
			</div>
		</>
	);
}