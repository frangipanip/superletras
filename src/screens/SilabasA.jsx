import { useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "../components/BackButton.jsx";
import { GuestProfile } from "../components/GuestProfile.jsx";
import { CHARACTER_KEY, CHARACTERS, readStorage } from "../lib/storage.js";
import "../styles/silabas-a.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const ACTIVITY_BUTTONS = [1, 2, 3, 4, 5, 6];

const MOUTH_IMAGES = [
	"/assets/imagenes/bocasuper.png",
	"/assets/imagenes/bocasuper1.png",
	"/assets/imagenes/bocasuper2.png"
];

const MOUTH_BY_VOWEL = {
	A: "/assets/imagenes/bocasuper1.png",
	E: "/assets/imagenes/bocasuper1.png",
	I: "/assets/imagenes/bocasuper2.png",
	O: "/assets/imagenes/bocasuper.png",
	U: "/assets/imagenes/bocasuper.png"
};

const SHIFTED_MOUTH_VOWELS = new Set(["A", "E", "I"]);
const MOUTH_FRAME_MS = 220;
// Para una vocal suelta la boca solo acompana el tramo central del audio.
const VOWEL_MOUTH_START = 0.2;
const VOWEL_MOUTH_END = 0.4;
const CELEBRATION_DELAY_MS = 700;
const CONFETTI_COUNT = 70;
const CONFETTI_COLORS = ["#f28c00", "#cfacd6", "#aad8bb", "#d0ab5b", "#f28c80", "#a0cce7"];

const HIDDEN_MOUTH = { visible: false, src: MOUTH_IMAGES[0], shifted: false };

function createConfetti() {
	return Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
		id: index,
		left: `${Math.random() * 100}%`,
		color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
		drift: `${Math.round(Math.random() * 160 - 80)}px`,
		duration: `${2.4 + Math.random() * 1.8}s`,
		delay: `${Math.random() * 0.35}s`
	}));
}

function shuffle(items) {
	const shuffled = [...items];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
	}
	return shuffled;
}

function listAudios(audios) {
	if (!audios) {
		return [];
	}
	return [...Object.values(audios.vowels), audios.syllables, audios.pressure, audios.congratulations];
}

