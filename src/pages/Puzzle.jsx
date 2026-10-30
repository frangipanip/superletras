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
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./Puzzle.css";

const COOKIE_IMAGE = img("puzzleGalletita.png");
// Una base por largo de palabra: cada casillero de la base mide lo mismo que una galletita.
const BASE_IMAGES = { 3: img("puzzleBase3.png"), 4: img("puzzleBase4.png") };
const DROP_OVERLAP_MINIMO = 0.25;

function palabrasDeLetra(letra) {
	return GROUPS[Object.hasOwn(GROUPS, letra) ? letra : "l"].items;
}

// Las galletitas salen mezcladas; si quedan en el orden de la palabra se vuelve a mezclar.
function mezclarLetras(palabra) {
	const letras = [...palabra].map((valor, indice) => ({ id: `letra-${indice}`, valor }));
	let mezcladas = shuffle(letras);
	for (let intento = 0; intento < 5 && mezcladas.map(({ valor }) => valor).join("") === palabra; intento += 1) {
		mezcladas = shuffle(letras);
	}
	return mezcladas;
}

function crearRonda(palabra) {
	return { palabra, letras: [...palabra], galletitas: mezclarLetras(palabra) };
}

function crearActividad(letra, palabraAnterior) {
	let palabras = shuffle(palabrasDeLetra(letra));
	if (palabras.length > 1 && palabras[0] === palabraAnterior) {
		palabras = [...palabras.slice(1), palabras[0]];
	}
	return { palabras, indice: 0, ronda: crearRonda(palabras[0]) };
}

function siguienteActividad(letra, actual) {
	const indice = actual.indice + 1;
	if (indice >= actual.palabras.length) {
		return crearActividad(letra, actual.ronda.palabra);
	}
	return { palabras: actual.palabras, indice, ronda: crearRonda(actual.palabras[indice]) };
}

function casillerosVacios(ronda) {
	return ronda.letras.map(() => null);
}

