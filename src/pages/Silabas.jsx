import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Character from "../components/Character";
import UserNav from "../components/UserNav";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import "./Silabas.css";

const VOWELS = ["A", "E", "I", "O", "U"];

const MOUTH_BY_VOWEL = {
	A: img("bocasuper1.png"),
	E: img("bocasuper1.png"),
	I: img("bocasuper2.png"),
	O: img("bocasuper.png"),
	U: img("bocasuper.png")
};

const SHIFTED_MOUTH_VOWELS = new Set(["A", "E", "I"]);

// La boca de cada vocal se muestra entre el 20% y el 40% del audio.
const VOWEL_MOUTH_START = 0.2;
const VOWEL_MOUTH_END = 0.4;

const ACTIVITIES = [
	{ label: "Actividad de iniciales", route: "/iniciales", image: "INICIALESbtn.png" },
	{ label: "Actividad de mariposas", route: "/mariposas", image: "MARIPOSAbtn.png" },
	{ label: "Actividad de globos", route: "/globos", image: "GLOBOSbtn.png" },
	{ label: "Actividad de tren", route: "/tren", image: "TRENbtn.png" },
	{ label: "Actividad de peluches", route: "/peluches", image: "PELUCHESbtn.png" },
	{ label: "Actividad de flores", route: "/flores", image: "FLORbtn.png", className: "flowers-button" }
];

const CONFETTI_COLORS = ["#f28c00", "#cfacd6", "#aad8bb", "#d0ab5b", "#f28c80", "#a0cce7"];

function createConfetti(generation) {
	return Array.from({ length: 70 }, (_, index) => ({
		key: `${generation}-${index}`,
		style: {
			left: `${Math.random() * 100}%`,
			"--confetti-color": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
			"--confetti-drift": `${Math.round(Math.random() * 160 - 80)}px`,
			"--confetti-duration": `${2.4 + Math.random() * 1.8}s`,
			animationDelay: `${Math.random() * 0.35}s`
		}
	}));
}

