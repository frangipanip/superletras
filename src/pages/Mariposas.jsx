import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO2_MOUTH_IMAGES, MUNDO3_MOUTH_IMAGES, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import "./actividad.css";
import "./Mariposas.css";

const BUTTERFLY_IMAGES = [img("MARIPOSA.svg"), img("MARIPOSA1.svg"), img("MARIPOSA2.svg")];
const OSITO_LAYOUT = [
	{ image: img("osito1.png"), position: [35, 29] },
	{ image: img("osito2.png"), position: [50, 29] },
	{ image: img("osito3.png"), position: [70, 29] },
	{ image: img("osito4.png"), position: [40, 57] },
	{ image: img("osito5.png"), position: [57, 57] },
	{ image: img("osito6.png"), position: [73, 57] },
	{ image: img("osito7.png"), position: [45, 84] },
	{ image: img("osito8.png"), position: [65, 84] }
];
const OSITO_IMAGES = OSITO_LAYOUT.map(({ image }) => image);
const OSITO_POSITIONS = OSITO_LAYOUT.map(({ position }) => position);
const VOWELS = ["A", "E", "I", "O", "U"];
const SYLLABLES = {
	l: ["LA", "LE", "LI", "LO", "LU"],
	m: ["MA", "ME", "MI", "MO", "MU"],
	s: ["SA", "SE", "SI", "SO", "SU"],
	t: ["TA", "TE", "TI", "TO", "TU"]
};
const MUNDO2_SYLLABLES = {
	p: ["PA", "PE", "PI", "PO", "PU"],
	n: ["NA", "NE", "NI", "NO", "NU"],
	d: ["DA", "DE", "DI", "DO", "DU"],
	f: ["FA", "FE", "FI", "FO", "FU"],
	h: ["HA", "HE", "HI", "HO", "HU"]
};
const MUNDO3_SYLLABLES = {
	r: ["RA", "RE", "RI", "RO", "RU"],
	rr: ["ARRA", "ARRE", "ARRO", "ARRI", "ARRU"],
	ar: ["ARA", "ARE", "ARI", "ARO", "ARU"],
	y: ["YA", "YE", "YI", "YO", "YU"],
	ll: ["LLA", "LLE", "LLI", "LLO", "LLU"]
};
const MUNDO3_INCORRECT_SYLLABLES = {
	r: ["NA", "NE", "NI", "NO", "NU"],
	rr: ["ALA", "ALE", "ALI", "ALO", "ALU"],
	ar: ["ANA", "ENE", "INI", "ONO", "UNU"],
	y: ["SA", "SE", "SI", "SO", "SU"],
	ll: ["SA", "SE", "SI", "SO", "SU"]
};
const MUNDO3_OPTION_SOUNDS = {
	r: "suenaR.mp3",
	rr: "suenaRR.mp3",
	ar: "suenaAR.mp3",
	y: "suenaY.mp3",
	ll: "suenaLL.mp3"
};
const MUNDO3_BLOCK_IMAGES = [
	img("bloqueRojoSonriente.png"),
	img("bloqueAmarilloSonriente.png"),
	img("bloqueAzulSonriente.png"),
	img("bloqueVioletaSonriente.png"),
	img("bloqueRosaSonriente.png")
];
const TOTAL_BUTTERFLIES = 8;
const TOTAL_CORRECT = 5;
const POSITIONS = [
	[24, 18],
	[47, 20],
	[70, 18],
	[34, 48],
	[57, 45],
	[78, 47],
	[27, 76],
	[52, 75]
];
const MUNDO3_POSITIONS = POSITIONS.map(([left, top]) => [22 + left * 0.75, top]);

