import { useCallback, useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import RioChocolate from "../components/RioChocolate";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import { GROUPS } from "../lib/palabras";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./Barcos.css";

const COOKIE_IMAGE = img("cookie1.png");
const TRAY_IMAGE = img("bandeja.png");

const BOAT_POSITIONS = [
	{ left: 36, top: 62 },
	{ left: 57, top: 62 },
	{ left: 79, top: 62 }
];

function getAvailableSyllables(letter) {
	const safeLetter = Object.hasOwn(GROUPS, letter) ? letter : "l";
	const group = GROUPS[safeLetter];
	return group.syllables.filter((syllable) =>
		group.items.some((word) => word.startsWith(syllable))
	);
}

function pickWordGroup(letter, prompt) {
	const safeLetter = Object.hasOwn(GROUPS, letter) ? letter : "l";
	const group = GROUPS[safeLetter];
	const correctWords = group.items.filter((word) => word.startsWith(prompt));
	const target = correctWords[Math.floor(Math.random() * correctWords.length)];
	const incorrect = shuffle(group.items.filter((word) => !word.startsWith(prompt))).slice(0, 2);
	const boats = shuffle([target, ...incorrect]).map((word, index) => ({
		id: `${word}-${index}`,
		word,
		correct: word === target,
		position: BOAT_POSITIONS[index],
		cookieImage: COOKIE_IMAGE
	}));
	return { target, boats, prompt, letter: safeLetter };
}

function createActivity(letter) {
	const prompts = shuffle(getAvailableSyllables(letter));
	return {
		prompts,
		index: 0,
		round: pickWordGroup(letter, prompts[0])
	};
}

function getPromptAudioName(prompt, letter) {
	if (letter === "s" || (letter === "t" && prompt !== "TE")) {
		return `${prompt}.mp3`;
	}
	return `${prompt.toLowerCase()}.mp3`;
}

export default function Barcos() {
	usePageTitle("Barcos");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const letter = Object.hasOwn(GROUPS, menuOption) ? menuOption : "l";
	const [activity, setActivity] = useState(() => createActivity(letter));
	const { round } = activity;
	const [selectedBoat, setSelectedBoat] = useState(null);
	const [incorrectBoats, setIncorrectBoats] = useState([]);
	const [sinkingBoats, setSinkingBoats] = useState([]);
	const [celebrating, setCelebrating] = useState(false);
	const [successReady, setSuccessReady] = useState(false);
	const [boatFrame, setBoatFrame] = useState(0);
	const boats = round.boats;
	const game = useRef({ promptSequence: 0, feedbackSequence: 0 });
	const promptAudioRef = useRef(null);
	const feedbackTimerRef = useRef(null);

	useEffect(() => {
		setActivity(createActivity(letter));
		setSelectedBoat(null);
		setIncorrectBoats([]);
		setCelebrating(false);
	}, [letter]);

	useEffect(() => {
		setBoatFrame(0);
		setSinkingBoats([]);
		setSuccessReady(false);
		let activa = true;
		let timer = null;
		runtime.requestAnimationFrame(() => {
			if (!activa) return;
			setBoatFrame(1);
			timer = runtime.setTimeout(() => {
				if (activa) setBoatFrame(2);
			}, 760);
		});
		return () => {
			activa = false;
			game.current.feedbackSequence += 1;
			if (timer !== null) runtime.clearTimeout(timer);
			if (feedbackTimerRef.current !== null) {
				runtime.clearTimeout(feedbackTimerRef.current);
				feedbackTimerRef.current = null;
			}
		};
	}, [round, runtime]);

	const playPromptAudio = useCallback((promptRound) => {
		const previousAudio = promptAudioRef.current;
		if (previousAudio) {
			previousAudio.onended = null;
			previousAudio.pause();
			previousAudio.currentTime = 0;
		}
		const sequenceId = game.current.promptSequence + 1;
		game.current.promptSequence = sequenceId;
		const audioNames = [
			getPromptAudioName(promptRound.prompt, promptRound.letter),
			"pulsapalabra.mp3",
			getPromptAudioName(promptRound.prompt, promptRound.letter)
		];
		startTalking();
		function playStep(index) {
			if (game.current.promptSequence !== sequenceId) return;
			if (index >= audioNames.length) {
				promptAudioRef.current = null;
				stopTalking();
				return;
			}
			const audio = runtime.audio(sound(audioNames[index]), { preload: true });
			promptAudioRef.current = audio;
			audio.onended = () => {
				if (game.current.promptSequence !== sequenceId || promptAudioRef.current !== audio) return;
				playStep(index + 1);
			};
			audio.play().catch((error) => {
				if (promptAudioRef.current !== audio) return;
				promptAudioRef.current = null;
				game.current.promptSequence += 1;
				stopTalking();
				console.error(`No se pudo reproducir el audio ${audioNames[index]}.`, error);
			});
		}
		playStep(0);
		return sequenceId;
	}, [runtime, startTalking, stopTalking]);

	const stopPromptAudio = useCallback((sequenceId) => {
		if (game.current.promptSequence !== sequenceId) return;
		game.current.promptSequence += 1;
		const audio = promptAudioRef.current;
		promptAudioRef.current = null;
		if (audio) {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		}
		stopTalking();
	}, [stopTalking]);

	useEffect(() => {
		const sequenceId = playPromptAudio(round);
		return () => stopPromptAudio(sequenceId);
	}, [playPromptAudio, round, stopPromptAudio]);

	function handleBoatClick(boat) {
		if (selectedBoat || celebrating || incorrectBoats.includes(boat.id)) return;
		const feedbackSequence = game.current.feedbackSequence + 1;
		game.current.feedbackSequence = feedbackSequence;
		const feedbackVigente = () => game.current.feedbackSequence === feedbackSequence;
		stopPromptAudio(game.current.promptSequence);
		setSelectedBoat(boat);
		if (boat.correct) {
			setCelebrating(true);
			const boatsToSink = boats.filter((option) => !option.correct).map((option) => option.id);
			setSuccessReady(true);
			setSinkingBoats(boatsToSink);
			feedbackTimerRef.current = runtime.setTimeout(() => {
				if (!feedbackVigente()) return;
				setIncorrectBoats(boatsToSink);
				setSinkingBoats([]);
			}, 520);
			const successAudio = runtime.audio(sound("correcto.mp3"), { preload: true });
			const advanceToNextPrompt = () => {
				if (!feedbackVigente()) return;
				successAudio.onended = null;
				setSelectedBoat(null);
				setCelebrating(false);
				setIncorrectBoats([]);
				setActivity((current) => {
					let prompts = current.prompts;
					let index = current.index + 1;
					if (index >= prompts.length) {
						prompts = shuffle(getAvailableSyllables(letter));
						index = 0;
					}
					return {
						prompts,
						index,
						round: pickWordGroup(letter, prompts[index])
					};
				});
			};
			successAudio.onended = advanceToNextPrompt;
			successAudio.play().catch((error) => {
				if (!feedbackVigente()) return;
				setSelectedBoat(null);
				setCelebrating(false);
				setSuccessReady(false);
				setSinkingBoats([]);
				if (feedbackTimerRef.current !== null) {
					runtime.clearTimeout(feedbackTimerRef.current);
					feedbackTimerRef.current = null;
				}
				console.error("No se pudo reproducir el audio de respuesta correcta.", error);
			});
			return;
		}
		const splashAudio = runtime.audio("/assets/sonido/splash.mp3", { preload: true });
		splashAudio.play().catch((error) => {
			if (feedbackVigente()) {
				console.error("No se pudo reproducir el sonido splash.", error);
			}
		});
		setSinkingBoats([boat.id]);
		feedbackTimerRef.current = runtime.setTimeout(() => {
			if (!feedbackVigente()) return;
			feedbackTimerRef.current = null;
			setIncorrectBoats((current) => [...current, boat.id]);
			setSinkingBoats([]);
			setSelectedBoat(null);
		}, 520);
	}

	function restartRound() {
		game.current.feedbackSequence += 1;
		if (feedbackTimerRef.current !== null) {
			runtime.clearTimeout(feedbackTimerRef.current);
			feedbackTimerRef.current = null;
		}
		setSelectedBoat(null);
		setIncorrectBoats([]);
		setSinkingBoats([]);
		setCelebrating(false);
		setSuccessReady(false);
		setActivity(createActivity(letter));
	}

	return (
		<div className="page activity-page barcos-page">
			<RioChocolate runtime={runtime} />
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restartRound}>
					&#x21bb; Reiniciar
				</button>
			</div>
			{character && (
				<div className="barcos-character-wrap">
					<Character
						character={character}
						mouth={mouth}
						label="Escuchar la consigna otra vez"
						onClick={() => playPromptAudio(round)}
					/>
				</div>
			)}
			<main className="barcos-scene" aria-label="Actividad de barcos">
				<div className="barcos-tray">
					<img className="barcos-tray-image" src={TRAY_IMAGE} alt="" draggable={false} />
					<span className="barcos-tray-label" aria-live="polite">
						{round.prompt}
					</span>
				</div>
				{boats.map((boat) => {
					const isSelected = selectedBoat?.id === boat.id;
					return (
						<button
							key={boat.id}
							type="button"
							className={`boat-button ${boat.correct ? "boat-correct" : "boat-incorrect"}${incorrectBoats.includes(boat.id) ? " boat-eliminated" : ""}${sinkingBoats.includes(boat.id) ? " boat-sinking" : ""}${isSelected ? " selected" : ""}${boat.correct && successReady ? " boat-success-ready" : ""}${boatFrame >= 1 ? " boat-entered" : ""}${boatFrame === 2 || (celebrating && successReady) ? " boat-floating" : ""}${boatFrame === 2 ? " boat-ready" : ""}`}
							disabled={boatFrame < 2 || (selectedBoat && !isSelected) || incorrectBoats.includes(boat.id)}
							style={{
								left: `${boat.correct && successReady ? 50 : boat.position.left}%`,
								top: `${boat.correct && successReady ? 50 : boat.position.top}%`
							}}
							onClick={() => handleBoatClick(boat)}
							aria-label={`Elegir barco ${boat.word}`}
						>
							<span className="boat-content">
								<span className="boat-float">
									<img className="cookie-image" src={boat.cookieImage} alt="" draggable={false} />
									<span className="boat-word">{boat.word}</span>
								</span>
							</span>
						</button>
					);
				})}
			</main>
		</div>
	);
}
