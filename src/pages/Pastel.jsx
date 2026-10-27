import { useCallback, useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { img, sound } from "../lib/assets";
import { GROUPS } from "../lib/palabras";
import "./actividad.css";
import "./Pastel.css";

const TOKEN_IMAGES = [img("galle1.png"), img("galle2.png")];
const DROP_OVERLAP_MINIMO = 0.25;

function nombreAudioSilaba(silaba) {
	const mayuscula = silaba.startsWith("S") || (silaba.startsWith("T") && silaba !== "TE");
	if (mayuscula) {
		return `${silaba.toUpperCase()}.mp3`;
	}
	return `${silaba.toLowerCase()}.mp3`;
}

function dividirPalabra(palabra) {
	const corte = /^[AEIOU]/.test(palabra) && palabra.length === 3
		? 1
		: Math.min(2, palabra.length - 1);
	return [palabra.slice(0, corte), palabra.slice(corte)];
}

function crearRonda(letra, palabraAnterior) {
	const grupo = GROUPS[Object.prototype.hasOwnProperty.call(GROUPS, letra) ? letra : "l"];
	const candidatas = grupo.items.filter((palabra) => palabra !== palabraAnterior);
	const palabra = candidatas[Math.floor(Math.random() * candidatas.length)];
	const silabas = dividirPalabra(palabra);
	const ordenadas = Math.random() >= 0.7 ? silabas : [...silabas].reverse();

	return {
		palabra,
		silabas,
		opciones: ordenadas.map((valor, indice) => ({
			id: `silaba-${indice}`,
			valor,
			imagen: TOKEN_IMAGES[indice]
		}))
	};
}

export default function Pastel() {
	usePageTitle("Pastel");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const letter = Object.prototype.hasOwnProperty.call(GROUPS, menuOption) ? menuOption : "l";
	const [round, setRound] = useState(() => crearRonda(letter));
	const [introPhase, setIntroPhase] = useState("playing");
	const [slots, setSlots] = useState([null, null]);
	const [drag, setDrag] = useState(null);
	const [selectedOption, setSelectedOption] = useState(null);
	const sceneRef = useRef(null);
	const dragRef = useRef(null);
	const slotsRef = useRef(slots);
	const roundRef = useRef(round);
	const introAudioRef = useRef(null);
	const introTimerRef = useRef(null);
	const wordAudioRef = useRef(null);
	const wordAudioSequenceRef = useRef(0);
	const syllableAudioRef = useRef(null);
	const advanceTimerRef = useRef(null);
	const completionWatchdogRef = useRef(null);
	const suppressClickRef = useRef(false);
	roundRef.current = round;

	const stopWordSpeech = useCallback(() => {
		const audio = wordAudioRef.current;
		wordAudioRef.current = null;
		wordAudioSequenceRef.current += 1;
		if (audio) {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		}
		stopTalking();
	}, [stopTalking]);

	const stopSyllableAudio = useCallback(() => {
		const audio = syllableAudioRef.current;
		syllableAudioRef.current = null;
		if (audio) {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		}
		stopTalking();
	}, [stopTalking]);

	const playSyllable = useCallback((syllable) => {
		stopWordSpeech();
		stopSyllableAudio();
		const audioName = nombreAudioSilaba(syllable);
		const audio = runtime.audio(sound(audioName), { preload: true });
		syllableAudioRef.current = audio;
		startTalking();
		audio.onended = () => {
			if (syllableAudioRef.current !== audio) return;
			syllableAudioRef.current = null;
			stopTalking();
		};
		audio.play().catch((error) => {
			if (syllableAudioRef.current !== audio) return;
			syllableAudioRef.current = null;
			stopTalking();
			console.error(`No se pudo reproducir el audio ${audioName}.`, error);
		});
	}, [letter, runtime, startTalking, stopSyllableAudio, stopTalking, stopWordSpeech]);

	const playWordAudio = useCallback((word, includeInstruction, onFinished) => {
		stopSyllableAudio();
		stopWordSpeech();
		const sequenceId = wordAudioSequenceRef.current;
		const wordAudioName = `PL${word.toLowerCase()}.mp3`;
		const audioNames = includeInstruction
			? [wordAudioName, "formaPalabra.mp3", wordAudioName]
			: [wordAudioName];

		function playStep(index) {
			if (wordAudioSequenceRef.current !== sequenceId) return;
			if (index === audioNames.length) {
				wordAudioRef.current = null;
				stopTalking();
				onFinished?.();
				return;
			}

			const audioName = audioNames[index];
			const audio = runtime.audio(sound(audioName), { preload: true });
			wordAudioRef.current = audio;
			startTalking();
			audio.onended = () => {
				if (wordAudioSequenceRef.current !== sequenceId || wordAudioRef.current !== audio) return;
				playStep(index + 1);
			};
			audio.play().catch((error) => {
				if (wordAudioSequenceRef.current !== sequenceId || wordAudioRef.current !== audio) return;
				wordAudioRef.current = null;
				wordAudioSequenceRef.current += 1;
				stopTalking();
				console.error(`No se pudo reproducir el audio ${audioName}.`, error);
			});
		}

		playStep(0);
	}, [runtime, startTalking, stopTalking, stopWordSpeech, stopSyllableAudio]);

	const speakWord = useCallback((word, onFinished) => {
		playWordAudio(word, false, onFinished);
	}, [playWordAudio]);
	const speakPrompt = useCallback((word) => {
		playWordAudio(word, true);
	}, [playWordAudio]);

	useEffect(() => {
		const audioName = "introPastel.mp3";
		const audio = runtime.audio(sound(audioName), { preload: true });
		introAudioRef.current = audio;
		startTalking();

		function finishIntro() {
			if (introAudioRef.current !== audio) return;
			introAudioRef.current = null;
			audio.onended = null;
			stopTalking();
			setIntroPhase("retiring");
			introTimerRef.current = runtime.setTimeout(() => {
				introTimerRef.current = null;
				setIntroPhase("activity");
			}, 650);
		}

		audio.onended = finishIntro;
		audio.play().catch((error) => {
			if (introAudioRef.current !== audio) return;
			console.error(`No se pudo reproducir el audio ${audioName}.`, error);
			finishIntro();
		});

		return () => {
			audio.onended = null;
			audio.pause();
			if (introAudioRef.current === audio) introAudioRef.current = null;
			if (introTimerRef.current !== null) {
				runtime.clearTimeout(introTimerRef.current);
				introTimerRef.current = null;
			}
		};
	}, [runtime, startTalking, stopTalking]);

	useEffect(() => {
		if (introPhase !== "activity") return undefined;
		speakPrompt(round.palabra);
		return stopWordSpeech;
	}, [introPhase, round, speakPrompt, stopWordSpeech]);

	useEffect(() => () => {
		if (advanceTimerRef.current !== null) {
			runtime.clearTimeout(advanceTimerRef.current);
		}
		if (completionWatchdogRef.current !== null) {
			runtime.clearTimeout(completionWatchdogRef.current);
		}
	}, [runtime]);

	function advanceRound() {
		if (advanceTimerRef.current !== null) return;
		advanceTimerRef.current = runtime.setTimeout(() => {
			advanceTimerRef.current = null;
			const nextRound = crearRonda(letter, roundRef.current.palabra);
			roundRef.current = nextRound;
			slotsRef.current = [null, null];
			setRound(nextRound);
			setSlots([null, null]);
			setSelectedOption(null);
		}, 900);
	}

	function placeOption(optionId, slotIndex) {
		if (slotsRef.current[slotIndex] !== null) return;
		if (slotsRef.current.includes(optionId)) return;
		const option = roundRef.current.opciones.find(({ id }) => id === optionId);
		if (!option || option.valor !== roundRef.current.silabas[slotIndex]) return;

		const nextSlots = slotsRef.current.map((current, index) => (index === slotIndex ? optionId : current));
		slotsRef.current = nextSlots;
		setSlots(nextSlots);
		setSelectedOption(null);
		if (nextSlots.every(Boolean)) {
			completionWatchdogRef.current = runtime.setTimeout(() => {
				completionWatchdogRef.current = null;
				advanceRound();
			}, 8000);
			speakWord(roundRef.current.palabra, () => {
				if (completionWatchdogRef.current !== null) {
					runtime.clearTimeout(completionWatchdogRef.current);
					completionWatchdogRef.current = null;
				}
				advanceRound();
			});
		}
	}

	const placeOptionRef = useRef(placeOption);
	placeOptionRef.current = placeOption;

	function startDragging(event, option) {
		if (event.button !== 0 || slotsRef.current.includes(option.id)) return;
		const rect = event.currentTarget.getBoundingClientRect();
		dragRef.current = {
			pointerId: event.pointerId,
			optionId: option.id,
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
			startX: event.clientX,
			startY: event.clientY,
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top,
			moved: false
		};
		playSyllable(option.valor);
		setDrag({ ...dragRef.current });
		event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	useEffect(() => {
		function moveDrag(event) {
			const current = dragRef.current;
			if (!current || current.pointerId !== event.pointerId) return;
			current.left = event.clientX - current.offsetX;
			current.top = event.clientY - current.offsetY;
			current.moved = current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 4;
			setDrag({ ...current });
		}

		function finishDrag(event) {
			const current = dragRef.current;
			if (!current || current.pointerId !== event.pointerId) return;
			dragRef.current = null;
			setDrag(null);
			setSelectedOption(current.optionId);

			const targets = [...(sceneRef.current?.querySelectorAll(".pastel-drop-slot") || [])];
			let targetIndex = -1;
			let largestOverlap = 0;
			targets.forEach((target, index) => {
				if (slotsRef.current[index] !== null) return;
				const rect = target.getBoundingClientRect();
				const left = event.clientX - current.offsetX;
				const top = event.clientY - current.offsetY;
				const overlapWidth = Math.max(0, Math.min(left + current.width, rect.right) - Math.max(left, rect.left));
				const overlapHeight = Math.max(0, Math.min(top + current.height, rect.bottom) - Math.max(top, rect.top));
				const overlap = overlapWidth * overlapHeight;
				if (overlap >= current.width * current.height * DROP_OVERLAP_MINIMO && overlap > largestOverlap) {
					largestOverlap = overlap;
					targetIndex = index;
				}
			});
			if (targetIndex >= 0) placeOptionRef.current(current.optionId, targetIndex);
			suppressClickRef.current = current.moved;
			if (current.moved) {
				runtime.requestAnimationFrame(() => {
					suppressClickRef.current = false;
				});
			}
		}

		window.addEventListener("pointermove", moveDrag);
		window.addEventListener("pointerup", finishDrag);
		window.addEventListener("pointercancel", finishDrag);
		return () => {
			window.removeEventListener("pointermove", moveDrag);
			window.removeEventListener("pointerup", finishDrag);
			window.removeEventListener("pointercancel", finishDrag);
		};
	}, [runtime]);

	function selectOption(optionId, syllable, event) {
		if (suppressClickRef.current) {
			suppressClickRef.current = false;
			return;
		}
		if (event.detail === 0) playSyllable(syllable);
		setSelectedOption(optionId);
	}

	const pageClassName = [
		"page",
		"activity-page",
		"page-pastel",
		introPhase !== "activity" && "pastel-welcome",
		introPhase === "playing" && "pastel-intro",
		introPhase === "retiring" && "pastel-retiring"
	].filter(Boolean).join(" ");

	return (
		<div className={pageClassName}>
			<BackButton />
			<FullscreenButton toggle />
			{introPhase === "activity" && (
				<div className="activity-controls">
					<button
						className="restart-button"
						type="button"
						aria-label="Repetir consigna"
						onClick={() => speakPrompt(round.palabra)}
					>
						Repetir consigna
					</button>
				</div>
			)}
			{character && (
				<Character
					character={character}
					mouth={mouth}
					label={introPhase === "playing" ? "Escuchando bienvenida" : "Escuchar la consigna otra vez"}
					onClick={introPhase === "activity" ? () => speakPrompt(round.palabra) : undefined}
				/>
			)}
			<main className="pastel-scene" ref={sceneRef} aria-label="Actividad de formar palabras">
				<div className="pastel-drop-slots" aria-label="Huecos para las sílabas">
					{slots.map((optionId, index) => {
						const placedOption = round.opciones.find(({ id }) => id === optionId);
						return (
							<button
								className={`pastel-drop-slot${placedOption ? " filled" : ""}${selectedOption && !placedOption ? " can-select" : ""}`}
								key={index}
								type="button"
								aria-label={`Hueco ${index + 1}${placedOption ? `, sílaba ${placedOption.valor}` : `, va ${round.silabas[index]}`}`}
								onClick={() => selectedOption && placeOption(selectedOption, index)}
							>
								{placedOption ? (
									<span className="pastel-placed-token">
										<img src={placedOption.imagen} alt="" draggable={false} />
										<span>{placedOption.valor}</span>
									</span>
								) : (
									<span className="pastel-slot-hint" aria-hidden="true">
										{round.silabas[index]}
									</span>
								)}
							</button>
						);
					})}
				</div>
				<div className="pastel-options" aria-label="Sílabas disponibles">
					{round.opciones.map((option, index) => {
						const placed = slots.includes(option.id);
						return (
							<button
								className={`pastel-token${selectedOption === option.id ? " selected" : ""}`}
								key={`${round.palabra}-${option.id}`}
								type="button"
								aria-label={`Arrastrar sílaba ${option.valor}`}
								aria-pressed={selectedOption === option.id}
								disabled={placed}
								style={{
									visibility: drag?.optionId === option.id ? "hidden" : undefined
								}}
								onPointerDown={(event) => startDragging(event, option)}
								onClick={(event) => selectOption(option.id, option.valor, event)}
							>
								<img src={option.imagen} alt="" draggable={false} />
								<span>{option.valor}</span>
							</button>
						);
					})}
				</div>
				{drag && (
					<div
						className="pastel-token pastel-token-dragging"
						style={{
							left: `${drag.left}px`,
							top: `${drag.top}px`,
							width: `${drag.width}px`,
							height: `${drag.height}px`
						}}
						aria-hidden="true"
					>
						<img src={round.opciones.find(({ id }) => id === drag.optionId)?.imagen} alt="" draggable={false} />
						<span>{round.opciones.find(({ id }) => id === drag.optionId)?.valor}</span>
					</div>
				)}
			</main>
		</div>
	);
}