function getAudioFileName(label, type = "syllable", isMundo2 = false, isMundo3 = false) {
	if (type === "letter") {
		const letterMap = {
			a: "a.mp3", e: "e.mp3", i: "i.mp3", o: "o.mp3", u: "u.mp3",
			l: "letraL.mp3", m: "letraM.mp3", s: "letraS.mp3", t: "letraT.mp3",
			p: "letraP.mp3", n: "letraN.mp3", d: "letraD.mp3",
			f: "letraF.mp3", h: "letraH.mp3"
		};
		return letterMap[label.toLowerCase()] || `${label}.wav`;
	}
	const upper = label.toUpperCase();
	if (isMundo2 || isMundo3) return `${upper.toLowerCase()}.mp3`;
	if (["A", "E", "I", "O", "U"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["LA", "LE", "LI", "LO", "LU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["MA", "ME", "MI", "MO", "MU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (upper.startsWith("S")) return `${upper}.mp3`;
	if (upper === "TE") return "te.mp3";
	if (upper.startsWith("T")) return `${upper}.mp3`;
	return `${label.toLowerCase()}.wav`;
}

function createInstructionOrder(mode, syllableModes, isMundo3) {
	if (isMundo3) return [mode.toUpperCase()];
	return mode !== "a" ? [mode.toUpperCase()] : shuffle(VOWELS);
}

function createButterflies(mode, targetValue, generation, syllableModes = SYLLABLES, creatureImages = BUTTERFLY_IMAGES, creaturePositions, isMundo3 = false) {
	const items = [];
	function addItem(value, correct, index) {
		items.push({
			value,
			correct,
			image: creatureImages[index % creatureImages.length],
			position: creaturePositions?.[index]
		});
	}

	if (isMundo3) {
		const correctSyllables = syllableModes[mode];
		const incorrectSyllables = shuffle(MUNDO3_INCORRECT_SYLLABLES[mode]).slice(0, TOTAL_BUTTERFLIES - TOTAL_CORRECT);
		shuffle([...correctSyllables, ...incorrectSyllables]).forEach((label, index) =>
			addItem(label, correctSyllables.includes(label), index)
		);
	} else if (mode !== "a") {
		const targetSyllables = syllableModes[mode];
		for (let index = 0; index < TOTAL_CORRECT; index += 1) {
			addItem(targetSyllables[index % targetSyllables.length], true, index);
		}
		const allOtherSyllables = Object.keys(syllableModes)
			.filter(k => k !== mode)
			.flatMap(k => syllableModes[k]);
		const incorrectSyllables = shuffle(allOtherSyllables);
		for (let index = TOTAL_CORRECT; index < TOTAL_BUTTERFLIES; index += 1) {
			addItem(incorrectSyllables[index - TOTAL_CORRECT], false, index);
		}
	} else {
		for (let index = 0; index < TOTAL_CORRECT; index += 1) {
			addItem(targetValue, true, index);
		}
		for (let index = TOTAL_CORRECT; index < TOTAL_BUTTERFLIES; index += 1) {
			const otherVowel = shuffle(VOWELS.filter((vowel) => vowel !== targetValue))[0];
			addItem(otherVowel, false, index);
		}
	}

	return shuffle(items).map((item, index) => {
		const [left, top] = item.position || POSITIONS[index];
		return {
			...item,
			generation,
			id: `${generation}-${index}`,
			left,
			top,
			rotation: Math.random() * 18 - 9,
			flying: false,
			vibrating: false
		};
	});
}

export default function Mariposas() {
	const location = useLocation();
	const isMundo2 = location.state?.world === 2;
	const isMundo3 = location.state?.world === 3;
	usePageTitle(isMundo3 ? "Mariposas - Mundo 3" : isMundo2 ? "Mariposas - Mundo 2" : "Mariposas - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const mouthImages = isMundo3 ? MUNDO3_MOUTH_IMAGES : isMundo2 ? MUNDO2_MOUTH_IMAGES : undefined;
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const activityMenuOption = useActivityMenuOption();
	const syllableModes = isMundo3 ? MUNDO3_SYLLABLES : isMundo2 ? MUNDO2_SYLLABLES : SYLLABLES;
	const creatureImages = isMundo3 ? MUNDO3_BLOCK_IMAGES : isMundo2 ? BUTTERFLY_IMAGES : OSITO_IMAGES;
	const [mode] = useState(() => (Object.hasOwn(syllableModes, activityMenuOption) ? activityMenuOption : isMundo3 ? "r" : isMundo2 ? "p" : "a"));
	const totalInstructions = mode === "a" ? VOWELS.length : 1;
	const [targetValue, setTargetValue] = useState("");
	const [butterflies, setButterflies] = useState([]);
	const [celebrating, setCelebrating] = useState(false);
	const [jarOpen, setJarOpen] = useState(false);
	const [celebrationAudio] = useState(() => runtime.audio(sound("Fabuloso.mp3")));
	const [correctFeedbackAudio] = useState(() => runtime.audio(sound(isMundo2 ? "aleteo.mp3" : "correcto.mp3"), { preload: true }));
	const [errorFeedbackAudio] = useState(() => runtime.audio(sound("error.mp3"), { preload: true }));
	const [premio, otorgarPremio] = useRecompensa("mariposas", mode);
	const pageRef = useRef(null);
	const fieldRef = useRef(null);
	const jarRef = useRef(null);
	const blockStackRef = useRef(null);
	const [stackedBlocks, setStackedBlocks] = useState([]);
	const stackedBlocksRef = useRef(0);
	const jarFlightsRef = useRef(0);
	const jarCloseTimerRef = useRef(0);

	// Estado que leen los callbacks de audio/timers (siempre el valor actual).
	const game = useRef(null);
	if (!game.current) {
		const instructionOrder = createInstructionOrder(mode, syllableModes, isMundo3);
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

	function closeJarAfterFlights() {
		if (jarFlightsRef.current > 0) return;
		jarCloseTimerRef.current = runtime.setTimeout(() => {
			if (jarFlightsRef.current === 0) setJarOpen(false);
		}, 260);
	}

	function updateButterflySize() {
		const isMobileLandscape = window.matchMedia("(max-width: 768px) and (orientation: landscape)").matches;
		const isSmallScreen = window.matchMedia("(max-width: 768px), (max-height: 560px)").matches;
		const bounds = fieldRef.current.getBoundingClientRect();
		const maxByWidth = bounds.width / (isMundo3 ? 5.6 : 4.8);
		const maxByHeight = bounds.height / 2.27;
		const preferred = Math.min(maxByWidth, maxByHeight, isMobileLandscape ? 108 : isMundo3 ? 175 : 225);
		const sizeScale = isMundo2 || isMundo3 ? 1 : isSmallScreen ? 0.70125 : 0.6375;
		const minimumSize = isMobileLandscape ? 95 : 126;
		const size = isMundo3
			? Math.max(48, Math.min(preferred, isMobileLandscape ? 108 : 175))
			: Math.max(isMobileLandscape ? 63 : 96, Math.min(preferred, isMobileLandscape ? 108 : 225)) * sizeScale;
		pageRef.current.style.setProperty("--butterfly-size", `${size}px`);
		pageRef.current.style.setProperty("--butterfly-min-size", `${minimumSize * sizeScale}px`);
	}

	function startInstructionSet() {
		const previousOption = mode !== "a" ? mode.toUpperCase() : state.targetValue;
		state.instructionOrder = createInstructionOrder(mode, syllableModes, isMundo3);
		if (!isMundo3 && mode !== "a" && state.instructionOrder.length > 1 && state.instructionOrder[0] === previousOption) {
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
		state.feedbackAudio = isCorrect ? correctFeedbackAudio : errorFeedbackAudio;
		state.feedbackAudio.currentTime = 0;
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
		const audioFile = getAudioFileName(label, "syllable", isMundo2, isMundo3);
		state.activeButterflyAudio = runtime.audio(sound(audioFile));
		state.activeButterflyAudio.onended = onEnded;
		state.activeButterflyAudio.play().catch(() => onEnded?.());
	}

	function playInstructionAudio() {
		stopInstructionAudio();
		startTalking();
		const sequenceId = ++state.instructionSequenceId;
		const optionFile = sound(isMundo3
			? MUNDO3_OPTION_SOUNDS[mode]
			: getAudioFileName(state.targetValue, mode === "a" ? "vowel" : "letter", isMundo2));
		const promptFile = isMundo3 ? "Pulsabloque.mp3" : isMundo2 ? "Pulsa.mp3" : "Pulsaosito.mp3";
		const sequence = [runtime.audio(optionFile), runtime.audio(sound(promptFile)), runtime.audio(optionFile)];
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
		if (!state.celebrationActive && !state.roundTransitionPending && state.instructionsCompleted < totalInstructions) {
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
		setButterflies(createButterflies(
			mode,
			state.targetValue,
			state.generation,
			syllableModes,
			creatureImages,
			isMundo3 ? MUNDO3_POSITIONS : isMundo2 ? undefined : OSITO_POSITIONS,
			isMundo3
		));
		playInstructionAudio();
	}

	function handleButterflyClick(event, butterfly) {
		const button = event.currentTarget;
		playButterflyLabelAudio(butterfly.value, () => playFeedbackSound(butterfly.correct));

		if (!butterfly.correct) {
			state.errors += 1;
			updateButterfly(butterfly.id, { vibrating: true, wrong: isMundo3 });
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
		const completesRound = state.correctClicked === TOTAL_CORRECT;
		const clickGeneration = state.generation;
		button.disabled = true;
		updateButterfly(butterfly.id, { flying: true });

		if (isMundo3) {
			const fieldBounds = fieldRef.current.getBoundingClientRect();
			const stackBounds = blockStackRef.current.getBoundingClientRect();
			const blockSize = Number.parseFloat(getComputedStyle(pageRef.current).getPropertyValue("--butterfly-size"));
			const targetLeft = ((stackBounds.left + stackBounds.width / 2 - fieldBounds.left) / fieldBounds.width) * 100;
			const stackIndex = stackedBlocksRef.current;
			stackedBlocksRef.current += 1;
			const stackStep = blockSize * 0.72;
			const targetTop = ((stackBounds.bottom - blockSize / 2 - stackIndex * stackStep - fieldBounds.top) / fieldBounds.height) * 100;
			const animation = button.animate([
				{
					left: `${butterfly.left}%`,
					top: `${butterfly.top}%`,
					transform: getComputedStyle(button).transform,
					opacity: 1
				},
				{
					left: `${targetLeft}%`,
					top: `${targetTop}%`,
					transform: "translate(-50%, -50%) scale(0.78)",
					opacity: 1
				}
			], { duration: 850, iterations: 1, easing: "cubic-bezier(0.22, 0.75, 0.32, 1)", fill: "forwards" });
			animation.onfinish = () => {
				if (state.generation !== clickGeneration) return;
				setStackedBlocks((current) => [...current, { image: butterfly.image, value: butterfly.value }]);
				setButterflies((current) => current.filter((item) => item.id !== butterfly.id));
				if (completesRound) finishRound();
			};
			return;
		}

		if (!isMundo2 && jarRef.current) {
			runtime.clearTimeout(jarCloseTimerRef.current);
			setJarOpen(true);
			jarFlightsRef.current += 1;
			const fieldBounds = fieldRef.current.getBoundingClientRect();
			const jarBounds = jarRef.current.getBoundingClientRect();
			const targetLeft = ((jarBounds.left + jarBounds.width * 0.47 - fieldBounds.left) / fieldBounds.width) * 100;
			const targetTop = ((jarBounds.top + jarBounds.height * 0.38 - fieldBounds.top) / fieldBounds.height) * 100;
			const animation = button.animate([
				{
					left: button.style.left,
					top: button.style.top,
					transform: getComputedStyle(button).transform,
					opacity: 1,
					offset: 0
				},
				{
					left: `${targetLeft}%`,
					top: `${targetTop}%`,
					transform: "translate(-50%, -50%) scale(0.2)",
					opacity: 0.85,
					offset: 0.78
				},
				{
					left: `${targetLeft}%`,
					top: `${targetTop}%`,
					transform: "translate(-50%, -50%) scale(0.02)",
					opacity: 0
				}
			], { duration: 1050, iterations: 1, easing: "ease-in", fill: "forwards" });
			let flightFinished = false;
			const finishOsitoFlight = () => {
				if (flightFinished) return;
				flightFinished = true;
				setButterflies((current) => current.filter((item) => item.id !== butterfly.id));
				jarFlightsRef.current = Math.max(0, jarFlightsRef.current - 1);
				closeJarAfterFlights();
				if (completesRound && state.generation === clickGeneration) finishRound();
			};
			animation.onfinish = finishOsitoFlight;
			runtime.setTimeout(finishOsitoFlight, 1150);
			return;
		}

		button.animate([
			{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
			{ transform: "translate(-50%, -50%) scale(0.7)", opacity: 0.7 },
			{ transform: "translate(-34vw, -60vh) scale(0.2)", opacity: 0 }
		], { duration: 780, iterations: 1, easing: "ease-out" });
		runtime.setTimeout(() => {
			setButterflies((current) => current.filter((item) => item.id !== butterfly.id));
			if (completesRound && state.generation === clickGeneration) finishRound();
		}, 860);
	}

	function finishRound() {
		if (state.roundTransitionPending) {
			return;
		}
		state.roundTransitionPending = true;
		state.instructionsCompleted += 1;
		const roundGeneration = state.generation;
		stopInstructionAudio();

		fieldRef.current.querySelectorAll(".butterfly-button:not(.correct)").forEach((button) => {
			button.animate([
				{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
				{ transform: "translate(-50%, -50%) scale(0.82)", opacity: 0.86 },
				{ transform: "translate(12vw, -12vh) scale(0.2)", opacity: 0 }
			], { duration: 620, iterations: 1, easing: "ease-out", fill: "forwards" });
		});
		runtime.setTimeout(() => {
			if (state.generation === roundGeneration) {
				setButterflies((current) => current.filter((item) => item.generation !== roundGeneration || item.flying));
			}
		}, 640);

		const lastInstruction = state.instructionsCompleted >= totalInstructions;
		runtime.setTimeout(() => {
			if (state.generation !== roundGeneration) {
				return;
			}
			if (state.instructionsCompleted >= totalInstructions) {
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
		runtime.clearTimeout(jarCloseTimerRef.current);
		jarFlightsRef.current = 0;
		setJarOpen(false);
		setStackedBlocks([]);
		stackedBlocksRef.current = 0;
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
	<div className={`page activity-page page-mariposas${isMundo2 ? " world-mundo2 world-insectos" : ""}${isMundo3 ? " world-mundo3" : ""}`} ref={pageRef}>
			<div className="butterfly-top-controls" aria-label="Navegación">
				<BackButton />
				<FullscreenButton toggle />
			</div>
			<div className="activity-controls" aria-label="Controles de actividad">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restart}>
					&#x21bb; Reiniciar
				</button>
			</div>
			{!isMundo2 && !isMundo3 && (
				<img
					ref={jarRef}
					className="osito-jar"
					src={img(jarOpen ? "frascoabierto.png" : "frascocerrado.png")}
					alt=""
					aria-hidden="true"
					draggable={false}
				/>
			)}
			<main className="butterfly-activity">
				<section className="butterfly-field" ref={fieldRef} aria-label={isMundo3 ? "Bloques" : "Mariposas"}>
					{butterflies.map((butterfly) => {
						const classNames = ["butterfly-button", mode !== "a" ? "l-butterfly" : "a-butterfly"];
						if (butterfly.flying) {
							classNames.push(isMundo3 ? "flying-to-stack" : isMundo2 ? "flying" : "flying-to-jar", "correct");
						}
						if (butterfly.vibrating) {
							classNames.push("vibration");
						}
						if (butterfly.wrong) classNames.push("wrong");
						return (
							<button
								key={butterfly.id}
								type="button"
								className={classNames.join(" ")}
								disabled={butterfly.flying}
								style={{
									left: `${butterfly.left}%`,
									top: `${butterfly.top}%`,
									transform: `translate(-50%, -50%) rotate(${butterfly.rotation}deg)`,
									"--block-rotation": `${butterfly.rotation}deg`,
									...(isMundo3 && {
										zIndex: butterfly.flying ? 5 : butterfly.top < 35 ? 1 : butterfly.top < 60 ? 2 : 3
									})
								}}
								onClick={(event) => handleButterflyClick(event, butterfly)}
							>
								<img
									src={butterfly.image}
									alt={isMundo3
										? `Bloque con sílaba ${butterfly.value}`
										: mode !== "a" ? `Mariposa con sílaba ${butterfly.value}` : `Mariposa con vocal ${butterfly.value}`}
								/>
								<span className="badge">{butterfly.value}</span>
							</button>
						);
					})}
				</section>
				{isMundo3 && (
					<div ref={blockStackRef} className="block-stack" aria-label="Bloques correctos apilados">
						<div className="block-stack__contents">
							{stackedBlocks.map((block, index) => (
								<div
									key={`${index}-${block.value}`}
									className="block-stack__item"
									style={{ "--stack-index": index }}
								>
									<img src={block.image} alt="" />
									<span>{block.value}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</main>
			<Character character={character} mouth={mouth} celebrating={celebrating} onClick={repeatInstruction} />
			<PremioComida premio={premio} />
		</div>
	);
}
