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

const ACTIVITIES = [
	{
		letter: "A",
		options: [
			{ name: "abeja", label: "Abeja", byn: "abejabyn.png", color: "abejacolor.png", correct: true },
			{ name: "escoba-a", label: "Escoba", byn: "escobabyn.jpg", color: "escobacolor.jpg", correct: false },
			{ name: "arbol", label: "Arbol", byn: "arbolbyn.jpg", color: "arbolcolor.jpg", correct: true },
			{ name: "auto", label: "Auto", byn: "autobyn.jpg", color: "autocolor.jpg", correct: true },
			{ name: "elefante-a", label: "Elefante", byn: "elefantebyn.jpg", color: "elefantecolor.jpg", correct: false },
			{ name: "avion", label: "Avion", byn: "avionbyn.jpg", color: "avioncolor.jpg", correct: true },
			{ name: "sol", label: "Sol", byn: "solbyn.jpg", color: "solcolor.jpg", correct: false },
			{ name: "anillo", label: "Anillo", byn: "anillobyn.jpg", color: "anillocolor.jpg", correct: true }
		]
	},
	{
		letter: "E",
		options: [
			{ name: "escalera", label: "Escalera", byn: "escalerabyn.jpg", color: "escaleracolor.jpg", correct: true },
			{ name: "auto-e", label: "Auto", byn: "autobyn.jpg", color: "autocolor.jpg", correct: false },
			{ name: "elefante", label: "Elefante", byn: "elefantebyn.jpg", color: "elefantecolor.jpg", correct: true },
			{ name: "escoba", label: "Escoba", byn: "escobabyn.jpg", color: "escobacolor.jpg", correct: true },
			{ name: "abeja-e", label: "Abeja", byn: "abejabyn.png", color: "abejacolor.png", correct: false },
			{ name: "espejo", label: "Espejo", byn: "espejobyn.jpg", color: "espejocolor.jpg", correct: true },
			{ name: "perro-e", label: "Perro", byn: "perrobyn.jpg", color: "perrocolor.jpg", correct: false },
			{ name: "estrella", label: "Estrella", byn: "estrellabyn.jpg", color: "estrellacolor.jpg", correct: true }
		]
	},
	{
		letter: "I",
		options: [
			{ name: "indio", label: "Indio", byn: "indiobyn.jpg", color: "indiocolor.jpg", correct: true },
			{ name: "abeja-i", label: "Abeja", byn: "abejabyn.png", color: "abejacolor.png", correct: false },
			{ name: "iguana", label: "Iguana", byn: "iguanabyn.jpg", color: "iguanacolor.jpg", correct: true },
			{ name: "iglú", label: "Iglu", byn: "iglubyn.jpg", color: "iglucolor.jpg", correct: true },
			{ name: "escoba-i", label: "Escoba", byn: "escobabyn.jpg", color: "escobacolor.jpg", correct: false },
			{ name: "isla", label: "Isla", byn: "islabyn.jpg", color: "islacolor.jpg", correct: true },
			{ name: "auto-i", label: "Auto", byn: "autobyn.jpg", color: "autocolor.jpg", correct: false },
			{ name: "iman", label: "Iman", byn: "imanbyn.jpg", color: "imancolor.jpg", correct: true }
		]
	}
];

function shuffleOptions(options, previousOptions = []) {
	let shuffledOptions = shuffle(options);
	let attempts = 0;
	while (
		previousOptions.length > 0 &&
		attempts < 20 &&
		options.filter((option) => option.correct).some((option) => {
			const previousIndex = previousOptions.findIndex((item) => item.name === option.name);
			const nextIndex = shuffledOptions.findIndex((item) => item.name === option.name);
			return previousIndex === nextIndex;
		})
	) {
		shuffledOptions = shuffle(options);
		attempts += 1;
	}
	return shuffledOptions;
}

export default function Iniciales() {
	usePageTitle("Iniciales - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const [activityIndex, setActivityIndex] = useState(0);
	const [options, setOptions] = useState(() => shuffleOptions(ACTIVITIES[0].options));
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
						setOptions((currentOptions) => shuffleOptions(ACTIVITIES[activityIndex + 1].options, currentOptions));
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
		<div className="page activity-page page-iniciales">
			<BackButton />
			<FullscreenButton toggle />
			<main className="initials-activity">
				<header className="initials-heading">
					<h1>Iniciales</h1>
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