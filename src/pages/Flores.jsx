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
import "./Flores.css";
import "./FloresMundo1.css";
import "./FloresMundo2.css";
import "./FloresMundo3.css";

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
const FLOWER_IMAGES = [img("chupetin1.png"), img("chupetin2.png")];
const MUNDO3_ANIMALS = ["conejo", "flamenco", "gato", "jirafa"];
const TOTAL_ACTIVITIES = 5;

function getAudioFileName(label, isMundo2, isMundo3) {
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
	usePageTitle(isMundo3 ? "Flores - Mundo 3" : isMundo2 ? "Flores - Mundo 2" : "Flores - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const mouthImages = isMundo3 ? MUNDO3_MOUTH_IMAGES : isMundo2 ? MUNDO2_MOUTH_IMAGES : undefined;
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const activityMenuOption = useActivityMenuOption();
	const syllables = isMundo3 ? MUNDO3_SYLLABLES : isMundo2 ? MUNDO2_SYLLABLES : SYLLABLES;
	const [mode] = useState(() => (Object.hasOwn(syllables, activityMenuOption) ? activityMenuOption : isMundo3 ? "r" : isMundo2 ? "p" : "a"));
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

	if (game.current.instructionOrder.length === 0) {
		game.current.instructionOrder = shuffle(mode !== "a" ? syllables[mode] : VOWELS);
	}

	function audioPath(label) {
		return sound(getAudioFileName(label, isMundo2, isMundo3));
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

	function playLabelAudio(label, onEnded) {
		const audios = audioRef.current;
		stopAudio(instructionAudio);
		stopAudio(audios.option);
		stopTalking();
		stopAudio(audios.feedback);
		const audio = runtime.audio(audioPath(label));
		audio.onended = onEnded;
		audio.play().catch(() => onEnded?.());
	}

	function buildFlowers(activityIndex = game.current.activityIndex) {
		const target = game.current.instructionOrder[activityIndex];
		const incorrect = mode !== "a"
			? shuffle(syllables[mode].filter((item) => item !== target)).slice(0, 3)
			: shuffle(VOWELS.filter((item) => item !== target)).slice(0, 3);
		const labels = shuffle([target, ...incorrect]);
		setRound((current) => ({
			generation: current.generation + 1,
			activityIndex,
			target,
			flowers: labels.map((label, index) => ({
				label,
				image: isMundo3
					? img(`animal ${MUNDO3_ANIMALS[index]}.png`)
					: isMundo2
						? img(`oruga${(index % 2) + 1}.png`)
						: FLOWER_IMAGES[index % FLOWER_IMAGES.length],
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

	function repeatInstruction() {
		if (!game.current.celebrationActive && !game.current.transitionPending && round.target) {
			playInstruction(round.target);
		}
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
			flowers: current.flowers.map((item, itemIndex) => {
				if (itemIndex !== index) {
					return item;
				}
				const result = item.correct ? "correct" : "wrong";
				return {
					...item,
					image: isMundo3
						? img(`animal ${item.animal}${item.correct ? " evolucionado" : " error"}.png`)
						: isMundo2
							? img(`oruga${item.caterpillar}${item.correct ? "acierto" : "error"}.png`)
							: item.image,
					result
				};
			})
		}));

		if (!flower.correct) {
			game.current.errors += 1;
		}
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
		<div className={`page activity-page page-flores ${isMundo3 ? "world-mundo3" : isMundo2 ? "world-mundo2" : "world-mundo1"}`}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls" aria-label="Controles de actividad">
					<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restart}>
					&#x21bb; Reiniciar
				</button>
			</div>
			<main className="flower-activity">
				<section className="flower-field" aria-label={isMundo3 ? "Animalitos" : "Flores"}>
					{round.flowers.map((flower, index) => (
						<button
							key={`${round.generation}-${index}`}
							type="button"
							className={flower.result ? `flower-button ${flower.result}` : "flower-button"}
							onClick={() => handleFlowerClick(index)}
						>
							{!isMundo2 && !isMundo3 && <img className="flower-stem" src={img("palito.png")} alt="" aria-hidden="true" />}
							<img className="flower-image" src={flower.image} alt={`${isMundo3 ? `Animal ${flower.animal}` : isMundo2 ? "Oruga" : "Flor"} con ${flower.label}`} />
							<span className="flower-label">{flower.label}</span>
						</button>
					))}
				</section>
			</main>
			<Character character={character} mouth={mouth} celebrating={celebrating} onClick={repeatInstruction} />
			<PremioComida premio={premio} />
		</div>
	);
}