export default function Silabas() {
	usePageTitle("Silabas - Mundo 1");
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, patchMouth, clearMouthTimer, startTalking, stopTalking } = useTalkingMouth(runtime);

	const [displayedVowels, setDisplayedVowels] = useState(VOWELS);
	const [uppercaseVowels, setUppercaseVowels] = useState(true);
	const [shuffledVowels, setShuffledVowels] = useState(false);
	const [orangeVowels, setOrangeVowels] = useState(() => new Set());
	const [celebrating, setCelebrating] = useState(false);
	const [confetti, setConfetti] = useState([]);

	const [audios] = useState(() => ({
		syllables: runtime.audio(sound("SilabasA.m4a"), { preload: true }),
		pressure: runtime.audio(sound("Presion.m4a"), { preload: true }),
		congratulations: runtime.audio(sound("Felicitaciones.m4a"), { preload: true }),
		vowels: Object.fromEntries(VOWELS.map((vowel) => [vowel, runtime.audio(sound(`${vowel}.wav`), { preload: true })]))
	}));

	// Estado que leen los callbacks de audio/timers (siempre el valor actual).
	const game = useRef({
		displayedVowels: VOWELS,
		orangeVowels: new Set(),
		vowelSequenceActive: false,
		vowelSequenceIndex: 0,
		congratulationsActive: false,
		celebrationPending: false,
		celebrationTimer: 0,
		vowelMouthStartTimer: 0,
		vowelMouthEndTimer: 0,
		confettiGeneration: 0
	}).current;

	function updateDisplayedVowels(next) {
		game.displayedVowels = next;
		setDisplayedVowels(next);
	}

	function updateOrangeVowels(next) {
		game.orangeVowels = next;
		setOrangeVowels(next);
	}

	function resetAudio(audio) {
		audio.pause();
		audio.currentTime = 0;
	}

	function resetVowelAudios() {
		Object.values(audios.vowels).forEach((audio) => {
			resetAudio(audio);
			audio.onended = null;
			audio.ontimeupdate = null;
		});
	}

	function clearVowelMouthTimers() {
		runtime.clearTimeout(game.vowelMouthStartTimer);
		runtime.clearTimeout(game.vowelMouthEndTimer);
	}

	function playSyllablesAudio() {
		game.vowelSequenceActive = true;
		game.vowelSequenceIndex = 0;
		resetAudio(audios.pressure);
		clearVowelMouthTimers();
		resetVowelAudios();
		resetAudio(audios.syllables);
		startTalking();
		audios.syllables.play().catch(() => {
			game.vowelSequenceActive = false;
			stopTalking();
		});
	}

	function playPressureAudio() {
		startTalking();
		audios.pressure.onended = stopTalking;
		audios.pressure.play().catch(stopTalking);
	}

	function stopAllAudio() {
		audios.syllables.pause();
		audios.pressure.pause();
		audios.congratulations.pause();
		Object.values(audios.vowels).forEach((audio) => audio.pause());
	}

	function finishCelebration(resetVowels = true) {
		runtime.clearTimeout(game.celebrationTimer);
		stopTalking();
		resetAudio(audios.congratulations);
		setCelebrating(false);
		game.congratulationsActive = false;
		if (resetVowels) {
			game.celebrationPending = false;
			updateOrangeVowels(new Set());
		}
		setConfetti([]);
	}

	function playCongratulationsAudio() {
		startTalking();
		audios.congratulations.onended = () => finishCelebration();
		audios.congratulations.play().catch(() => finishCelebration());
	}

	function startCelebration() {
		if (game.congratulationsActive) {
			return;
		}
		game.congratulationsActive = true;
		game.vowelSequenceActive = false;
		clearVowelMouthTimers();
		stopAllAudio();
		stopTalking();
		setCelebrating(true);
		game.confettiGeneration += 1;
		setConfetti(createConfetti(game.confettiGeneration));
		game.celebrationTimer = runtime.setTimeout(playCongratulationsAudio, 700);
	}

	function scheduleVowelMouth(audio, keepVisible = false) {
		clearVowelMouthTimers();
		const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 1;
		patchMouth({ visible: keepVisible });
		if (!keepVisible) {
			game.vowelMouthStartTimer = runtime.setTimeout(() => patchMouth({ visible: true }), duration * VOWEL_MOUTH_START * 1000);
		}
		game.vowelMouthEndTimer = runtime.setTimeout(() => patchMouth({ visible: false }), duration * VOWEL_MOUTH_END * 1000);
	}

	function playVowelAudio(vowel) {
		const audio = audios.vowels[vowel];
		finishCelebration(false);
		game.vowelSequenceActive = false;
		resetAudio(audios.pressure);
		clearVowelMouthTimers();
		resetAudio(audios.syllables);
		clearMouthTimer();
		patchMouth({ visible: vowel === "A", src: MOUTH_BY_VOWEL[vowel], shifted: SHIFTED_MOUTH_VOWELS.has(vowel) });
		resetVowelAudios();
		audio.onended = () => {
			clearVowelMouthTimers();
			patchMouth({ visible: false, shifted: false });
			if (game.celebrationPending) {
				game.celebrationPending = false;
				startCelebration();
			}
		};
		audio.play().then(() => scheduleVowelMouth(audio, vowel === "A")).catch(() => {
			clearVowelMouthTimers();
			game.celebrationPending = false;
			patchMouth({ visible: false, shifted: false });
		});
	}

	function playNextDisplayedVowel() {
		if (!game.vowelSequenceActive || game.vowelSequenceIndex >= game.displayedVowels.length) {
			if (game.vowelSequenceActive) {
				game.vowelSequenceActive = false;
				clearVowelMouthTimers();
				patchMouth({ visible: false, shifted: false });
				audios.pressure.currentTime = 0;
				playPressureAudio();
			}
			return;
		}

		const vowel = game.displayedVowels[game.vowelSequenceIndex];
		const audio = audios.vowels[vowel];
		game.vowelSequenceIndex += 1;
		clearVowelMouthTimers();
		patchMouth({ visible: false, src: MOUTH_BY_VOWEL[vowel], shifted: SHIFTED_MOUTH_VOWELS.has(vowel) });
		resetVowelAudios();
		audio.onended = () => {
			clearVowelMouthTimers();
			patchMouth({ visible: false });
			playNextDisplayedVowel();
		};
		audio.play().then(() => scheduleVowelMouth(audio)).catch(() => {
			clearVowelMouthTimers();
			audio.onended = null;
			patchMouth({ visible: false, shifted: false });
			game.vowelSequenceActive = false;
		});
	}

	function toggleCase() {
		finishCelebration();
		setUppercaseVowels((current) => !current);
	}

	function toggleShuffle() {
		finishCelebration();
		if (shuffledVowels) {
			updateDisplayedVowels(VOWELS);
			setShuffledVowels(false);
			return;
		}
		updateDisplayedVowels(shuffle(VOWELS));
		setShuffledVowels(true);
	}

	function handleVowelClick(vowel) {
		const next = new Set(game.orangeVowels);
		next.add(vowel);
		updateOrangeVowels(next);
		game.celebrationPending = next.size === VOWELS.length;
		playVowelAudio(vowel);
	}

	useEffect(() => {
		audios.syllables.onended = () => {
			stopTalking();
			playNextDisplayedVowel();
		};
	}, []);

	return (
		<div className="page page-silabas">
			<UserNav />

			<nav className="exercise-controls" aria-label="Controles de vocales">
				<button className="exercise-control" type="button" aria-label="Cambiar mayúsculas y minúsculas" aria-pressed={!uppercaseVowels} onClick={toggleCase}>
					{uppercaseVowels ? "A" : "a"}
				</button>
				<button className="exercise-control shuffle-control" type="button" aria-label="Mezclar vocales" aria-pressed={shuffledVowels} onClick={toggleShuffle}>
					&#x21bb;
				</button>
			</nav>

			<nav className="activity-buttons" aria-label="Actividades">
				{ACTIVITIES.map(({ label, route, image, className }) => (
					<button
						key={route}
						className={className ? `activity-button ${className}` : "activity-button"}
						type="button"
						aria-label={label}
						onClick={() => navigate(route)}
					>
						<img src={img(image)} alt="" />
					</button>
				))}
			</nav>

			<div className="confetti-layer" aria-hidden="true">
				{confetti.map(({ key, style }) => (
					<span key={key} className="confetti-piece" style={style} />
				))}
			</div>

			<Character
				character={character}
				mouth={mouth}
				celebrating={celebrating}
				label="Mostrar boca del personaje"
				onClick={playSyllablesAudio}
			/>

			<div className="vowel-list" aria-label="Vocales">
				{displayedVowels.map((vowel) => (
					<button
						key={vowel}
						className={orangeVowels.has(vowel) ? "orange-vowel" : ""}
						type="button"
						aria-label={`Reproducir vocal ${vowel}`}
						onClick={() => handleVowelClick(vowel)}
					>
						{uppercaseVowels ? vowel : vowel.toLowerCase()}
					</button>
				))}
			</div>
		</div>
	);
}