export default function SilabasA() {
	const [displayedVowels, setDisplayedVowels] = useState(VOWELS);
	const [isUppercase, setIsUppercase] = useState(true);
	const [isShuffled, setIsShuffled] = useState(false);
	const [markedVowels, setMarkedVowels] = useState(() => new Set());
	const [mouth, setMouth] = useState(HIDDEN_MOUTH);
	const [isCelebrating, setIsCelebrating] = useState(false);
	const [confetti, setConfetti] = useState([]);

	const character = useMemo(() => {
		const saved = readStorage(CHARACTER_KEY);
		return CHARACTERS[saved] ? { id: saved, ...CHARACTERS[saved] } : null;
	}, []);

	const audiosRef = useRef(null);
	const timersRef = useRef({ mouthFrame: null, mouthStart: null, mouthEnd: null, celebration: null });
	// Lo que cambia dentro de timers y callbacks de audio no pasa por el render.
	const flagsRef = useRef({
		sequenceActive: false,
		sequenceIndex: 0,
		mouthFrameIndex: 0,
		celebrationPending: false,
		celebrating: false
	});
	const displayedVowelsRef = useRef(displayedVowels);

	useEffect(() => {
		displayedVowelsRef.current = displayedVowels;
	}, [displayedVowels]);

	useEffect(() => {
		const audios = {
			vowels: Object.fromEntries(
				VOWELS.map((vowel) => [vowel, new Audio(`/assets/sonidos/${vowel}.m4a`)])
			),
			syllables: new Audio("/assets/sonidos/SilabasA.m4a"),
			pressure: new Audio("/assets/sonidos/Presion.m4a"),
			congratulations: new Audio("/assets/sonidos/Felicitaciones.m4a")
		};

		listAudios(audios).forEach((audio) => {
			audio.preload = "auto";
		});
		audiosRef.current = audios;

		const timers = timersRef.current;
		return () => {
			clearInterval(timers.mouthFrame);
			clearTimeout(timers.mouthStart);
			clearTimeout(timers.mouthEnd);
			clearTimeout(timers.celebration);
			listAudios(audios).forEach((audio) => {
				audio.onended = null;
				audio.pause();
				audio.src = "";
			});
			audiosRef.current = null;
		};
	}, []);

	function stopAllAudio() {
		listAudios(audiosRef.current).forEach((audio) => audio.pause());
	}

	function resetVowelAudios() {
		Object.values(audiosRef.current?.vowels ?? {}).forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
	}

	function clearMouthTimers() {
		clearTimeout(timersRef.current.mouthStart);
		clearTimeout(timersRef.current.mouthEnd);
	}

	function stopMouthAnimation() {
		clearInterval(timersRef.current.mouthFrame);
	}

	function hideMouth() {
		setMouth(HIDDEN_MOUTH);
	}

	// Boca hablando: rota las tres imagenes mientras suena un audio largo.
	function startMouthAnimation() {
		stopMouthAnimation();
		flagsRef.current.mouthFrameIndex = 0;
		setMouth({ visible: true, src: MOUTH_IMAGES[0], shifted: false });

		timersRef.current.mouthFrame = setInterval(() => {
			const flags = flagsRef.current;
			flags.mouthFrameIndex = (flags.mouthFrameIndex + 1) % MOUTH_IMAGES.length;
			setMouth({
				visible: true,
				src: MOUTH_IMAGES[flags.mouthFrameIndex],
				shifted: flags.mouthFrameIndex > 0
			});
		}, MOUTH_FRAME_MS);
	}

	function scheduleVowelMouth(audio) {
		clearMouthTimers();
		const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 1;
		setMouth((current) => ({ ...current, visible: false }));

		timersRef.current.mouthStart = setTimeout(() => {
			setMouth((current) => ({ ...current, visible: true }));
		}, duration * VOWEL_MOUTH_START * 1000);
		timersRef.current.mouthEnd = setTimeout(() => {
			setMouth((current) => ({ ...current, visible: false }));
		}, duration * VOWEL_MOUTH_END * 1000);
	}

	function playSyllables() {
		const audios = audiosRef.current;
		if (!audios) {
			return;
		}

		const flags = flagsRef.current;
		flags.sequenceActive = true;
		flags.sequenceIndex = 0;
		audios.pressure.pause();
		audios.pressure.currentTime = 0;
		clearMouthTimers();
		resetVowelAudios();
		audios.syllables.pause();
		audios.syllables.currentTime = 0;
		startMouthAnimation();

		audios.syllables.onended = () => {
			stopMouthAnimation();
			hideMouth();
			playNextVowelInSequence();
		};
		audios.syllables.play().catch(() => {
			flags.sequenceActive = false;
			stopMouthAnimation();
			hideMouth();
		});
	}

	// Tras el audio de silabas suenan las vocales en pantalla y cierra "Presion".
	function playNextVowelInSequence() {
		const audios = audiosRef.current;
		const flags = flagsRef.current;
		const vowels = displayedVowelsRef.current;

		if (!audios || !flags.sequenceActive || flags.sequenceIndex >= vowels.length) {
			if (audios && flags.sequenceActive) {
				flags.sequenceActive = false;
				clearMouthTimers();
				hideMouth();
				audios.pressure.currentTime = 0;
				playPressure();
			}
			return;
		}

		const vowel = vowels[flags.sequenceIndex];
		const audio = audios.vowels[vowel];
		flags.sequenceIndex += 1;

		clearMouthTimers();
		resetVowelAudios();
		setMouth({ visible: false, src: MOUTH_BY_VOWEL[vowel], shifted: SHIFTED_MOUTH_VOWELS.has(vowel) });

		audio.onended = () => {
			clearMouthTimers();
			setMouth((current) => ({ ...current, visible: false }));
			playNextVowelInSequence();
		};
		audio.play().then(() => scheduleVowelMouth(audio)).catch(() => {
			clearMouthTimers();
			audio.onended = null;
			flags.sequenceActive = false;
			hideMouth();
		});
	}

	function playPressure() {
		const audios = audiosRef.current;
		if (!audios) {
			return;
		}

		startMouthAnimation();
		audios.pressure.onended = () => {
			stopMouthAnimation();
			hideMouth();
		};
		audios.pressure.play().catch(() => {
			stopMouthAnimation();
			hideMouth();
		});
	}

	function playVowel(vowel) {
		const audios = audiosRef.current;
		if (!audios) {
			return;
		}

		const flags = flagsRef.current;
		finishCelebration(false);
		flags.sequenceActive = false;
		audios.pressure.pause();
		audios.pressure.currentTime = 0;
		audios.syllables.pause();
		audios.syllables.currentTime = 0;
		clearMouthTimers();
		stopMouthAnimation();
		resetVowelAudios();
		setMouth({ visible: false, src: MOUTH_BY_VOWEL[vowel], shifted: SHIFTED_MOUTH_VOWELS.has(vowel) });

		const audio = audios.vowels[vowel];
		audio.onended = () => {
			clearMouthTimers();
			hideMouth();
			if (flags.celebrationPending) {
				flags.celebrationPending = false;
				startCelebration();
			}
		};
		audio.play().then(() => scheduleVowelMouth(audio)).catch(() => {
			clearMouthTimers();
			flags.celebrationPending = false;
			hideMouth();
		});
	}

	// Al tocar las cinco vocales: confeti, salto del personaje y "Felicitaciones".
	function startCelebration() {
		const flags = flagsRef.current;
		if (flags.celebrating) {
			return;
		}

		flags.celebrating = true;
		flags.sequenceActive = false;
		clearMouthTimers();
		stopAllAudio();
		stopMouthAnimation();
		hideMouth();
		setIsCelebrating(true);
		setConfetti(createConfetti());
		timersRef.current.celebration = setTimeout(playCongratulations, CELEBRATION_DELAY_MS);
	}

	function playCongratulations() {
		const audios = audiosRef.current;
		if (!audios) {
			return;
		}

		startMouthAnimation();
		audios.congratulations.onended = () => finishCelebration();
		audios.congratulations.play().catch(() => finishCelebration());
	}

	function finishCelebration(resetVowels = true) {
		const audios = audiosRef.current;
		const flags = flagsRef.current;

		clearTimeout(timersRef.current.celebration);
		stopMouthAnimation();
		if (audios) {
			audios.congratulations.pause();
			audios.congratulations.currentTime = 0;
		}
		hideMouth();
		setIsCelebrating(false);
		flags.celebrating = false;

		if (resetVowels) {
			flags.celebrationPending = false;
			setMarkedVowels(new Set());
		}
		setConfetti([]);
	}

	function selectVowel(vowel) {
		const marked = new Set(markedVowels).add(vowel);
		setMarkedVowels(marked);
		flagsRef.current.celebrationPending = marked.size === VOWELS.length;
		playVowel(vowel);
	}

	function toggleCase() {
		finishCelebration();
		setIsUppercase((current) => !current);
	}

	function toggleShuffle() {
		finishCelebration();
		setDisplayedVowels(isShuffled ? VOWELS : shuffle(VOWELS));
		setIsShuffled((current) => !current);
	}

	return (
		<div className="screen silabas-screen">
			<nav aria-label="Navegación y usuario">
				<BackButton />
				<GuestProfile />
			</nav>

			<nav className="exercise-controls" aria-label="Controles de vocales">
				<button
					className="exercise-control"
					type="button"
					aria-label="Cambiar mayúsculas y minúsculas"
					aria-pressed={!isUppercase}
					onClick={toggleCase}
				>
					{isUppercase ? "A" : "a"}
				</button>
				<button
					className="exercise-control shuffle-control"
					type="button"
					aria-label="Mezclar vocales"
					aria-pressed={isShuffled}
					onClick={toggleShuffle}
				>
					{"↻"}
				</button>
			</nav>

			<nav className="activity-buttons" aria-label="Actividades">
				{ACTIVITY_BUTTONS.map((activity) => (
					<button
						key={activity}
						className="activity-button"
						type="button"
						aria-label={`Actividad ${activity}`}
					/>
				))}
			</nav>

			<div className="confetti-layer" aria-hidden="true">
				{confetti.map(({ id, left, color, drift, duration, delay }) => (
					<span
						key={id}
						className="confetti-piece"
						style={{
							left,
							animationDelay: delay,
							"--confetti-color": color,
							"--confetti-drift": drift,
							"--confetti-duration": duration
						}}
					/>
				))}
			</div>

			{character ? (
				<button
					className={`character-avatar${isCelebrating ? " celebrating" : ""}`}
					type="button"
					aria-label="Mostrar boca del personaje"
					aria-pressed={mouth.visible}
					onClick={playSyllables}
				>
					<img src={character.image} alt={character.label} />
					{mouth.visible ? (
						<img
							className={`character-mouth${mouth.shifted ? " shifted-mouth" : ""}`}
							src={mouth.src}
							alt=""
						/>
					) : null}
				</button>
			) : null}

			<div className="vowel-list" aria-label="Vocales">
				{displayedVowels.map((vowel) => (
					<button
						key={vowel}
						className={markedVowels.has(vowel) ? "orange-vowel" : ""}
						type="button"
						aria-label={`Reproducir vocal ${vowel}`}
						onClick={() => selectVowel(vowel)}
					>
						{isUppercase ? vowel : vowel.toLowerCase()}
					</button>
				))}
			</div>
		</div>
	);
}
