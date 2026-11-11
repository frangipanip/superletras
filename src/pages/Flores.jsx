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
import { img, MUNDO2_MOUTH_IMAGES, MUNDO3_MOUTH_IMAGES, MUNDO4_CHARACTER_FRAMES, MUNDO4_MOUTH_IMAGES, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { createMundo4IncorrectSyllables, MUNDO4_SYLLABLES } from "../lib/mundo4";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import "./actividad.css";
import "./Flores.css";
import "./FloresMundo1.css";
import "./FloresMundo2.css";
import "./FloresMundo3.css";
import "./FloresMundo4.css";

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
	rr: ["RRA", "RRE", "RRI", "RRO", "RRU"],
	ar: ["ARA", "ERE", "IRI", "ORO", "URU"],
	y: ["YA", "YE", "YI", "YO", "YU"],
	ll: ["LLA", "LLE", "LLI", "LLO", "LLU"]
};
const MUNDO4_SEAHORSES = {
	amarillo: ["caballitoAmarillo1.png", "caballitoAmarillo2.png", "caballitoAmarillo3.png", "caballitoAmarillo4.png", "caballitoAmarillo5.png"].map(img),
	celeste: ["caballitoCeleste1.png", "caballitoCeleste2.png", "caballitoCeleste3.png", "caballitoCeleste4.png", "caballitoCeleste5.png"].map(img)
};
const MUNDO4_SEAHORSE_RESULTS = {
	amarillo: { correct: img("caballitoAmarilloacierto.png"), wrong: img("caballitoAmarilloerror.png") },
	celeste: { correct: img("caballitoCelesteacierto.png"), wrong: img("caballitoCelesteerror.png") }
};
// Mundo 1: un chupetín de cada color por ronda (los 4 tienen el mismo lienzo y las mismas medidas).
const CANDY_IMAGES = ["violeta", "rosa", "amarillo", "celeste"].map((color) => img(`chupetin-${color}.png`));
const MUNDO3_ANIMALS = ["conejo", "flamenco", "gato", "jirafa"];
const TOTAL_ACTIVITIES = 5;

