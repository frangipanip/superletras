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
import { img, sound, MUNDO1_MOUTH_IMAGES, MUNDO2_MOUTH_IMAGES, MUNDO3_MOUTH_IMAGES, MUNDO4_MOUTH_IMAGES, MUNDO5_MOUTH_IMAGES } from "../lib/assets";
import { arteTren, crearConfigTren, SILABAS_TREN } from "../lib/tren";
import { shuffle } from "../lib/shuffle";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useAyudaError } from "../hooks/useAyudaError";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import "./actividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const BOCAS = { 1: MUNDO1_MOUTH_IMAGES, 2: MUNDO2_MOUTH_IMAGES, 3: MUNDO3_MOUTH_IMAGES, 4: MUNDO4_MOUTH_IMAGES, 5: MUNDO5_MOUTH_IMAGES };
const MIN_DROP_OVERLAP = 0.15;
// La primera vuelta (con las letras a la vista) es una demostración corta; la segunda, sin modelo,
// pide todas las secuencias.
const RONDAS_CON_MODELO = 2;
// Un toque que casi no se mueve no es un arrastre: elige el vagón para después tocar el casillero.
const TOQUE_MAX_PX = 12;

const ACTIVITY_CONFIG = {
	a: {
		sequences: ["OE", "EA", "AA", "OIA", "UAU"],
		sequenceTokens: {},
		speechAudios: {
			vagones: "Vagones.mp3",
			OE: "Oe.mp3",
			EA: "Ea.mp3",
			AA: "Aa.mp3",
			OIA: "Oia.mp3",
			UAU: "Uau.mp3",
			fabuloso: "Fabuloso.mp3"
		}
	},
	l: {
		sequences: ["LA", "LE", "LI", "LO", "LU"],
		sequenceTokens: {
			LA: ["L", "A"],
			LE: ["L", "E"],
			LI: ["L", "I"],
			LO: ["L", "O"],
			LU: ["L", "U"]
		},
		speechAudios: {
			vagones: "Vagones.mp3",
			LA: "la.mp3",
			LE: "le.mp3",
			LI: "li.mp3",
			LO: "lo.mp3",
			LU: "lu.mp3",
			fabuloso: "Fabuloso.mp3"
		}
	},
	m: {
		sequences: ["MA", "ME", "MI", "MO", "MU"],
		sequenceTokens: {
			MA: ["M", "A"],
			ME: ["M", "E"],
			MI: ["M", "I"],
			MO: ["M", "O"],
			MU: ["M", "U"]
		},
		speechAudios: {
			vagones: "Vagones.mp3",
			MA: "ma.mp3",
			ME: "me.mp3",
			MI: "mi.mp3",
			MO: "mo.mp3",
			MU: "mu.mp3",
			fabuloso: "Fabuloso.mp3"
		}
	},
	s: {
		sequences: ["SA", "SE", "SI", "SO", "SU"],
		sequenceTokens: {
			SA: ["S", "A"],
			SE: ["S", "E"],
			SI: ["S", "I"],
			SO: ["S", "O"],
			SU: ["S", "U"]
		},
		speechAudios: {
			vagones: "Vagones.mp3",
			SA: "SA.mp3",
			SE: "SE.mp3",
			SI: "SI.mp3",
			SO: "SO.mp3",
			SU: "SU.mp3",
			fabuloso: "Fabuloso.mp3"
		}
	},
	t: {
		sequences: ["TA", "TE", "TI", "TO", "TU"],
		sequenceTokens: {
			TA: ["T", "A"],
			TE: ["T", "E"],
			TI: ["T", "I"],
			TO: ["T", "O"],
			TU: ["T", "U"]
		},
		speechAudios: {
			vagones: "Vagones.mp3",
			TA: "TA.mp3",
			TE: "te.mp3",
			TI: "TI.mp3",
			TO: "TO.mp3",
			TU: "TU.mp3",
			fabuloso: "Fabuloso.mp3"
		}
	}
};

function randomItem(items) {
	return items[Math.floor(Math.random() * items.length)];
}

