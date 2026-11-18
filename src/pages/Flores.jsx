import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import IconoParlante from "../components/IconoParlante";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO2_MOUTH_IMAGES, MUNDO3_MOUTH_IMAGES, MUNDO4_CHARACTER_FRAMES, MUNDO4_MOUTH_IMAGES, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { createMundo4IncorrectSyllables, MUNDO4_CONTRASTE, MUNDO4_SYLLABLES } from "../lib/mundo4";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useAyudaError } from "../hooks/useAyudaError";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
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
// Cuánto dura la reacción a una opción equivocada antes de que vuelva a estar disponible
// (Mundo 1: la sacudida; Mundo 2: la oruga dormida; Mundo 4: el caballito escondido en la arena).
// En Mundo 3 el animalito equivocado se desarma y queda así.
const ERROR_MS_MUNDO1 = 560;
const ERROR_MS_MUNDO2 = 1000;
const ERROR_MS_MUNDO4 = 1000;
// YI casi no existe en palabras: se presenta en Inicio pero no se practica.
const SILABAS_SIN_PRACTICA = ["YI"];

function getAudioFileName(label, isMundo2, isMundo3, isMundo4) {
	const upper = label.toUpperCase();
	// Los archivos de S y T están en mayúscula (menos te.mp3); en el servidor el nombre es exacto.
	if (upper === "TE") return "te.mp3";
	if (/^[ST][AEIOU]$/.test(upper)) return `${upper}.mp3`;
	if (isMundo2 || isMundo3 || isMundo4) return `${upper.toLowerCase()}.mp3`;
	if (["A", "E", "I", "O", "U"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["LA", "LE", "LI", "LO", "LU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (["MA", "ME", "MI", "MO", "MU"].includes(upper)) return `${upper.toLowerCase()}.mp3`;
	if (upper.startsWith("S")) return `${upper}.mp3`;
	if (upper === "TE") return "te.mp3";
	if (upper.startsWith("T")) return `${upper}.mp3`;
	return `${label.toLowerCase()}.wav`;
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
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3"), { preload: true }));
	const [premio, otorgarPremio] = useRecompensa("flores", mode);
	// Todo lo que suena pasa por una sola secuencia: así la sílaba, la devolución y la ayuda no se pisan.
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const labelAudios = useRef({}).current;
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

	// Sílabas que se piden (una por ronda). En CE y Q de Mundo 4 se mezclan con CA, CO, CU.
	const practiceSyllables = mode === "a"
		? VOWELS
		: (isMundo4 && MUNDO4_CONTRASTE[mode]) || syllables[mode].filter((item) => !SILABAS_SIN_PRACTICA.includes(item));
	const mixedContrast = isMundo4 && Boolean(MUNDO4_CONTRASTE[mode]);

	if (game.current.instructionOrder.length === 0) {
		game.current.instructionOrder = shuffle(practiceSyllables);
	}

	function audioPath(label) {
		return sound(getAudioFileName(label, isMundo2, isMundo3, isMundo4));
	}

	function labelAudio(label) {
		if (!labelAudios[label]) {
			labelAudios[label] = runtime.audio(audioPath(label));
		}
		return labelAudios[label];
	}

	function playInstruction(targetValue) {
		const optionAudio = labelAudio(targetValue);
		secuencia.reproducir([optionAudio, instructionAudio, optionAudio]);
	}

	function buildFlowers(activityIndex = game.current.activityIndex) {
		const target = game.current.instructionOrder[activityIndex];
		const incorrect = isMundo4 && !mixedContrast
			? createMundo4IncorrectSyllables(mode)
			: shuffle(practiceSyllables.filter((item) => item !== target)).slice(0, 3);
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
				baseImage: null,
				caterpillar: (index % 2) + 1,
				correct: label === target,
				result: null
			}))
		}));
		ayuda.reiniciar();
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
		secuencia.cancelar();
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
		game.current.instructionOrder = shuffle(practiceSyllables);
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
			} else {
				// Se queda un momento escondido y vuelve a salir (la animación arranca asomándose).
				recoverWrongOption(index, generation, ERROR_MS_MUNDO4);
			}
		}, 150);
	}

	// La opción equivocada vuelve a estar como al principio y se puede tocar otra vez.
	function recoverWrongOption(index, generation, delay) {
		runtime.setTimeout(() => {
			if (roundRef.current.generation !== generation || roundRef.current.flowers[index]?.result !== "wrong") {
				return;
			}
			setRound((current) => ({
				...current,
				flowers: current.flowers.map((item, itemIndex) => (
					itemIndex === index && item.result === "wrong"
						? { ...item, result: null, wrongFrame: null, image: item.baseImage || item.image }
						: item
				))
			}));
		}, delay);
	}

	function repeatInstruction() {
		if (!game.current.celebrationActive && !game.current.transitionPending && round.target) {
			playInstruction(round.target);
		}
	}

	// Parlante chico de cada opción (solo Mundo 3): la escucha sin elegirla (no cuenta como respuesta).
	function oirOpcion(flower, event) {
		event.stopPropagation();
		event.preventDefault();
		if (game.current.transitionPending || game.current.celebrationActive) return;
		secuencia.reproducir([labelAudio(flower.label)]);
	}

	function parlante(flower) {
		if (flower.result) return null;
		return (
			<span
				className="opcion-parlante"
				role="button"
				aria-label={`Escuchar ${flower.label}`}
				onClick={(event) => oirOpcion(flower, event)}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<IconoParlante />
			</span>
		);
	}

	function handleFlowerClick(index, event) {
		const currentRound = roundRef.current;
		const flower = currentRound.flowers[index];
		if (!flower || flower.result || game.current.transitionPending || game.current.celebrationActive) {
			return;
		}
		const wrongSeahorseFrame = isMundo4 && !flower.correct ? getVisibleSeahorseFrame(event.currentTarget) : null;
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
					baseImage: item.image,
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
			} else if (!isMundo3) {
				recoverWrongOption(index, currentRound.generation, isMundo2 ? ERROR_MS_MUNDO2 : ERROR_MS_MUNDO1);
			}
		}
		if (!flower.correct) {
			// Sílaba tocada → error → ayuda con la sílaba pedida.
			secuencia.reproducir([
				mudo(labelAudio(flower.label)),
				mudo(errorAudio),
				...ayuda.trasError(labelAudio(currentRound.target))
			]);
			return;
		}
		game.current.transitionPending = true;
		const completedIndex = currentRound.activityIndex;
		const startedAt = Date.now();
		// Sílaba → felicitación, y recién cuando termina (y la animación tuvo su tiempo) viene la siguiente.
		secuencia.reproducir([mudo(labelAudio(flower.label)), mudo(correctAudio)], () => {
			runtime.setTimeout(() => {
				if (roundRef.current.activityIndex !== completedIndex) {
					return;
				}
				if (completedIndex + 1 >= game.current.instructionOrder.length) {
					startCelebration();
					return;
				}
				game.current.activityIndex = completedIndex + 1;
				game.current.transitionPending = false;
				buildFlowers();
			}, Math.max(300, 1400 - (Date.now() - startedAt)));
		});
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
					&#x21bb;
				</button>
			</div>
			<main className="flower-activity">
				<section className="flower-field" aria-label={isMundo4 ? "Caballitos de mar" : isMundo3 ? "Animalitos" : "Flores"}>
					{round.flowers.map((flower, index) => (
						isMundo4 ? (
							<div
								className={`m4-flower-pair m4-flower-pair-${index + 1}${flower.result ? ` ${flower.result}` : ""}${ayuda.pista && flower.correct && !flower.result ? " pista-correcta" : ""}`}
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
								className={`flower-button${flower.result ? ` ${flower.result}` : ""}${ayuda.pista && flower.correct && !flower.result ? " pista-correcta" : ""}`}
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
								{isMundo3 && parlante(flower)}
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