function getAudioFileName(label, isMundo2, isMundo3, isMundo4) {
	const upper = label.toUpperCase();
	if (isMundo2 || isMundo3 || isMundo4) return `${upper.toLowerCase()}.mp3`;
	if (["A", "E", "I", "O", "U"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["LA", "LE", "LI", "LO", "LU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["MA", "ME", "MI", "MO", "MU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (upper.startsWith("S")) return `${upper}.mp3`;
	if (upper === "TE") return "te.mp3";
	if (upper.startsWith("T")) return `${upper}.mp3`;
	return `${label.toLowerCase()}.wav`;
}

function stopAudio(audio) {
	if (!audio) {
		return;
	}
	audio.pause();
	audio.currentTime = 0;
	audio.onended = null;
}

export default function Flores() {
	const location = useLocation();
	const isMundo2 = location.state?.world === 2;
	const isMundo3 = location.state?.world === 3;
	const isMundo4 = location.state?.world === 4;
	usePageTitle(isMundo4 ? "Flores - Mundo 4" : isMundo3 ? "Flores - Mundo 3" : isMundo2 ? "Flores - Mundo 2" : "Flores - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const mouthImages = isMundo4 ? MUNDO4_MOUTH_IMAGES : isMundo3 ? MUNDO3_MOUTH_IMAGES : isMundo2 ? MUNDO2_MOUTH_IMAGES : undefined;
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const activityMenuOption = useActivityMenuOption();
	const syllables = isMundo4 ? MUNDO4_SYLLABLES : isMundo3 ? MUNDO3_SYLLABLES : isMundo2 ? MUNDO2_SYLLABLES : SYLLABLES;
	const [mode] = useState(() => (Object.hasOwn(syllables, activityMenuOption) ? activityMenuOption : isMundo4 ? "c" : isMundo3 ? "r" : isMundo2 ? "p" : "a"));
	const [characterFrame, setCharacterFrame] = useState(0);
	const [round, setRound] = useState({ generation: 0, activityIndex: 0, target: "", flowers: [] });
	const [celebrating, setCelebrating] = useState(false);
	const [instructionAudio] = useState(() => runtime.audio(sound(mode === "a" ? "Pulsavocal.mp3" : "Pulsasilaba.mp3")));
	const [celebrationAudio] = useState(() => runtime.audio(sound("Fabuloso.mp3")));
	const [premio, otorgarPremio] = useRecompensa("flores", mode);
	const audioRef = useRef({ option: null, feedback: null });
	// errors: flores equivocadas tocadas, definen cuántas comidas se ganan.
	const game = useRef({ activityIndex: 0, instructionOrder: [], transitionPending: false, celebrationActive: false, errors: 0 });
	const roundRef = useRef(round);
	roundRef.current = round;

	useEffect(() => {
		if (!isMundo4 || !character) return undefined;
		let timer = 0;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		function updateAnimation() {
			runtime.clearInterval(timer);
			timer = 0;
			setCharacterFrame(0);
			if (document.visibilityState === "visible" && document.hasFocus() && !reducedMotion.matches) {
				timer = runtime.setInterval(() => {
					setCharacterFrame((current) => (current + 1) % MUNDO4_CHARACTER_FRAMES[character].length);
				}, 375);
			}
		}

		updateAnimation();
		document.addEventListener("visibilitychange", updateAnimation);
		window.addEventListener("blur", updateAnimation);
		window.addEventListener("focus", updateAnimation);
		reducedMotion.addListener(updateAnimation);
		return () => {
			document.removeEventListener("visibilitychange", updateAnimation);
			window.removeEventListener("blur", updateAnimation);
			window.removeEventListener("focus", updateAnimation);
			reducedMotion.removeListener(updateAnimation);
			runtime.clearInterval(timer);
		};
	}, [character, isMundo4, runtime]);

	if (game.current.instructionOrder.length === 0) {
		game.current.instructionOrder = shuffle(mode !== "a" ? syllables[mode] : VOWELS);
	}

	function audioPath(label) {
		return sound(getAudioFileName(label, isMundo2, isMundo3, isMundo4));
	}

	function playInstruction(targetValue) {
		const audios = audioRef.current;
		stopAudio(instructionAudio);
		stopAudio(audios.option);
		startTalking();
		const optionAudio = runtime.audio(audioPath(targetValue));
		audios.option = optionAudio;
		optionAudio.onended = () => {
			optionAudio.onended = null;
			instructionAudio.onended = () => {
				instructionAudio.onended = null;
				optionAudio.currentTime = 0;
				optionAudio.onended = () => {
					optionAudio.onended = null;
					stopTalking();
				};
				optionAudio.play().catch(() => {
					optionAudio.onended = null;
					stopTalking();
				});
			};
			instructionAudio.play().catch(() => {
				instructionAudio.onended = null;
				stopTalking();
			});
		};
		optionAudio.play().catch(() => {
			optionAudio.onended = null;
			stopTalking();
		});
	}

	function playLabelAudio(label) {
		const audios = audioRef.current;
		stopAudio(instructionAudio);
		stopAudio(audios.option);
		stopTalking();
		stopAudio(audios.feedback);
		const audio = runtime.audio(audioPath(label));
		audio.play().catch(() => {});
	}

	function buildFlowers(activityIndex = game.current.activityIndex) {
		const target = game.current.instructionOrder[activityIndex];
		const incorrect = isMundo4
			? createMundo4IncorrectSyllables(mode)
			: mode !== "a"
				? shuffle(syllables[mode].filter((item) => item !== target)).slice(0, 3)
				: shuffle(VOWELS.filter((item) => item !== target)).slice(0, 3);
		const labels = shuffle([target, ...incorrect]);
		const candyImages = shuffle(CANDY_IMAGES);
		const horseColors = shuffle(["amarillo", "amarillo", "celeste", "celeste"]);
		setRound((current) => ({
			generation: current.generation + 1,
			activityIndex,
			target,
			flowers: labels.map((label, index) => ({
				label,
				horseColor: isMundo4 ? horseColors[index] : null,
				image: isMundo3
						? img(`animal ${MUNDO3_ANIMALS[index]}.png`)
						: isMundo2
							? img(`oruga${(index % 2) + 1}.png`)
							: candyImages[index],
				animal: MUNDO3_ANIMALS[index],
				caterpillar: (index % 2) + 1,
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
		otorgarPremio(game.current.errors);
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
		game.current.errors = 0;
		game.current.instructionOrder = shuffle(mode !== "a" ? syllables[mode] : VOWELS);
		game.current.transitionPending = false;
		buildFlowers(0);
	}

	function getVisibleSeahorseFrame(button) {
		const frames = button.querySelectorAll(".m4-horse-frame");
		for (let index = 0; index < frames.length; index += 1) {
			if (Number.parseFloat(window.getComputedStyle(frames[index]).opacity) >= 0.5) {
				return index + 1;
			}
		}
		return 1;
	}

	function advanceWrongSeahorse(index, frame, generation) {
		runtime.setTimeout(() => {
			const currentRound = roundRef.current;
			const currentFlower = currentRound.flowers[index];
			if (currentRound.generation !== generation || currentFlower?.result !== "wrong-pending") {
				return;
			}
			setRound((current) => ({
				...current,
				flowers: current.flowers.map((item, itemIndex) => {
					if (itemIndex !== index) return item;
					if (frame <= 1) return { ...item, result: "wrong", wrongFrame: null };
					return { ...item, wrongFrame: frame - 1 };
				})
			}));
			if (frame > 1) {
				advanceWrongSeahorse(index, frame - 1, generation);
			}
		}, 150);
	}

	function repeatInstruction() {
		if (!game.current.celebrationActive && !game.current.transitionPending && round.target) {
			playInstruction(round.target);
		}
	}

	function handleFlowerClick(index, event) {
		const currentRound = roundRef.current;
		const flower = currentRound.flowers[index];
		if (!flower || flower.result || game.current.transitionPending || game.current.celebrationActive) {
			return;
		}
		const wrongSeahorseFrame = isMundo4 && !flower.correct ? getVisibleSeahorseFrame(event.currentTarget) : null;
		playLabelAudio(flower.label);
		const audios = audioRef.current;
		stopAudio(audios.feedback);
		audios.feedback = runtime.audio(sound(flower.correct ? "correcto.mp3" : "error.mp3"));
		audios.feedback.play().catch(() => {});
		setRound((current) => ({
			...current,
			flowers: current.flowers.map((item, itemIndex) => {
				if (isMundo3 && flower.correct) {
					return {
						...item,
						image: img(`animal ${item.animal}${item.correct ? " evolucionado" : " error"}.png`),
						result: item.correct ? "correct" : "wrong"
					};
				}
				if (itemIndex !== index) {
					return item;
				}
				const result = item.correct ? "correct" : "wrong";
				return {
					...item,
					result: isMundo4 && !item.correct ? "wrong-pending" : result,
					wrongFrame: isMundo4 && !item.correct ? wrongSeahorseFrame : null,
					image: isMundo3
						? img(`animal ${item.animal}${item.correct ? " evolucionado" : " error"}.png`)
						: isMundo2
							? img(`oruga${item.caterpillar}${item.correct ? "acierto" : "error"}.png`)
							: item.image
				};
			})
		}));

		if (!flower.correct) {
			game.current.errors += 1;
			if (isMundo4) {
				advanceWrongSeahorse(index, wrongSeahorseFrame, currentRound.generation);
			}
		}
		if (flower.correct) {
			game.current.transitionPending = true;
			const completedIndex = currentRound.activityIndex;
			runtime.setTimeout(() => {
				if (roundRef.current.activityIndex !== completedIndex) {
					return;
				}
				if (completedIndex + 1 >= (isMundo4 ? syllables[mode].length : TOTAL_ACTIVITIES)) {
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
		<div className={`page activity-page page-flores ${isMundo4 ? "world-mundo4" : isMundo3 ? "world-mundo3" : isMundo2 ? "world-mundo2" : "world-mundo1"}`}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls" aria-label="Controles de actividad">
					<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restart}>
					&#x21bb; Reiniciar
				</button>
			</div>
			<main className="flower-activity">
				<section className="flower-field" aria-label={isMundo4 ? "Caballitos de mar" : isMundo3 ? "Animalitos" : "Flores"}>
					{round.flowers.map((flower, index) => (
						isMundo4 ? (
							<div
								className={`m4-flower-pair m4-flower-pair-${index + 1}${flower.result ? ` ${flower.result}` : ""}`}
								key={`${round.generation}-${index}`}
							>
								<button
									className="m4-creature-choice"
									type="button"
									disabled={Boolean(flower.result) || game.current.transitionPending || game.current.celebrationActive}
									aria-label={`Caballito ${flower.horseColor} y almeja con la sílaba ${flower.label}`}
									onClick={(event) => handleFlowerClick(index, event)}
								>
									<span className="m4-horse" aria-hidden="true">
										{MUNDO4_SEAHORSES[flower.horseColor].map((frame, frameIndex) => (
											<img
												className={`m4-horse-frame m4-horse-frame-${frameIndex + 1}${flower.wrongFrame === frameIndex + 1 ? " m4-horse-frame-active" : ""}`}
												key={`${frame}-${frameIndex}`}
												src={frame}
												alt=""
												draggable={false}
											/>
										))}
										<img
											className="m4-horse-result"
											src={MUNDO4_SEAHORSE_RESULTS[flower.horseColor][flower.result || "correct"]}
											alt=""
											draggable={false}
										/>
									</span>
									<span className="m4-shell" aria-hidden="true">
										<img src={img("almejasilabas.png")} alt="" draggable={false} />
										<span className="flower-label">{flower.label}</span>
									</span>
								</button>
							</div>
						) : (
							<button
								key={`${round.generation}-${index}`}
								type="button"
								className={flower.result ? `flower-button ${flower.result}` : "flower-button"}
								onClick={(event) => handleFlowerClick(index, event)}
							>
								{isMundo2 || isMundo3 ? (
									<>
										<img className="flower-image" src={flower.image} alt={`${isMundo3 ? `Animal ${flower.animal}` : "Oruga"} con ${flower.label}`} />
										<span className="flower-label">{flower.label}</span>
									</>
								) : (
									/*
									 * El chupetín se dibuja en tres partes recortadas de la misma imagen (ver
									 * FloresMundo1.css): al acertar la cabeza sube y el tramo de palito se estira.
									 */
									<span className="candy" role="img" aria-label={`Chupetín con ${flower.label}`}>
										<img className="candy-part candy-base" src={flower.image} alt="" />
										<img className="candy-part candy-stick" src={flower.image} alt="" />
										<span className="candy-head">
											<img className="candy-part candy-top" src={flower.image} alt="" />
											<span className="flower-label">{flower.label}</span>
										</span>
									</span>
								)}
							</button>
						)
					))}
				</section>
			</main>
			<Character
				character={character}
				mouth={mouth}
				image={isMundo4 && character ? MUNDO4_CHARACTER_FRAMES[character][characterFrame] : undefined}
				celebrating={celebrating}
				onClick={repeatInstruction}
			/>
			<PremioComida premio={premio} />
		</div>
	);
}
