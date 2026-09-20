import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import "./actividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const WAGON_IMAGES = ["vagon1.svg", "vagon2.svg", "vagon3.svg", "vagon4.svg"];

const ACTIVITY_CONFIG = {
	a: {
		sequences: ["OE", "EA", "AA", "OIA", "UAU"],
		sequenceTokens: {},
		extraOptions: VOWELS,
		speechAudios: {
			vagones: "Vagones.m4a",
			OE: "Oe.m4a",
			EA: "Ea.m4a",
			AA: "Aa.m4a",
			OIA: "Oia.m4a",
			UAU: "Uau.m4a",
			fabuloso: "Fabuloso.m4a"
		}
	},
	l: {
		sequences: ["lola", "lula", "ola", "ala", "lio", "lee", "lila"],
		sequenceTokens: {
			lola: ["LO", "LA"],
			lula: ["LU", "LA"],
			ola: ["O", "LA"],
			ala: ["A", "LA"],
			lio: ["LI", "O"],
			lee: ["LE", "E"],
			lila: ["LI", "LA"]
		},
		extraOptions: ["A", "E", "I", "O", "U", "LA", "LE", "LI", "LO", "LU"],
		speechAudios: {
			vagones: "Vagones.m4a",
			lola: "lola.m4a",
			lula: "lula.m4a",
			ola: "ola.m4a",
			ala: "ala.m4a",
			lio: "lio.m4a",
			lee: "lee.m4a",
			lila: "lila.m4a",
			fabuloso: "Fabuloso.m4a"
		}
	}
};

function randomItem(items) {
	return items[Math.floor(Math.random() * items.length)];
}