export default function Tren() {
	const location = useLocation();
	const mundo = location.state?.world || 1;
	usePageTitle(`Tren - Mundo ${mundo}`);
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, BOCAS[mundo]);
	const activityMenuOption = useActivityMenuOption();
	const [menuOption] = useState(() => {
		const opciones = SILABAS_TREN[mundo] || ACTIVITY_CONFIG;
		return Object.hasOwn(opciones, activityMenuOption) ? activityMenuOption : Object.keys(opciones)[0];
	});
	const [config] = useState(() => mundo === 1 ? ACTIVITY_CONFIG[menuOption] : crearConfigTren(mundo, menuOption));
	const arte = arteTren(mundo);
	const [speechAudios] = useState(() =>
		Object.fromEntries(Object.entries(config.speechAudios).map(([key, file]) => [key, runtime.audio(sound(file), { preload: true })]))
	);
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3"), { preload: true }));

	const [slots, setSlots] = useState([]);
	const [convoy, setConvoy] = useState({ generation: 0, tokens: [] });
	const [arriving, setArriving] = useState(false);
	const [departing, setDeparting] = useState(false);
	const [selected, setSelected] = useState(null);
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const [celebrating, setCelebrating] = useState(false);
	const [drag, setDrag] = useState(null);
	const sequenceBoardRef = useRef(null);

	const [isHintHidden, setIsHintHidden] = useState(false);
	const [premio, otorgarPremio] = useRecompensa("tren", menuOption);

	// Estado que leen los callbacks de audio/timers/puntero (siempre el valor actual).
	const game = useRef({
		sequenceOrder: shuffle([...config.sequences]),
		roundIndex: 0,
		totalRounds: RONDAS_CON_MODELO,
		completedSlots: 0,
		selected: null,
		currentSequence: "",
		generation: 0,
		usedTokens: new Set(),
		filledSlots: new Set(),
		activityFinished: false,
		departing: false,
		drag: null,
		isHintHidden: false,
		// Vagones soltados en el casillero equivocado (en las dos vueltas): definen cuántas comidas se ganan.
		errors: 0
	}).current;

	function formatToken(token) {
		return token.toUpperCase();
	}

	function select(index) {
		game.selected = index;
		setSelected(index);
	}

	function stopSpeech() {
		secuencia.cancelar();
	}

	function speak(audio, onEnded = null) {
		secuencia.reproducir([audio], onEnded);
	}

	function getSequenceTokens(sequenceKey) {
		return config.sequenceTokens[sequenceKey] || Array.from(sequenceKey);
	}

	function updateDeparting(value) {
		game.departing = value;
		setDeparting(value);
	}

	function createConvoy() {
		const tokens = getSequenceTokens(game.currentSequence);
		const extra = randomItem(config.distractores || VOWELS.filter((vowel) => !tokens.includes(vowel)));
		setConvoy((current) => ({
			generation: current.generation + 1,
			tokens: shuffle([...tokens, extra]).map((value) => ({ value, disabled: false }))
		}));
		updateDeparting(false);
		setArriving(true);
		const generation = game.generation;
		runtime.setTimeout(() => { if (game.generation === generation) setArriving(false); }, 1800);
	}

	function loadRound(announce = true) {
		game.generation += 1;
		game.currentSequence = game.sequenceOrder[game.roundIndex];
		game.completedSlots = 0;
		game.usedTokens.clear();
		game.filledSlots.clear();
		game.drag = null;
		setDrag(null);
		setSlots(getSequenceTokens(game.currentSequence).map((value) => ({ value, filled: false })));
		select(null);
		ayuda.reiniciar();
		createConvoy();
		if (announce) {
			speak(speechAudios[game.currentSequence]);
		}
	}

	function announceCurrentRound() {
		speak(speechAudios.vagones, () => speak(speechAudios[game.currentSequence]));
	}

	function startPhaseTwo() {
		setCelebrating(false);
		game.activityFinished = false;
		game.roundIndex = 0;
		game.totalRounds = config.sequences.length;
		game.completedSlots = 0;
		game.isHintHidden = true;
		setIsHintHidden(true);
		game.sequenceOrder = shuffle(config.sequences);
		updateDeparting(false);
		loadRound(false);
		announceCurrentRound();
	}

	function completeRound() {
		const generation = game.generation;
		game.roundIndex += 1;
		updateDeparting(true);
		if (game.roundIndex === game.totalRounds) {
			game.activityFinished = true;
			// La actividad se completa al terminar la segunda vuelta (la que no muestra las letras).
			if (game.isHintHidden) {
				otorgarPremio(game.errors);
			}
			runtime.setTimeout(() => {
				if (game.generation !== generation) return;
				setConvoy((current) => ({ ...current, tokens: null }));
				runtime.requestAnimationFrame(() => {
					if (game.generation !== generation) return;
					setCelebrating(true);
					speak(speechAudios.fabuloso, () => {
						if (!game.isHintHidden) {
							startPhaseTwo();
						}
					});
				});
			}, 1500);
			return;
		}
		runtime.setTimeout(() => { if (game.generation === generation) loadRound(); }, 1500);
	}

	function restartActivity() {
		const previousSequence = game.currentSequence;
		stopSpeech();
		game.activityFinished = false;
		game.roundIndex = 0;
		game.totalRounds = RONDAS_CON_MODELO;
		game.completedSlots = 0;
		game.isHintHidden = false;
		game.errors = 0;
		setIsHintHidden(false);
		do {
			game.sequenceOrder = shuffle(config.sequences);
		} while (game.sequenceOrder[0] === previousSequence);
		setCelebrating(false);
		updateDeparting(false);
		loadRound(false);
		announceCurrentRound();
	}

	function startDragging(event, index, value) {
		if (game.roundIndex >= game.totalRounds || game.departing || game.usedTokens.has(index)) {
			return;
		}
		const rect = event.currentTarget.getBoundingClientRect();
		game.drag = {
			index,
			value,
			startX: event.clientX,
			startY: event.clientY,
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top
		};
		setDrag(game.drag);
		event.preventDefault();
	}

	function dragToken(event) {
		if (!game.drag) {
			return;
		}
		game.drag = { ...game.drag, left: event.clientX - game.drag.offsetX, top: event.clientY - game.drag.offsetY };
		setDrag(game.drag);
	}

	function finishDragging(event) {
		if (!game.drag) {
			return;
		}
		const { index, value, offsetX, offsetY, width, height, startX, startY } = game.drag;
		const dragLeft = event.clientX - offsetX;
		const dragTop = event.clientY - offsetY;
		game.drag = null;
		setDrag(null);

		// Toque sin arrastrar: elige el vagón (o lo suelta si ya estaba elegido).
		if (Math.hypot(event.clientX - startX, event.clientY - startY) < TOQUE_MAX_PX) {
			select(game.selected === index ? null : index);
			return;
		}

		const slotElements = [...sequenceBoardRef.current.querySelectorAll(".sequence-slot")];
		const minOverlapArea = width * height * MIN_DROP_OVERLAP;
		let targetIndex = -1;
		let largestOverlapArea = 0;
		slotElements.forEach((slot, slotIndex) => {
			const rect = slot.getBoundingClientRect();
			const overlapWidth = Math.max(0, Math.min(dragLeft + width, rect.right) - Math.max(dragLeft, rect.left));
			const overlapHeight = Math.max(0, Math.min(dragTop + height, rect.bottom) - Math.max(dragTop, rect.top));
			const overlapArea = overlapWidth * overlapHeight;
			if (overlapArea >= minOverlapArea && overlapArea > largestOverlapArea) {
				largestOverlapArea = overlapArea;
				targetIndex = slotIndex;
			}
		});
		placeToken(index, value, targetIndex);
	}

	// Pone el vagón `index` en el casillero `targetIndex` (arrastrado, o elegido y después tocado).
	function placeToken(index, value, targetIndex) {
		const target = sequenceBoardRef.current.querySelectorAll(".sequence-slot")[targetIndex];
		if (!target || game.filledSlots.has(targetIndex) || game.usedTokens.has(index) || game.departing || game.activityFinished) {
			return;
		}
		select(null);
		if (target.dataset.vowel !== value) {
			game.errors += 1;
			// Error → ayuda: se vuelve a decir lo que hay que armar.
			stopSpeech();
			secuencia.reproducir([mudo(errorAudio), ...ayuda.trasError(speechAudios[game.currentSequence])]);
			return;
		}

		game.usedTokens.add(index);
		game.filledSlots.add(targetIndex);
		setSlots((current) => current.map((slot, slotIndex) => (slotIndex === targetIndex ? { ...slot, filled: true } : slot)));
		setConvoy((current) => ({
			...current,
			tokens: current.tokens.map((token, tokenIndex) => (tokenIndex === index ? { ...token, disabled: true } : token))
		}));
		game.completedSlots += 1;
		if (game.completedSlots === getSequenceTokens(game.currentSequence).length) {
			// Antes de que el tren parta se dice lo que quedó armado.
			game.departing = true;
			let partio = false;
			const partir = () => {
				if (!partio) {
					partio = true;
					completeRound();
				}
			};
			stopSpeech();
			secuencia.reproducir([speechAudios[game.currentSequence]], partir);
		}
	}

	function placeSelected(targetIndex) {
		const index = game.selected;
		const token = index === null ? null : convoy.tokens?.[index];
		if (token && !token.disabled) {
			placeToken(index, token.value, targetIndex);
		}
	}

	function cancelDragging() {
		game.drag = null;
		setDrag(null);
	}

	useEffect(() => {
		loadRound(false);
		announceCurrentRound();
		window.addEventListener("pointermove", dragToken);
		window.addEventListener("pointerup", finishDragging);
		window.addEventListener("pointercancel", cancelDragging);
		return () => {
			window.removeEventListener("pointermove", dragToken);
			window.removeEventListener("pointerup", finishDragging);
			window.removeEventListener("pointercancel", cancelDragging);
		};
	}, []);

	const convoyClassName = ["train-convoy", arriving && "arriving", departing && "departing"].filter(Boolean).join(" ");
	const draggedToken = drag && convoy.tokens?.[drag.index];
	// Pista tras dos errores: el vagón que va en el primer casillero vacío.
	const proximoValor = slots.find((slot) => !slot.filled)?.value;
	const pistaIndex = convoy.tokens ? convoy.tokens.findIndex((token) => !token.disabled && token.value === proximoValor) : -1;

	return (
		<div className={`page activity-page page-tren tren-mundo-${mundo}`} style={{ backgroundImage: `url("${img(arte.fondo)}")` }}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls" aria-label="Controles de actividad">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restartActivity}>
					&#x21bb;
				</button>
			</div>
			<main className="train-activity" aria-live="polite">
				<section className="sequence-board" ref={sequenceBoardRef} aria-label="Sílabas del tren">
					{slots.map((slot, index) => (
						<div
							key={`${convoy.generation}-${index}`}
							className={["sequence-slot", slot.value.length > 1 && "double-token", slot.filled && "filled"].filter(Boolean).join(" ")}
							data-vowel={slot.value}
							role="button"
							tabIndex={slot.filled ? -1 : 0}
							aria-label={`Casillero ${index + 1}${slot.filled ? `: ${slot.value}` : " vacío"}`}
							onClick={() => placeSelected(index)}
							onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); placeSelected(index); } }}
						>
							{isHintHidden && !slot.filled ? "_" : formatToken(slot.value)}
						</div>
					))}
				</section>
				<section className="train-yard" aria-label="Vagones con letras">
					<div key={convoy.generation} className={convoyClassName}>
						{convoy.tokens?.map((token, index) => (
							<div className="wagon" key={index}>
								<img src={img(arte.vagones[index % arte.vagones.length])} alt="Vagón" draggable={false} />
								<button
									className={[
										"vowel-token",
										token.value.length > 1 && "double-token",
										selected === index && "selected",
										ayuda.pista && index === pistaIndex && "pista-correcta"
									].filter(Boolean).join(" ")}
									type="button"
									aria-label={`Ficha ${token.value}`}
									disabled={token.disabled}
									style={drag?.index === index ? { visibility: "hidden" } : undefined}
									onPointerDown={(event) => startDragging(event, index, token.value)}
									onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(selected === index ? null : index); } }}
								>
									{formatToken(token.value)}
								</button>
							</div>
						))}
						{convoy.tokens && <img className="locomotive" src={img(arte.locomotora)} alt="Locomotora" draggable={false} />}
					</div>
				</section>
			</main>
			{draggedToken && (
				<button
					className={draggedToken.value.length > 1 ? "vowel-token double-token dragging" : "vowel-token dragging"}
					type="button"
					tabIndex={-1}
					aria-hidden="true"
					style={{
						position: "fixed",
						left: `${drag.left}px`,
						top: `${drag.top}px`,
						width: `${drag.width}px`,
						height: `${drag.height}px`,
						transform: "none"
					}}
				>
					{formatToken(draggedToken.value)}
				</button>
			)}
			<Character
				character={character}
				mouth={mouth}
				celebrating={celebrating}
				label="Escuchar al personaje"
				onClick={() => {
					if (!game.activityFinished && !game.departing) {
						speak(speechAudios[game.currentSequence]);
					}
				}}
			/>
			<PremioComida premio={premio} />
		</div>
	);
}
