import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { readMenuOption } from "../lib/storage";
import "./actividad.css";
import "./Flores.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const L_SYLLABLES = ["LA", "LE", "LI", "LO", "LU"];
const M_SYLLABLES = ["MA", "ME", "MI", "MO", "MU"];
const FLOWER_IMAGES = [img("FLOR.svg"), img("FLOR1.svg")];
const TOTAL_ACTIVITIES = 5;

function stopAudio(audio) {
	if (!audio) {
		return;
	}
	audio.pause();
	audio.currentTime = 0;
	audio.onended = null;
}

export default function Flores() {
	usePageTitle("Flores - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [isLetterMode] = useState(() => readMenuOption() === "l");
	const [round, setRound] = useState({ generation: 0, activityIndex: 0, target: "", flowers: [] });
	const [celebrating, setCelebrating] = useState(false);
	const [instructionAudio] = useState(() => runtime.audio(sound("Pulsa silaba.m4a")));
	const [celebrationAudio] = useState(() => runtime.audio(sound("Fabuloso.m4a")));
	const audioRef = useRef({ option: null, feedback: null });
	const game = useRef({ activityIndex: 0, instructionOrder: [], transitionPending: false, celebrationActive: false });
	const roundRef = useRef(round);
	roundRef.current = round;

	if (game.current.instructionOrder.length === 0) {
		game.current.instructionOrder = shuffle(isLetterMode ? L_SYLLABLES : VOWELS);
	}

	function audioPath(label) {
		return sound(isLetterMode ? `${label.toLowerCase()}.wav` : `${label}.wav`);
	}

	function playInstruction(targetValue) {
		const audios = audioRef.current;
		stopAudio(instructionAudio);
		stopAudio(audios.option);
		const optionAudio = runtime.audio(audioPath(targetValue));
		audios.option = optionAudio;
		instructionAudio.onended = () => optionAudio.play().catch(() => {});
		instructionAudio.play().catch(() => {});
	}

	function playLabelAudio(label, onEnded) {
		const audios = audioRef.current;
		stopAudio(instructionAudio);
		stopAudio(audios.option);
		stopAudio(audios.feedback);
		const audio = runtime.audio(audioPath(label));
		audio.onended = onEnded;
		audio.play().catch(() => onEnded?.());
	}

	function buildFlowers(activityIndex = game.current.activityIndex) {
		const target = game.current.instructionOrder[activityIndex];
		const incorrect = isLetterMode
			? [shuffle(L_SYLLABLES.filter((item) => item !== target))[0], ...shuffle(M_SYLLABLES).slice(0, 2)]
			: shuffle(VOWELS.filter((item) => item !== target)).slice(0, 3);
		const labels = shuffle([target, ...incorrect]);
		setRound((current) => ({
			generation: current.generation + 1,
			activityIndex,
			target,
			flowers: labels.map((label, index) => ({
				label,
				image: FLOWER_IMAGES[index % FLOWER_IMAGES.length],
				correct: label === target,
				result: null
			}))
		}));
		playInstruction(target);
	}

	function finishCelebration() {
		stopTalking();
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
		celebrationAudio.onended = null;
		setCelebrating(false);
		game.current.celebrationActive = false;
	}

	function startCelebration() {
		if (game.current.celebrationActive) {
			return;
		}
		game.current.celebrationActive = true;
		stopAudio(instructionAudio);
		stopAudio(audioRef.current.option);
		startTalking();
		setCelebrating(true);
		celebrationAudio.onended = finishCelebration;
		celebrationAudio.currentTime = 0;
		celebrationAudio.play().catch(finishCelebration);
	}

	function restart() {
		finishCelebration();
		game.current.activityIndex = 0;
		game.current.instructionOrder = shuffle(isLetterMode ? L_SYLLABLES : VOWELS);
		game.current.transitionPending = false;
		buildFlowers(0);
	}

	function handleFlowerClick(index) {
		const currentRound = roundRef.current;
		const flower = currentRound.flowers[index];
		if (!flower || flower.result || game.current.transitionPending || game.current.celebrationActive) {
			return;
		}
		playLabelAudio(flower.label, () => {
			const audios = audioRef.current;
			stopAudio(audios.feedback);
			audios.feedback = runtime.audio(sound(flower.correct ? "correcto.mp3" : "error.mp3"));
			audios.feedback.play().catch(() => {});
		});
		setRound((current) => ({
			...current,
			flowers: current.flowers.map((item, itemIndex) =>
				itemIndex === index ? { ...item, result: item.correct ? "correct" : "wrong" } : item
			)
		}));

		if (flower.correct) {
			game.current.transitionPending = true;
			const completedIndex = currentRound.activityIndex;
			runtime.setTimeout(() => {
				if (roundRef.current.activityIndex !== completedIndex) {
					return;
				}
				if (completedIndex + 1 >= TOTAL_ACTIVITIES) {
					startCelebration();
					return;
				}
				game.current.activityIndex = completedIndex + 1;
				game.current.transitionPending = false;
				buildFlowers();
			}, 1400);
		}
	}

	useEffect(() => {
		buildFlowers();
	}, []);

	return (
		<div className="page activity-page page-flores">
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls" aria-label="Controles de actividad">
					<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restart}>
					&#x21bb; Reiniciar
				</button>
			</div>
			<main className="flower-activity">
				<section className="flower-heading">
					<h1>Flores</h1>
					<p className="round-counter">Actividad {round.activityIndex + 1} de {TOTAL_ACTIVITIES}</p>
					<p>
						Pulsa <span className="target-token">{round.target}</span>
					</p>
				</section>
				<section className="flower-field" aria-label="Flores">
					{round.flowers.map((flower, index) => (
						<button
							key={`${round.generation}-${index}`}
							type="button"
							className={flower.result ? `flower-button ${flower.result}` : "flower-button"}
							onClick={() => handleFlowerClick(index)}
						>
							<img className="flower-stem" src={img("tallo.svg")} alt="" aria-hidden="true" />
							<img className="flower-image" src={flower.image} alt={`Flor con ${flower.label}`} />
							<span className="flower-label">{flower.label}</span>
						</button>
					))}
				</section>
			</main>
			<Character character={character} mouth={mouth} celebrating={celebrating} />
		</div>
	);
}