export default function Puzzle() {
	usePageTitle("Puzzle");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const letter = Object.hasOwn(GROUPS, menuOption) ? menuOption : "l";
	const [activity, setActivity] = useState(() => crearActividad(letter));
	const { ronda: round } = activity;
	const [slots, setSlots] = useState(() => casillerosVacios(round));
	const [drag, setDrag] = useState(null);
	const [selectedCookie, setSelectedCookie] = useState(null);
	const sceneRef = useRef(null);
	const dragRef = useRef(null);
	const slotsRef = useRef(slots);
	const roundRef = useRef(round);
	const activityRef = useRef(activity);
	const letterRef = useRef(letter);
	const wordAudioRef = useRef(null);
	const wordAudioSequenceRef = useRef(0);
	const advanceTimerRef = useRef(null);
	const completionWatchdogRef = useRef(null);
	const suppressClickRef = useRef(false);
	roundRef.current = round;
	activityRef.current = activity;

	const stopWordAudio = useCallback(() => {
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

	// Por ahora la consigna es solo el audio de la palabra.
	const speakWord = useCallback((word, onFinished) => {
		stopWordAudio();
		const sequenceId = wordAudioSequenceRef.current;
		const audioName = `PL${word.toLowerCase()}.mp3`;
		const audio = runtime.audio(sound(audioName), { preload: true });
		wordAudioRef.current = audio;
		startTalking();
		audio.onended = () => {
			if (wordAudioSequenceRef.current !== sequenceId || wordAudioRef.current !== audio) return;
			wordAudioRef.current = null;
			stopTalking();
			onFinished?.();
		};
		audio.play().catch((error) => {
			if (wordAudioSequenceRef.current !== sequenceId || wordAudioRef.current !== audio) return;
			wordAudioRef.current = null;
			stopTalking();
			console.error(`No se pudo reproducir el audio ${audioName}.`, error);
			onFinished?.();
		});
	}, [runtime, startTalking, stopTalking, stopWordAudio]);

	function clearTimers() {
		if (advanceTimerRef.current !== null) {
			runtime.clearTimeout(advanceTimerRef.current);
			advanceTimerRef.current = null;
		}
		if (completionWatchdogRef.current !== null) {
			runtime.clearTimeout(completionWatchdogRef.current);
			completionWatchdogRef.current = null;
		}
	}

	function showActivity(nextActivity) {
		const nextSlots = casillerosVacios(nextActivity.ronda);
		activityRef.current = nextActivity;
		roundRef.current = nextActivity.ronda;
		slotsRef.current = nextSlots;
		dragRef.current = null;
		setActivity(nextActivity);
		setSlots(nextSlots);
		setDrag(null);
		setSelectedCookie(null);
	}

	useEffect(() => {
		if (letterRef.current === letter) return;
		letterRef.current = letter;
		clearTimers();
		showActivity(crearActividad(letter));
	}, [letter]);

	useEffect(() => {
		speakWord(round.palabra);
		return stopWordAudio;
	}, [round, speakWord, stopWordAudio]);

	useEffect(() => () => {
		if (advanceTimerRef.current !== null) {
			runtime.clearTimeout(advanceTimerRef.current);
		}
		if (completionWatchdogRef.current !== null) {
			runtime.clearTimeout(completionWatchdogRef.current);
		}
	}, [runtime]);

	function advanceRound() {
		if (completionWatchdogRef.current !== null) {
			runtime.clearTimeout(completionWatchdogRef.current);
			completionWatchdogRef.current = null;
		}
		if (advanceTimerRef.current !== null) return;
		advanceTimerRef.current = runtime.setTimeout(() => {
			advanceTimerRef.current = null;
			showActivity(siguienteActividad(letter, activityRef.current));
		}, 900);
	}

	// Una galletita entra solo en un casillero libre con su misma letra (si la palabra repite
	// una letra, cualquiera de las dos galletitas sirve).
	function placeCookie(cookieId, slotIndex) {
		if (slotsRef.current[slotIndex] !== null || slotsRef.current.includes(cookieId)) return false;
		const cookie = roundRef.current.galletitas.find(({ id }) => id === cookieId);
		if (!cookie || cookie.valor !== roundRef.current.letras[slotIndex]) return false;

		const nextSlots = slotsRef.current.map((current, index) => (index === slotIndex ? cookieId : current));
		slotsRef.current = nextSlots;
		setSlots(nextSlots);
		setSelectedCookie(null);
		if (nextSlots.every(Boolean)) {
			completionWatchdogRef.current = runtime.setTimeout(() => {
				completionWatchdogRef.current = null;
				advanceRound();
			}, 8000);
			speakWord(roundRef.current.palabra, advanceRound);
		}
		return true;
	}

	const placeCookieRef = useRef(placeCookie);
	placeCookieRef.current = placeCookie;

	function startDragging(event, cookie) {
		if (event.button !== 0 || slotsRef.current.includes(cookie.id)) return;
		const rect = event.currentTarget.getBoundingClientRect();
		dragRef.current = {
			pointerId: event.pointerId,
			cookieId: cookie.id,
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
			setSelectedCookie(current.cookieId);

			// Se prueba primero el casillero que más se superpone y, si la letra no va ahí,
			// los demás: así una letra repetida encaja aunque se suelte entre dos casilleros.
			const left = event.clientX - current.offsetX;
			const top = event.clientY - current.offsetY;
			const targets = [...(sceneRef.current?.querySelectorAll(".puzzle-slot") || [])]
				.map((target, index) => {
					const rect = target.getBoundingClientRect();
					const overlapWidth = Math.max(0, Math.min(left + current.width, rect.right) - Math.max(left, rect.left));
					const overlapHeight = Math.max(0, Math.min(top + current.height, rect.bottom) - Math.max(top, rect.top));
					return { index, overlap: overlapWidth * overlapHeight };
				})
				.filter(({ index, overlap }) => slotsRef.current[index] === null && overlap >= current.width * current.height * DROP_OVERLAP_MINIMO)
				.sort((a, b) => b.overlap - a.overlap);
			targets.some(({ index }) => placeCookieRef.current(current.cookieId, index));
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

	function selectCookie(cookieId) {
		if (suppressClickRef.current) {
			suppressClickRef.current = false;
			return;
		}
		setSelectedCookie(cookieId);
	}

	function restartActivity() {
		clearTimers();
		showActivity(crearActividad(letter, roundRef.current.palabra));
	}

	const draggedCookie = drag && round.galletitas.find(({ id }) => id === drag.cookieId);

	return (
		<div className="page activity-page page-puzzle" style={{ "--puzzle-letras": round.letras.length }}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={restartActivity}>
					&#x21bb; Reiniciar
				</button>
			</div>
			{character && (
				<div className="puzzle-character-wrap">
					<Character
						character={character}
						mouth={mouth}
						label="Escuchar la palabra otra vez"
						onClick={() => speakWord(round.palabra)}
					/>
				</div>
			)}
			<main className="puzzle-scene" ref={sceneRef} aria-label="Actividad de armar palabras con galletitas">
				<div className="puzzle-cookies" aria-label="Galletitas con letras">
					{round.galletitas.map((cookie, index) => {
						const placed = slots.includes(cookie.id);
						return (
							<button
								className={`puzzle-cookie${selectedCookie === cookie.id ? " selected" : ""}`}
								key={`${round.palabra}-${cookie.id}`}
								type="button"
								aria-label={`Arrastrar galletita ${cookie.valor}`}
								aria-pressed={selectedCookie === cookie.id}
								disabled={placed}
								style={{
									"--puzzle-indice": index,
									visibility: drag?.cookieId === cookie.id ? "hidden" : undefined
								}}
								onPointerDown={(event) => startDragging(event, cookie)}
								onClick={() => selectCookie(cookie.id)}
							>
								<span className="puzzle-cookie-float">
									<img src={COOKIE_IMAGE} alt="" draggable={false} />
									<span className="puzzle-cookie-letter">{cookie.valor}</span>
								</span>
							</button>
						);
					})}
				</div>
				<div className="puzzle-base">
					<img className="puzzle-base-image" src={BASE_IMAGES[round.letras.length]} alt="" draggable={false} />
					<div className="puzzle-slots" aria-label={`Base para la palabra ${round.palabra}`}>
						{round.letras.map((letra, index) => {
							const placedCookie = round.galletitas.find(({ id }) => id === slots[index]);
							return (
								<button
									className={`puzzle-slot${placedCookie ? " filled" : ""}${selectedCookie && !placedCookie ? " can-select" : ""}`}
									key={index}
									type="button"
									aria-label={`Casillero ${index + 1}, va la letra ${letra}`}
									style={{ "--puzzle-indice": index }}
									onClick={() => selectedCookie && placeCookie(selectedCookie, index)}
								>
									<span className={`puzzle-slot-letter${placedCookie ? " placed" : ""}`} aria-hidden="true">
										{letra}
									</span>
								</button>
							);
						})}
					</div>
				</div>
				{draggedCookie && (
					<div
						className="puzzle-cookie puzzle-cookie-dragging"
						style={{
							left: `${drag.left}px`,
							top: `${drag.top}px`,
							width: `${drag.width}px`,
							height: `${drag.height}px`
						}}
						aria-hidden="true"
					>
						<span className="puzzle-cookie-float">
							<img src={COOKIE_IMAGE} alt="" draggable={false} />
							<span className="puzzle-cookie-letter">{draggedCookie.valor}</span>
						</span>
					</div>
				)}
			</main>
		</div>
	);
}