export default function Tren() {
	usePageTitle("Tren - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const activityMenuOption = useActivityMenuOption();
	const [menuOption] = useState(() => (activityMenuOption === "l" ? "l" : "a"));
	const config = ACTIVITY_CONFIG[menuOption];
	const [speechAudios] = useState(() =>
		Object.fromEntries(Object.entries(config.speechAudios).map(([key, file]) => [key, runtime.audio(sound(file), { preload: true })]))
	);

	const [roundIndex, setRoundIndex] = useState(0);
	const [slots, setSlots] = useState([]);
	const [convoy, setConvoy] = useState({ generation: 0, tokens: [] });
	const [arriving, setArriving] = useState(false);
	const [departing, setDeparting] = useState(false);
	const [uppercaseLetters, setUppercaseLetters] = useState(true);
	const [celebrating, setCelebrating] = useState(false);
	const [drag, setDrag] = useState(null);
	const sequenceBoardRef = useRef(null);

	// Estado que leen los callbacks de audio/timers/puntero (siempre el valor actual).
	const game = useRef({
		sequenceOrder: [...config.sequences],
		roundIndex: 0,
		completedSlots: 0,
		currentSequence: "",
		activeSpeechAudio: null,
		activityFinished: false,
		departing: false,
		drag: null
	}).current;

	function formatToken(token, uppercase = uppercaseLetters) {
		return uppercase ? token.toUpperCase() : token.toLowerCase();
	}

	function stopSpeech() {
		if (game.activeSpeechAudio) {
			game.activeSpeechAudio.pause();
			game.activeSpeechAudio.currentTime = 0;
			game.activeSpeechAudio.onended = null;
		}
		game.activeSpeechAudio = null;
		stopTalking();
	}

	function speak(audio, onEnded = null) {
		stopSpeech();
		game.activeSpeechAudio = audio;
		startTalking();
		audio.onended = () => {
			stopSpeech();
			onEnded?.();
		};
		audio.currentTime = 0;
		audio.play().catch(stopSpeech);
	}

	function getSequenceTokens(sequenceKey) {
		return menuOption === "l" ? config.sequenceTokens[sequenceKey] || [] : Array.from(sequenceKey);
	}

	function updateDeparting(value) {
		game.departing = value;
		setDeparting(value);
	}

	function createConvoy() {
		const tokens = getSequenceTokens(game.currentSequence);
		const extra = randomItem(menuOption === "l" ? config.extraOptions : VOWELS);
		setConvoy((current) => ({
			generation: current.generation + 1,
			tokens: shuffle([...tokens, extra]).map((value) => ({ value, disabled: false }))
		}));
		updateDeparting(false);
		setArriving(true);
		runtime.setTimeout(() => setArriving(false), 1800);
	}

	function loadRound(announce = true) {
		game.currentSequence = game.sequenceOrder[game.roundIndex];
		game.completedSlots = 0;
		setRoundIndex(game.roundIndex);
		setSlots(getSequenceTokens(game.currentSequence).map((value) => ({ value, filled: false })));
		createConvoy();
		if (announce) {
			speak(speechAudios[game.currentSequence]);
		}
	}

	function announceCurrentRound() {
		speak(speechAudios.vagones, () => speak(speechAudios[game.currentSequence]));
	}

	function completeRound() {
		game.roundIndex += 1;
		updateDeparting(true);
		if (game.roundIndex === config.sequences.length) {
			game.activityFinished = true;
			runtime.setTimeout(() => {
				setConvoy((current) => ({ ...current, tokens: null }));
				runtime.requestAnimationFrame(() => {
					setCelebrating(true);
					speak(speechAudios.fabuloso);
				});
			}, 1500);
			return;
		}
		runtime.setTimeout(loadRound, 1500);
	}

	function restartActivity() {
		const previousSequence = game.currentSequence;
		stopSpeech();
		game.activityFinished = false;
		game.roundIndex = 0;
		game.completedSlots = 0;
		do {
			game.sequenceOrder = shuffle(config.sequences);
		} while (game.sequenceOrder[0] === previousSequence);
		setCelebrating(false);
		updateDeparting(false);
		loadRound(false);
		announceCurrentRound();
	}

	function startDragging(event, index, value) {
		if (game.roundIndex >= config.sequences.length || game.departing) {
			return;
		}
		const rect = event.currentTarget.getBoundingClientRect();
		game.drag = {
			index,
			value,
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
		const { index, value } = game.drag;
		game.drag = null;
		setDrag(null);

		const slotElements = [...sequenceBoardRef.current.querySelectorAll(".sequence-slot")];
		const targetIndex = slotElements.findIndex((slot) => {
			const rect = slot.getBoundingClientRect();
			return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
		});
		const target = slotElements[targetIndex];
		if (!target || target.dataset.vowel !== value || target.classList.contains("filled")) {
			return;
		}

		setSlots((current) => current.map((slot, slotIndex) => (slotIndex === targetIndex ? { ...slot, filled: true } : slot)));
		setConvoy((current) => ({
			...current,
			tokens: current.tokens.map((token, tokenIndex) => (tokenIndex === index ? { ...token, disabled: true } : token))
		}));
		game.completedSlots += 1;
		if (game.completedSlots === getSequenceTokens(game.currentSequence).length) {
			completeRound();
		}
	}

	function toggleCase() {
		setUppercaseLetters((current) => !current);
		restartActivity();
	}

	useEffect(() => {
		loadRound(false);
		announceCurrentRound();
		window.addEventListener("pointermove", dragToken);
		window.addEventListener("pointerup", finishDragging);
		window.addEventListener("pointercancel", finishDragging);
		return () => {
			window.removeEventListener("pointermove", dragToken);
			window.removeEventListener("pointerup", finishDragging);
			window.removeEventListener("pointercancel", finishDragging);
		};
	}, []);

	const convoyClassName = ["train-convoy", arriving && "arriving", departing && "departing"].filter(Boolean).join(" ");
	const draggedToken = drag && convoy.tokens?.[drag.index];

	return (
		<div className="page activity-page page-tren">
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls" aria-label="Controles de actividad">
				<button
					className="case-button"
					type="button"
					aria-label={uppercaseLetters ? "Cambiar a minúsculas" : "Cambiar a mayúsculas"}
					aria-pressed={!uppercaseLetters}
					onClick={toggleCase}
				>
					{uppercaseLetters ? "A" : "a"}
				</button>
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restartActivity}>
					&#x21bb; Reiniciar
				</button>
			</div>
			<main className="train-activity" aria-live="polite">
				<div className="activity-heading">
					<h1 className="activity-title">Completa la secuencia</h1>
					<p className="round-counter">
						{roundIndex + 1} / {config.sequences.length}
					</p>
				</div>
				<section className="sequence-board" ref={sequenceBoardRef} aria-label="Secuencia de vocales">
					{slots.map((slot, index) => (
						<div
							key={`${convoy.generation}-${index}`}
							className={["sequence-slot", slot.value.length > 1 && "double-token", slot.filled && "filled"].filter(Boolean).join(" ")}
							data-vowel={slot.value}
						>
							{formatToken(slot.value)}
						</div>
					))}
				</section>
				<section className="train-yard" aria-label="Vagones con vocales">
					<div key={convoy.generation} className={convoyClassName}>
						{convoy.tokens?.map((token, index) => (
							<div className="wagon" key={index}>
								<img src={img(WAGON_IMAGES[index % WAGON_IMAGES.length])} alt="Vagon" draggable={false} />
								<button
									className={token.value.length > 1 ? "vowel-token double-token" : "vowel-token"}
									type="button"
									aria-label={menuOption === "l" ? `Sílaba ${token.value}` : `Vocal ${token.value}`}
									disabled={token.disabled}
									style={drag?.index === index ? { visibility: "hidden" } : undefined}
									onPointerDown={(event) => startDragging(event, index, token.value)}
								>
									{formatToken(token.value)}
								</button>
							</div>
						))}
						{convoy.tokens && <img className="locomotive" src={img("tren.svg")} alt="Locomotora" draggable={false} />}
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
					if (!game.activityFinished) {
						speak(speechAudios.vagones);
					}
				}}
			/>
		</div>
	);
}
