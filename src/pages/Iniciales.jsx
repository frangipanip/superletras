import { useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import "./Iniciales.css";

const OPTIONS_BY_LETTER = {
	A: {
		correct: [
			["abeja", "Abeja", "abejabyn.png", "abejacolor.png"],
			["arbol", "Arbol", "arbolbyn.jpg", "arbolcolor.jpg"],
			["auto", "Auto", "autobyn.jpg", "autocolor.jpg"],
			["avion", "Avion", "avionbyn.jpg", "avioncolor.jpg"],
			["anillo", "Anillo", "anillobyn.jpg", "anillocolor.jpg"]
		],
		incorrect: [
			["escoba", "Escoba", "escobabyn.jpg", "escobacolor.jpg"],
			["elefante", "Elefante", "elefantebyn.jpg", "elefantecolor.jpg"],
			["sol", "Sol", "solbyn.jpg", "solcolor.jpg"]
		]
	},
	E: {
		correct: [
			["escalera", "Escalera", "escalerabyn.jpg", "escaleracolor.jpg"],
			["elefante", "Elefante", "elefantebyn.jpg", "elefantecolor.jpg"],
			["escoba", "Escoba", "escobabyn.jpg", "escobacolor.jpg"],
			["espejo", "Espejo", "espejobyn.jpg", "espejocolor.jpg"],
			["estrella", "Estrella", "estrellabyn.jpg", "estrellacolor.jpg"]
		],
		incorrect: [
			["auto", "Auto", "autobyn.jpg", "autocolor.jpg"],
			["abeja", "Abeja", "abejabyn.png", "abejacolor.png"],
			["perro", "Perro", "perrobyn.jpg", "perrocolor.jpg"]
		]
	},
	I: {
		correct: [
			["indio", "Indio", "indiobyn.jpg", "indiocolor.jpg"],
			["iguana", "Iguana", "iguanabyn.jpg", "iguanacolor.jpg"],
			["iglu", "Iglu", "iglubyn.jpg", "iglucolor.jpg"],
			["isla", "Isla", "islabyn.jpg", "islacolor.jpg"],
			["iman", "Iman", "imanbyn.jpg", "imancolor.jpg"]
		],
		incorrect: [
			["abeja", "Abeja", "abejabyn.png", "abejacolor.png"],
			["escoba", "Escoba", "escobabyn.jpg", "escobacolor.jpg"],
			["auto", "Auto", "autobyn.jpg", "autocolor.jpg"]
		]
	},
	O: {
		correct: [
			["oso", "Oso", "osobyn.jpg", "osocolor.jpg"],
			["oveja", "Oveja", "ovejabyn.jpg", "ovejacolor.jpg"]
		],
		incorrect: [
			["abeja", "Abeja", "abejabyn.png", "abejacolor.png"],
			["escoba", "Escoba", "escobabyn.jpg", "escobacolor.jpg"]
		]
	},
	U: {
		correct: [
			["uva", "Uva", "uvabyn.jpg", "uvacolor.jpg"],
			["uno", "Uno", "unobyn.jpg", "unocolor.jpg"],
			["uña", "Uña", "uñabyn.jpg", "uñacolor.jpg"]
		],
		incorrect: [
			["abeja", "Abeja", "abejabyn.png", "abejacolor.png"],
			["escoba", "Escoba", "escobabyn.jpg", "escobacolor.jpg"]
		]
	}
};

const ROUND_LETTERS = ["A", "E", "I", "O", "U", "A", "E", "I", "O", "U"];

function toOption([name, label, byn, color], correct) {
	return { name, label, byn, color, correct };
}

function createOptions(letter) {
	const pool = OPTIONS_BY_LETTER[letter];
	const correct = pool.correct[Math.floor(Math.random() * pool.correct.length)];
	const incorrect = pool.incorrect[Math.floor(Math.random() * pool.incorrect.length)];
	return shuffle([toOption(correct, true), toOption(incorrect, false)]);
}

const ACTIVITIES = ROUND_LETTERS.map((letter) => ({ letter, options: createOptions(letter) }));

export default function Peluche() {
	usePageTitle("Peluche - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const [activityIndex, setActivityIndex] = useState(0);
	const [options, setOptions] = useState(() => ACTIVITIES[0].options);
	const [selected, setSelected] = useState(() => new Set());
	const [vibrating, setVibrating] = useState(() => new Set());
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3")));
	const activity = ACTIVITIES[activityIndex];

	function handleImageClick(option) {
		if (selected.has(option.name)) {
			return;
		}

		if (option.correct) {
			setSelected((current) => {
				const next = new Set(current).add(option.name);
				const correctCount = activity.options.filter((item) => item.correct).length;
				if (next.size === correctCount && activityIndex < ACTIVITIES.length - 1) {
					runtime.setTimeout(() => {
						setOptions(() => createOptions(ACTIVITIES[activityIndex + 1].letter));
						setActivityIndex((currentIndex) => currentIndex + 1);
						setSelected(new Set());
					}, 700);
				}
				return next;
			});
			return;
		}

		errorAudio.pause();
		errorAudio.currentTime = 0;
		errorAudio.play().catch(() => {});
		setVibrating((current) => new Set(current).add(option.name));
		runtime.setTimeout(() => {
			setVibrating((current) => {
				const next = new Set(current);
				next.delete(option.name);
				return next;
			});
		}, 350);
	}

	return (
		<div className="page activity-page page-peluche">
			<BackButton />
			<FullscreenButton toggle />
			<main className="initials-activity">
				<header className="initials-heading">
					<h1>Peluche</h1>
					<p>Pulsa todas las imágenes que comienzan con la letra {activity.letter}</p>
				</header>
				<section className="initials-grid" aria-label="Imágenes para elegir">
					{options.map((option) => {
						const classNames = ["initials-option"];
							if (selected.has(option.name)) {
								classNames.push("selected");
							}
							if (vibrating.has(option.name)) {
								classNames.push("vibrating");
							}
							return (
								<button
									key={option.name}
									type="button"
									className={classNames.join(" ")}
									onClick={() => handleImageClick(option)}
									aria-label={option.label}
								>
									<img src={img(selected.has(option.name) ? option.color : option.byn)} alt={option.label} />
								</button>
							);
						})}
				</section>
			</main>
			<Character character={character} />
		</div>
	);
}