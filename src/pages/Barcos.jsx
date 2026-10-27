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
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./Barcos.css";

const GROUPS = {
	a: {
		title: "Vocal",
		items: ["AMA", "ALA", "ESO", "ELE", "ISO", "ISLA", "OSA", "OLA", "USA", "UAU", "OIA", "AIA"],
		syllables: ["A", "E", "I", "O", "U"]
	},
	l: {
		title: "L",
		items: ["LOLA", "LILA", "LULA", "LALO", "LEE", "LIO", "LELA", "LULI", "LOLE", "LALI"],
		syllables: ["LA", "LE", "LI", "LO", "LU"]
	},
	m: {
		title: "M",
		items: ["MAMI", "MALA", "MELO", "MEMO", "MIMO", "MILA", "MULA", "MUMI", "MOLA", "MOME", "MIEL"],
		syllables: ["MA", "ME", "MI", "MO", "MU"]
	},
	s: {
		title: "S",
		items: ["SALA", "SASO", "SESO", "SESI", "SILA", "SIMA", "SOLA", "SOSA", "SUMA", "SULI"],
		syllables: ["SA", "SE", "SI", "SO", "SU"]
	},
	t: {
		title: "T",
		items: ["TALA", "TATO", "TEMO", "TELE", "TIMO", "TITO", "TOSO", "TOMA", "TULA", "TUTE"],
		syllables: ["TA", "TE", "TI", "TO", "TU"]
	}
};

const BOAT_IMAGES = [
	[img("baco10.png"), img("baco11.png"), img("baco12.png")],
	[img("baco20.png"), img("baco21.png"), img("baco22.png")],
	[img("baco30.png"), img("baco31.png"), img("baco32.png")]
];

const BOAT_POSITIONS = [
	{ left: 34, top: 52 },
	{ left: 50, top: 63 },
	{ left: 65, top: 54 }
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
		frameGroup: index % BOAT_IMAGES.length
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
	const [celebrating, setCelebrating] = useState(false);
	const [boatFrame, setBoatFrame] = useState(0);
	const boats = round.boats;
	const game = useRef({ promptSequence: 0 });
	const promptAudioRef = useRef(null);

	useEffect(() => {
		setActivity(createActivity(letter));
		setSelectedBoat(null);
		setIncorrectBoats([]);
		setCelebrating(false);
	}, [letter]);

	useEffect(() => {
		setBoatFrame(0);
		let frame = 0;
		const timer = runtime.setInterval(() => {
			frame += 1;
			setBoatFrame(frame);
			if (frame >= 2) {
				runtime.clearInterval(timer);
			}
		}, 220);
		return () => runtime.clearInterval(timer);
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
		stopPromptAudio(game.current.promptSequence);
		setSelectedBoat(boat);
		if (boat.correct) {
			setCelebrating(true);
			const successAudio = runtime.audio(sound("correcto.mp3"), { preload: true });
			const advanceToNextPrompt = () => {
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
			successAudio.onended = () => {
				advanceToNextPrompt();
			};
			successAudio.play().catch((error) => {
				setSelectedBoat(null);
				setCelebrating(false);
				console.error("No se pudo reproducir el audio de respuesta correcta.", error);
			});
			return;
		}
		setIncorrectBoats((current) => [...current, boat.id]);
		const errorAudio = runtime.audio(sound("error.mp3"), { preload: true });
		errorAudio.onended = () => {
			errorAudio.onended = null;
			setSelectedBoat(null);
		};
		errorAudio.play().catch((error) => {
			setSelectedBoat(null);
			console.error("No se pudo reproducir el audio de error.", error);
		});
	}

	function restartRound() {
		setSelectedBoat(null);
		setIncorrectBoats([]);
		setCelebrating(false);
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
				{boats.map((boat) => {
					const isSelected = selectedBoat?.id === boat.id;
					const boatImage = BOAT_IMAGES[boat.frameGroup][Math.min(boatFrame, 2)];
					return (
						<button
							key={boat.id}
							type="button"
							className={`boat-button ${boat.correct ? "boat-correct" : "boat-incorrect"}${incorrectBoats.includes(boat.id) ? " boat-eliminated" : ""}${isSelected ? " selected" : ""}${boatFrame === 2 || celebrating ? " boat-floating" : ""}${boatFrame === 2 ? " boat-ready" : ""}`}
							disabled={boatFrame < 2 || (selectedBoat && !isSelected) || incorrectBoats.includes(boat.id)}
							style={{ left: `${boat.position.left}%`, top: `${boat.position.top}%` }}
							onClick={() => handleBoatClick(boat)}
							aria-label={`Elegir barco ${boat.word}`}
						>
							<span className="boat-content">
								<img className="boat-image" src={boatImage} alt={boat.word} draggable={false} />
								<span className="boat-word">{boat.word}</span>
							</span>
						</button>
					);
				})}
			</main>
		</div>
	);
}
