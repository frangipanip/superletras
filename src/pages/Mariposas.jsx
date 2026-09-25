import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import "./actividad.css";
import "./Mariposas.css";

const BUTTERFLY_IMAGES = [img("MARIPOSA.svg"), img("MARIPOSA1.svg"), img("MARIPOSA2.svg")];
const VOWELS = ["A", "E", "I", "O", "U"];
const SYLLABLES = {
	l: ["LA", "LE", "LI", "LO", "LU"],
	m: ["MA", "ME", "MI", "MO", "MU"],
	s: ["SA", "SE", "SI", "SO", "SU"],
	t: ["TA", "TE", "TI", "TO", "TU"]
};
const TOTAL_BUTTERFLIES = 8;
const TOTAL_CORRECT = 5;
const TOTAL_INSTRUCTIONS = 3;
const POSITIONS = [
	[24, 18], [47, 20], [70, 18], [34, 48], [57, 45], [78, 47], [27, 76], [52, 75], [72, 74], [42, 62], [88, 62]
];

function getAudioFileName(label, type = "syllable") {
	if (type === "letter") {
		const letterMap = { a: "A.wav", e: "E.wav", i: "I.wav", o: "O.wav", u: "U.wav", l: "Ele.m4a", m: "Eme.m4a", s: "Ese.m4a", t: "Te.m4a" };
		return letterMap[label.toLowerCase()] || `${label}.wav`;
	}
	const upper = label.toUpperCase();
	if (["A", "E", "I", "O", "U"].includes(upper)) return `${upper}.wav`;
	if (upper.startsWith("S")) return `${upper}.m4a`;
	if (upper === "TE") return "TE2.m4a";
	if (upper.startsWith("T")) return `${upper}.m4a`;
	return `${label.toLowerCase()}.wav`;
}

function createInstructionOrder(mode) {
	return mode !== "a" ? Array(TOTAL_INSTRUCTIONS).fill(mode.toUpperCase()) : shuffle(VOWELS);
}

function createButterflies(mode, targetValue, generation) {
	const items = [];
	if (mode !== "a") {
		const targetSyllables = SYLLABLES[mode];
		for (let index = 0; index < TOTAL_CORRECT; index += 1) {
			items.push({ value: targetSyllables[index % targetSyllables.length], correct: true, image: BUTTERFLY_IMAGES[index % BUTTERFLY_IMAGES.length] });
		}
		const allOtherSyllables = Object.keys(SYLLABLES)
			.filter(k => k !== mode)
			.flatMap(k => SYLLABLES[k]);
		const incorrectSyllables = shuffle(allOtherSyllables);
		for (let index = TOTAL_CORRECT; index < TOTAL_BUTTERFLIES; index += 1) {
			items.push({ value: incorrectSyllables[index - TOTAL_CORRECT], correct: false, image: BUTTERFLY_IMAGES[index % BUTTERFLY_IMAGES.length] });
		}
	} else {
		for (let index = 0; index < TOTAL_CORRECT; index += 1) {
			items.push({ value: targetValue, correct: true, image: BUTTERFLY_IMAGES[index % BUTTERFLY_IMAGES.length] });
		}
		for (let index = TOTAL_CORRECT; index < TOTAL_BUTTERFLIES; index += 1) {
			const otherVowel = shuffle(VOWELS.filter((vowel) => vowel !== targetValue))[0];
			items.push({ value: otherVowel, correct: false, image: BUTTERFLY_IMAGES[index % BUTTERFLY_IMAGES.length] });
		}
	}

	return shuffle(items).map((item, index) => ({
		...item,
		id: `${generation}-${index}`,
		left: POSITIONS[index][0],
		top: POSITIONS[index][1],
		rotation: Math.random() * 18 - 9,
		flying: false,
		vibrating: false
	}));
}

