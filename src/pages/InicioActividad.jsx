import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./InicioActividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const CONFETTI_COLORS = ["#f04f78", "#f6c945", "#55b96c", "#4d9ed8", "#9b6bd6", "#f08a36"];

export default function InicioActividad() {
	usePageTitle("Inicio - Mundo 1");
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [audios] = useState(() => ({
		syllables: runtime.audio(sound("SilabasA.m4a"), { preload: true }),
		pressure: runtime.audio(sound("Presion.m4a"), { preload: true }),
		shuffle: runtime.audio(sound("Mezclarvocales.m4a"), { preload: true }),
		vowelPrompt: runtime.audio(sound("Pulsavocal.m4a"), { preload: true }),
		celebration: runtime.audio(sound("Felicitaciones.m4a"), { preload: true }),
		error: runtime.audio(sound("error.mp3"), { preload: true }),
		vowelsLong: Object.fromEntries(VOWELS.map((vowel) => [vowel, runtime.audio(sound(`${vowel}largo.m4a`), { preload: true })])),
		vowelsShort: Object.fromEntries(VOWELS.map((vowel) => [vowel, runtime.audio(sound(`${vowel}.wav`), { preload: true })]))
	}));
	const [activeVowel, setActiveVowel] = useState(null);
	const [selectedVowels, setSelectedVowels] = useState(() => new Set());
	const [activitySelectedVowels, setActivitySelectedVowels] = useState(() => new Set());
	const [vowelOrder, setVowelOrder] = useState(VOWELS);
	const [isShuffling, setIsShuffling] = useState(false);
	const [requestedVowel, setRequestedVowel] = useState(null);
	const [incorrectVowel, setIncorrectVowel] = useState(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const sequenceTimer = useRef(0);
	const shuffleTimer = useRef(0);
	const errorTimer = useRef(0);
	const requestedVowelIndex = useRef(0);
	const menuOption = location.state?.menuOption;

	function stopShortVowelAudios() {
		audios.vowelPrompt.onended = null;
		audios.vowelPrompt.pause();
		audios.vowelPrompt.currentTime = 0;
		Object.values(audios.vowelsShort).forEach((vowelAudio) => {
			vowelAudio.onended = null;
			vowelAudio.pause();
			vowelAudio.currentTime = 0;
		});
	}

	function playRequestedVowel(vowel) {
		stopShortVowelAudios();
		const vowelAudio = audios.vowelsShort[vowel];
		setActiveVowel(null);
		startTalking();
		audios.vowelPrompt.onended = () => {
			audios.vowelPrompt.onended = null;
			vowelAudio.currentTime = 0;
			vowelAudio.onended = () => {
				vowelAudio.onended = null;
				setActiveVowel(null);
				stopTalking();
			};
			vowelAudio.play().catch(() => {
				vowelAudio.onended = null;
				setActiveVowel(null);
				stopTalking();
			});
		};
		audios.vowelPrompt.currentTime = 0;
		audios.vowelPrompt.play().catch(() => {
			audios.vowelPrompt.onended = null;
			setActiveVowel(null);
			stopTalking();
		});
	}

	function handleVowelPress(vowel) {
		if (requestedVowel) {
			if (vowel !== requestedVowel) {
				runtime.clearTimeout(errorTimer.current);
				setIncorrectVowel(vowel);
				audios.error.currentTime = 0;
				audios.error.play().catch(() => {});
				errorTimer.current = runtime.setTimeout(() => setIncorrectVowel(null), 500);
				return;
			}
			stopShortVowelAudios();
			setIncorrectVowel(null);
			setActivitySelectedVowels((current) => new Set(current).add(vowel));
			setActiveVowel(vowel);
			stopTalking();
			if (requestedVowelIndex.current >= VOWELS.length - 1) {
				setRequestedVowel(null);
				setActiveVowel(null);
				setShowConfetti(true);
				audios.celebration.onended = () => {
					audios.celebration.onended = null;
					stopTalking();
					setShowConfetti(false);
				};
				startTalking();
				audios.celebration.currentTime = 0;
				audios.celebration.play().catch(() => {
					stopTalking();
					setShowConfetti(false);
				});
				return;
			}
			requestedVowelIndex.current += 1;
			runtime.setTimeout(() => {
				const nextVowel = VOWELS[requestedVowelIndex.current];
				setRequestedVowel(nextVowel);
				playRequestedVowel(nextVowel);
			}, 180);
			return;
		}
		playVowel(vowel);
	}

	function completeVowelSelection() {
		[...Object.values(audios.vowelsLong), ...Object.values(audios.vowelsShort)].forEach((vowelAudio) => {
			vowelAudio.onended = null;
			vowelAudio.pause();
			vowelAudio.currentTime = 0;
		});
		setActiveVowel(null);
		setIsShuffling(false);
		startTalking();
		audios.shuffle.currentTime = 0;
		audios.shuffle.onended = () => {
			audios.shuffle.onended = null;
			stopTalking();
			setSelectedVowels(new Set());
			setVowelOrder(shuffle(VOWELS));
			setIsShuffling(true);
			shuffleTimer.current = runtime.setTimeout(() => {
				setIsShuffling(false);
				requestedVowelIndex.current = 0;
				setActivitySelectedVowels(new Set());
				setRequestedVowel(VOWELS[0]);
				playRequestedVowel(VOWELS[0]);
			}, 1200);
		};
		audios.shuffle.play().catch(() => {
			audios.shuffle.onended = null;
			stopTalking();
			setSelectedVowels(new Set());
			setVowelOrder(shuffle(VOWELS));
			setIsShuffling(true);
			shuffleTimer.current = runtime.setTimeout(() => {
				setIsShuffling(false);
				requestedVowelIndex.current = 0;
				setActivitySelectedVowels(new Set());
				setRequestedVowel(VOWELS[0]);
				playRequestedVowel(VOWELS[0]);
			}, 1200);
		});
	}

	function playVowel(vowel) {
		runtime.clearTimeout(sequenceTimer.current);
		audios.syllables.onended = null;
		audios.syllables.pause();
		audios.pressure.onended = null;
		audios.pressure.pause();
		[...Object.values(audios.vowelsLong), ...Object.values(audios.vowelsShort)].forEach((vowelAudio) => {
			vowelAudio.onended = null;
			vowelAudio.pause();
			vowelAudio.currentTime = 0;
		});
		const vowelAudio = audios.vowelsShort[vowel];
		setSelectedVowels((current) => {
			if (current.has(vowel)) {
				return current;
			}
			const next = new Set(current);
			next.add(vowel);
			return next;
		});
		setActiveVowel(vowel);
		startTalking();
		vowelAudio.onended = () => {
			vowelAudio.onended = null;
			setActiveVowel(null);
			stopTalking();
		};
		vowelAudio.play().catch(() => {
			vowelAudio.onended = null;
			setActiveVowel(null);
			stopTalking();
		});
	}

	useEffect(() => {
		if (selectedVowels.size === VOWELS.length && activeVowel === null) {
			completeVowelSelection();
		}
	}, [selectedVowels, activeVowel]);

	useEffect(() => {
		if (menuOption !== "a") {
			return undefined;
		}
		let vowelIndex = 0;

		function playNextVowel() {
			if (vowelIndex >= VOWELS.length) {
				setActiveVowel(null);
				stopTalking();
				return;
			}
			const vowel = VOWELS[vowelIndex];
			const vowelAudio = audios.vowelsLong[vowel];
			vowelIndex += 1;
			setActiveVowel(vowel);
			startTalking();
			vowelAudio.currentTime = 0;
			vowelAudio.onended = () => {
				vowelAudio.onended = null;
				stopTalking();
				setActiveVowel(null);
				sequenceTimer.current = runtime.setTimeout(() => {
					if (vowel === "U") {
						audios.pressure.currentTime = 0;
						audios.pressure.onended = stopTalking;
						startTalking();
						audios.pressure.play().catch(stopTalking);
						return;
					}
					playNextVowel();
				}, 180);
			};
			vowelAudio.play().catch(() => {
				vowelAudio.onended = null;
				stopTalking();
				setActiveVowel(null);
			});
		}

		audios.syllables.onended = playNextVowel;
		audios.syllables.currentTime = 0;
		startTalking();
		audios.syllables.play().catch(() => {
			stopTalking();
		});
		return () => {
			runtime.clearTimeout(sequenceTimer.current);
			runtime.clearTimeout(shuffleTimer.current);
			runtime.clearTimeout(errorTimer.current);
			audios.error.pause();
			audios.error.currentTime = 0;
			setShowConfetti(false);
			audios.celebration.onended = null;
			audios.celebration.pause();
			audios.celebration.currentTime = 0;
				setShowConfetti(false);
			audios.shuffle.onended = null;
			audios.shuffle.pause();
			audios.shuffle.currentTime = 0;
			stopShortVowelAudios();
			audios.syllables.onended = null;
			audios.syllables.pause();
			audios.syllables.currentTime = 0;
			audios.pressure.onended = null;
			audios.pressure.pause();
			audios.pressure.currentTime = 0;
			[...Object.values(audios.vowelsLong), ...Object.values(audios.vowelsShort)].forEach((vowelAudio) => {
				vowelAudio.onended = null;
				vowelAudio.pause();
				vowelAudio.currentTime = 0;
			});
			setActiveVowel(null);
			stopTalking();
		};
	}, [audios, menuOption]);

	return (
		<div className="page activity-page page-inicio-actividad">
			<BackButton />
			<FullscreenButton toggle />
			<main className="inicio-activity-stage">
				<img className="inicio-activity-background" src="/assets/imagenes/rectangulo.svg" alt="" draggable={false} />
				<div className="inicio-vowels" aria-label="Vocales">
					{vowelOrder.map((vowel) => (
						<button
							key={vowel}
							className={`inicio-vowel-button inicio-vowel-${vowel.toLowerCase()}${selectedVowels.has(vowel) || activitySelectedVowels.has(vowel) ? " selected" : ""}${activeVowel === vowel ? " active" : ""}${incorrectVowel === vowel ? " incorrect" : ""}${isShuffling ? " shuffling" : ""}`}
							type="button"
							aria-label={`Reproducir vocal ${vowel}`}
							onClick={() => handleVowelPress(vowel)}
						>
							{vowel}
						</button>
					))}
				</div>
				{showConfetti && (
					<div className="inicio-confetti" aria-hidden="true">
						{Array.from({ length: 28 }, (_, index) => (
							<span
								key={index}
								className="inicio-confetti-piece"
								style={{
									"--confetti-left": `${(index * 37) % 100}%`,
									"--confetti-delay": `${(index % 7) * 80}ms`,
									"--confetti-color": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
									"--confetti-rotation": `${(index * 53) % 360}deg`
								}}
							/>
						))}
					</div>
				)}
				{character && (
					<div className="inicio-activity-character" aria-label="Personaje seleccionado">
						<img src={CHARACTERS[character].image} alt={CHARACTERS[character].alt} />
						<img
							className={mouth.shifted ? "inicio-activity-mouth shifted-mouth" : "inicio-activity-mouth"}
							src={mouth.src}
							alt=""
							hidden={!mouth.visible}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