export default function Mariposas() {
	usePageTitle("Mariposas - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const activityMenuOption = useActivityMenuOption();
	const [mode] = useState(() => (["l", "m", "s", "t"].includes(activityMenuOption) ? activityMenuOption : "a"));
	const [targetValue, setTargetValue] = useState("");
	const [butterflies, setButterflies] = useState([]);
	const [celebrating, setCelebrating] = useState(false);
	const [celebrationAudio] = useState(() => runtime.audio(sound("Fabuloso.m4a")));
	const [premio, otorgarPremio] = useRecompensa("mariposas", mode);
	const pageRef = useRef(null);
	const fieldRef = useRef(null);

	// Estado que leen los callbacks de audio/timers (siempre el valor actual).
	const game = useRef(null);
	if (!game.current) {
		const instructionOrder = createInstructionOrder(mode);
		game.current = {
			targetValue: instructionOrder[0],
			instructionOrder,
			instructionIndex: 0,
			instructionsCompleted: 0,
			correctClicked: 0,
			instructionSequenceId: 0,
			instructionAudios: [],
			roundTransitionPending: false,
			celebrationActive: false,
			activeButterflyAudio: null,
			feedbackAudio: null,
			generation: 0,
			// Mariposas equivocadas tocadas: definen cuántas comidas se ganan.
			errors: 0
		};
	}
	const state = game.current;

	function updateButterfly(id, changes) {
		setButterflies((current) => current.map((butterfly) => (butterfly.id === id ? { ...butterfly, ...changes } : butterfly)));
	}

	function updateButterflySize() {
		const isMobileLandscape = window.matchMedia("(max-width: 768px) and (orientation: landscape)").matches;
		const bounds = fieldRef.current.getBoundingClientRect();
		const maxByWidth = bounds.width / 4.8;
		const maxByHeight = bounds.height / 2.27;
		const preferred = Math.min(maxByWidth, maxByHeight, isMobileLandscape ? 108 : 225);
		const size = Math.max(isMobileLandscape ? 63 : 96, Math.min(preferred, isMobileLandscape ? 108 : 225));
		pageRef.current.style.setProperty("--butterfly-size", `${size}px`);
	}

	function startInstructionSet() {
		const previousOption = mode !== "a" ? mode.toUpperCase() : state.targetValue;
		state.instructionOrder = createInstructionOrder(mode);
		if (mode !== "a" && state.instructionOrder[0] === previousOption) {
			const replacementIndex = state.instructionOrder.findIndex((option) => option !== previousOption);
			[state.instructionOrder[0], state.instructionOrder[replacementIndex]] = [state.instructionOrder[replacementIndex], state.instructionOrder[0]];
		}
		state.instructionIndex = 0;
		state.instructionsCompleted = 0;
		state.targetValue = mode !== "a" ? mode.toUpperCase() : state.instructionOrder[0];
	}

	function stopInstructionAudio() {
		state.instructionSequenceId += 1;
		state.instructionAudios.forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
		state.instructionAudios = [];
		stopTalking();
	}

	function stopFeedbackSound() {
		if (state.feedbackAudio) {
			state.feedbackAudio.pause();
			state.feedbackAudio.currentTime = 0;
			state.feedbackAudio.onended = null;
			state.feedbackAudio = null;
		}
	}

	function playFeedbackSound(isCorrect) {
		if (state.instructionAudios.length > 0) {
			return;
		}
		stopFeedbackSound();
		state.feedbackAudio = runtime.audio(sound(isCorrect ? "aleteo.mp3" : "error.mp3"));
		state.feedbackAudio.play().catch(() => {});
	}

	function playButterflyLabelAudio(label, onEnded) {
		stopFeedbackSound();
		stopInstructionAudio();
		if (state.activeButterflyAudio) {
			state.activeButterflyAudio.onended = null;
			state.activeButterflyAudio.pause();
			state.activeButterflyAudio.currentTime = 0;
		}
		const audioFile = getAudioFileName(label, "syllable");
		state.activeButterflyAudio = runtime.audio(sound(audioFile));
		state.activeButterflyAudio.onended = onEnded;
		state.activeButterflyAudio.play().catch(() => onEnded?.());
	}

	function playInstructionAudio() {
		stopInstructionAudio();
		startTalking();
		const sequenceId = ++state.instructionSequenceId;
		const optionFile = sound(getAudioFileName(state.targetValue, mode === "a" ? "vowel" : "letter"));
		const sequence = [runtime.audio(optionFile), runtime.audio(sound("Pulsa.m4a")), runtime.audio(optionFile)];
		state.instructionAudios = sequence;
		let audioIndex = 0;

		function playNextAudio() {
			if (sequenceId !== state.instructionSequenceId) {
				return;
			}
			if (audioIndex >= sequence.length) {
				stopTalking();
				return;
			}
			const audio = sequence[audioIndex];
			audioIndex += 1;
			audio.currentTime = 0;
			audio.onended = () => {
				audio.onended = null;
				playNextAudio();
			};
			audio.play().catch(() => {
				audio.onended = null;
				stopTalking();
			});
		}

		playNextAudio();
	}

	function repeatInstruction() {
		if (!state.celebrationActive && !state.roundTransitionPending && state.instructionsCompleted < TOTAL_INSTRUCTIONS) {
			playInstructionAudio();
		}
	}

	function finishCelebration() {
		stopTalking();
		stopFeedbackSound();
		if (state.activeButterflyAudio) {
			state.activeButterflyAudio.pause();
			state.activeButterflyAudio.currentTime = 0;
		}
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
		celebrationAudio.onended = null;
		setCelebrating(false);
		state.celebrationActive = false;
	}

	function startCelebration() {
		if (state.celebrationActive) {
			return;
		}
		state.celebrationActive = true;
		otorgarPremio(state.errors);
		stopInstructionAudio();
		runtime.requestAnimationFrame(() => {
			if (!state.celebrationActive) {
				return;
			}
			setCelebrating(true);
			startTalking();
			celebrationAudio.onended = finishCelebration;
			celebrationAudio.currentTime = 0;
			celebrationAudio.play().catch(finishCelebration);
		});
	}

	function buildButterflies() {
		state.correctClicked = 0;
		state.generation += 1;
		setTargetValue(state.targetValue);
		setButterflies(createButterflies(mode, state.targetValue, state.generation));
		playInstructionAudio();
	}

	function handleButterflyClick(event, butterfly) {
		const button = event.currentTarget;
		playButterflyLabelAudio(butterfly.value, () => playFeedbackSound(butterfly.correct));

		if (!butterfly.correct) {
			state.errors += 1;
			updateButterfly(butterfly.id, { vibrating: true });
			button.animate([
				{ transform: "translate(-50%, -50%) translateX(0)" },
				{ transform: "translate(-50%, -50%) translateX(-8px)" },
				{ transform: "translate(-50%, -50%) translateX(8px)" },
				{ transform: "translate(-50%, -50%) translateX(0)" }
			], { duration: 300, iterations: 1 });
			runtime.setTimeout(() => updateButterfly(butterfly.id, { vibrating: false }), 300);
			return;
		}

		state.correctClicked += 1;
		button.disabled = true;
		updateButterfly(butterfly.id, { flying: true });
		button.animate([
			{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
			{ transform: "translate(-50%, -50%) scale(0.7)", opacity: 0.7 },
			{ transform: "translate(-34vw, -60vh) scale(0.2)", opacity: 0 }
		], { duration: 780, iterations: 1, easing: "ease-out" });
		runtime.setTimeout(() => {
			setButterflies((current) => current.filter((item) => item.id !== butterfly.id));
			if (state.correctClicked >= TOTAL_CORRECT) {
				finishRound();
			}
		}, 860);
	}

	function finishRound() {
		if (state.roundTransitionPending) {
			return;
		}
		state.roundTransitionPending = true;
		state.instructionsCompleted += 1;
		stopInstructionAudio();

		fieldRef.current.querySelectorAll(".butterfly-button:not(.correct)").forEach((button) => {
			button.animate([
				{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
				{ transform: "translate(-50%, -50%) scale(0.82)", opacity: 0.86 },
				{ transform: "translate(12vw, -12vh) scale(0.2)", opacity: 0 }
			], { duration: 620, iterations: 1, easing: "ease-out" });
		});
		runtime.setTimeout(() => setButterflies((current) => current.filter((item) => item.flying)), 640);

		const lastInstruction = state.instructionsCompleted >= TOTAL_INSTRUCTIONS;
		runtime.setTimeout(() => {
			if (state.instructionsCompleted >= TOTAL_INSTRUCTIONS) {
				state.roundTransitionPending = false;
				startCelebration();
				return;
			}
			state.instructionIndex += 1;
			state.targetValue = state.instructionOrder[state.instructionIndex];
			state.roundTransitionPending = false;
			buildButterflies();
		}, lastInstruction ? 1500 : 740);
	}

	function restart() {
		state.roundTransitionPending = false;
		state.errors = 0;
		finishCelebration();
		stopInstructionAudio();
		startInstructionSet();
		buildButterflies();
		updateButterflySize();
	}

	useEffect(() => {
		window.addEventListener("resize", updateButterflySize);
		window.addEventListener("orientationchange", updateButterflySize);
		updateButterflySize();
		buildButterflies();
		return () => {
			window.removeEventListener("resize", updateButterflySize);
			window.removeEventListener("orientationchange", updateButterflySize);
		};
	}, []);

	return (
		<div className="page activity-page page-mariposas" ref={pageRef}>
			<div className="butterfly-top-controls" aria-label="Navegación">
				<BackButton />
				<FullscreenButton toggle />
			</div>
			<div className="activity-controls" aria-label="Controles de actividad">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restart}>
					&#x21bb; Reiniciar
				</button>
			</div>
			<main className="butterfly-activity">
				<section className="butterfly-field" ref={fieldRef} aria-label="Mariposas">
					{butterflies.map((butterfly) => {
						const classNames = ["butterfly-button", mode !== "a" ? "l-butterfly" : "a-butterfly"];
						if (butterfly.flying) {
							classNames.push("flying", "correct");
						}
						if (butterfly.vibrating) {
							classNames.push("vibration");
						}
						return (
							<button
								key={butterfly.id}
								type="button"
								className={classNames.join(" ")}
								disabled={butterfly.flying}
								style={{
									left: `${butterfly.left}%`,
									top: `${butterfly.top}%`,
									transform: `translate(-50%, -50%) rotate(${butterfly.rotation}deg)`
								}}
								onClick={(event) => handleButterflyClick(event, butterfly)}
							>
								<img
									src={butterfly.image}
									alt={mode !== "a" ? `Mariposa con sílaba ${butterfly.value}` : `Mariposa con vocal ${butterfly.value}`}
								/>
								<span className="badge">{butterfly.value}</span>
							</button>
						);
					})}
				</section>
			</main>
			<Character character={character} mouth={mouth} celebrating={celebrating} onClick={repeatInstruction} />
			<PremioComida premio={premio} />
		</div>
	);
}
