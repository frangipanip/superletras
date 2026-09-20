import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, img, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { STORAGE_KEYS, readStorage } from "../lib/storage";
import "./actividad.css";
import "./InicioActividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const L_SYLLABLES = ["LA", "LE", "LI", "LO", "LU"];
const M_SYLLABLES = ["MA", "ME", "MI", "MO", "MU"];
const S_SYLLABLES = ["SA", "SE", "SI", "SO", "SU"];
const T_SYLLABLES = ["TA", "TE", "TI", "TO", "TU"];
const CONFETTI_COLORS = ["#f04f78", "#f6c945", "#55b96c", "#4d9ed8", "#9b6bd6", "#f08a36"];

// Cada letra del menú de Mundo 1 trae su propia presentación: los carteles que se pulsan,
// los audios con los que arranca y la consigna con la que después se piden de a uno.
const MODES = {
	a: {
		items: VOWELS,
		intro: ["SilabasA.m4a"],
		prompt: "Pulsavocal.m4a",
		longAudio: (item) => `${item}largo.m4a`,
		shortAudio: (item) => `${item}.wav`,
		itemName: (item) => `vocal ${item}`,
		listName: "Vocales"
	},
	l: {
		items: L_SYLLABLES,
		intro: ["EstaEsLaLetra.m4a", "Ele.m4a", "ConLasVocales.m4a"],
		prompt: "Pulsa silaba.m4a",
		longAudio: (item) => `${item}largo.m4a`,
		shortAudio: (item) => `${item.toLowerCase()}.wav`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con L"
	},
	m: {
		items: M_SYLLABLES,
		intro: ["EstaEsLaLetra.m4a", "Eme.m4a", "ConLasVocales.m4a"],
		prompt: "Pulsa silaba.m4a",
		longAudio: (item) => `${item.toLowerCase()}.wav`,
		shortAudio: (item) => `${item.toLowerCase()}.wav`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con M"
	},
	s: {
		items: S_SYLLABLES,
		intro: ["EstaEsLaLetra.m4a", "Ese.m4a", "ConLasVocales.m4a"],
		prompt: "Pulsa silaba.m4a",
		longAudio: (item) => `${item}.m4a`,
		shortAudio: (item) => `${item}.m4a`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con S"
	},
	t: {
		items: T_SYLLABLES,
		intro: ["EstaEsLaLetra.m4a", "TE2.m4a", "ConLasVocales.m4a"],
		prompt: "Pulsa silaba.m4a",
		longAudio: (item) => `${item === "TE" ? "TE2" : item}.m4a`,
		shortAudio: (item) => `${item === "TE" ? "TE2" : item}.m4a`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con T"
	}
};

export default function InicioActividad() {
	usePageTitle("Inicio - Mundo 1");
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = location.state?.menuOption || readStorage(STORAGE_KEYS.mundo1MenuOption) || "a";
	const [mode] = useState(() => MODES[menuOption] || MODES.a);
	const [audios] = useState(() => ({
		intro: mode.intro.map((file) => runtime.audio(sound(file), { preload: true })),
		pressure: runtime.audio(sound("Presion.m4a"), { preload: true }),
		shuffle: runtime.audio(sound("Mezclarvocales.m4a"), { preload: true }),
		itemPrompt: runtime.audio(sound(mode.prompt), { preload: true }),
		celebration: runtime.audio(sound("Felicitaciones.m4a"), { preload: true }),
		error: runtime.audio(sound("error.mp3"), { preload: true }),
		itemsLong: Object.fromEntries(mode.items.map((item) => [item, runtime.audio(sound(mode.longAudio(item)), { preload: true })])),
		itemsShort: Object.fromEntries(mode.items.map((item) => [item, runtime.audio(sound(mode.shortAudio(item)), { preload: true })]))
	}));
	const [activeItem, setActiveItem] = useState(null);
	const [selectedItems, setSelectedItems] = useState(() => new Set());
	const [activitySelectedItems, setActivitySelectedItems] = useState(() => new Set());
	const [itemOrder, setItemOrder] = useState(mode.items);
	const [isShuffling, setIsShuffling] = useState(false);
	const [requestedItem, setRequestedItem] = useState(null);
	const [incorrectItem, setIncorrectItem] = useState(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const [showBigLetter, setShowBigLetter] = useState(false);
	const [visibleItems, setVisibleItems] = useState(() => new Set());
	const [revealingItem, setRevealingItem] = useState(null);
	const [isPhaseTwo, setIsPhaseTwo] = useState(false);
	const sequenceTimer = useRef(0);
	const shuffleTimer = useRef(0);
	const errorTimer = useRef(0);
	const revealTimer = useRef(0);
	const requestedItemIndex = useRef(0);
	const LETTER_IMAGES = {
		a: "letraA.png",
		l: "letraL.png",
		m: "letraM.png",
		s: "letraS.png",
		t: "letraT.png"
	};
	const LETTER_LABELS = {
		a: "Letra A",
		l: "Letra L",
		m: "Letra M",
		s: "Letra S",
		t: "Letra T"
	};
	const bigLetterImage = img(LETTER_IMAGES[menuOption] || "letraA.png");

	function allItemAudios() {
		return [...Object.values(audios.itemsLong), ...Object.values(audios.itemsShort)];
	}

	function stopShortAudios() {
		audios.itemPrompt.onended = null;
		audios.itemPrompt.pause();
		audios.itemPrompt.currentTime = 0;
		Object.values(audios.itemsShort).forEach((itemAudio) => {
			itemAudio.onended = null;
			itemAudio.pause();
			itemAudio.currentTime = 0;
		});
	}

	function playRequestedItem(item) {
		stopShortAudios();
		const itemAudio = audios.itemsShort[item];
		setActiveItem(null);
		startTalking();
		audios.itemPrompt.onended = () => {
			audios.itemPrompt.onended = null;
			itemAudio.currentTime = 0;
			itemAudio.onended = () => {
				itemAudio.onended = null;
				setActiveItem(null);
				stopTalking();
			};
			itemAudio.play().catch(() => {
				itemAudio.onended = null;
				setActiveItem(null);
				stopTalking();
			});
		};
		audios.itemPrompt.currentTime = 0;
		audios.itemPrompt.play().catch(() => {
			audios.itemPrompt.onended = null;
			setActiveItem(null);
			stopTalking();
		});
	}

	function handleItemPress(item) {
		if (visibleItems.size < mode.items.length) {
			return;
		}
		if (requestedItem) {
			if (item !== requestedItem) {
				runtime.clearTimeout(errorTimer.current);
				setIncorrectItem(item);
				audios.error.currentTime = 0;
				audios.error.play().catch(() => {});
				errorTimer.current = runtime.setTimeout(() => setIncorrectItem(null), 500);
				return;
			}
			stopShortAudios();
			setIncorrectItem(null);
			setActivitySelectedItems((current) => new Set(current).add(item));
			setActiveItem(item);
			stopTalking();
			if (requestedItemIndex.current >= mode.items.length - 1) {
				setRequestedItem(null);
				setActiveItem(null);
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
			requestedItemIndex.current += 1;
			runtime.setTimeout(() => {
				const nextItem = mode.items[requestedItemIndex.current];
				setRequestedItem(nextItem);
				playRequestedItem(nextItem);
			}, 180);
			return;
		}
		playItem(item);
	}

	function revealBalloon(item) {
		setVisibleItems((current) => {
			if (current.has(item)) return current;
			const next = new Set(current);
			next.add(item);
			return next;
		});
		setRevealingItem(item);
		runtime.clearTimeout(revealTimer.current);
		revealTimer.current = runtime.setTimeout(() => setRevealingItem(null), 550);
	}

	function completeItemSelection() {
		allItemAudios().forEach((itemAudio) => {
			itemAudio.onended = null;
			itemAudio.pause();
			itemAudio.currentTime = 0;
		});
		setActiveItem(null);
		setIsShuffling(false);
		setIsPhaseTwo(true);
		startTalking();
		audios.shuffle.currentTime = 0;
		const startRequests = () => {
			setSelectedItems(new Set());
			setItemOrder(shuffle(mode.items));
			setIsShuffling(true);
			shuffleTimer.current = runtime.setTimeout(() => {
				setIsShuffling(false);
				requestedItemIndex.current = 0;
				setActivitySelectedItems(new Set());
				setRequestedItem(mode.items[0]);
				playRequestedItem(mode.items[0]);
			}, 1200);
		};
		audios.shuffle.onended = () => {
			audios.shuffle.onended = null;
			stopTalking();
			startRequests();
		};
		audios.shuffle.play().catch(() => {
			audios.shuffle.onended = null;
			stopTalking();
			startRequests();
		});
	}

	function playItem(item) {
		runtime.clearTimeout(sequenceTimer.current);
		audios.intro.forEach((introAudio) => {
			introAudio.onended = null;
			introAudio.pause();
		});
		audios.pressure.onended = null;
		audios.pressure.pause();
		allItemAudios().forEach((itemAudio) => {
			itemAudio.onended = null;
			itemAudio.pause();
			itemAudio.currentTime = 0;
		});
		const itemAudio = audios.itemsShort[item];
		setSelectedItems((current) => {
			if (current.has(item)) {
				return current;
			}
			const next = new Set(current);
			next.add(item);
			return next;
		});
		setActiveItem(item);
		startTalking();
		itemAudio.onended = () => {
			itemAudio.onended = null;
			setActiveItem(null);
			stopTalking();
		};
		itemAudio.play().catch(() => {
			itemAudio.onended = null;
			setActiveItem(null);
			stopTalking();
		});
	}

	useEffect(() => {
		if (selectedItems.size === mode.items.length && activeItem === null) {
			completeItemSelection();
		}
	}, [selectedItems, activeItem]);

	useEffect(() => {
		if (!MODES[menuOption]) {
			return undefined;
		}
		// Presentación: primero los audios de la letra y después cada cartel con su audio largo.
		const steps = [
			...audios.intro.map((audio) => ({ audio, item: null })),
			...mode.items.map((item) => ({ audio: audios.itemsLong[item], item }))
		];
		let stepIndex = 0;

		function playNextStep() {
			if (stepIndex >= steps.length) {
				setShowBigLetter(true);
				setActiveItem(null);
				audios.pressure.currentTime = 0;
				audios.pressure.onended = stopTalking;
				startTalking();
				audios.pressure.play().catch(stopTalking);
				return;
			}
			const step = steps[stepIndex];
			stepIndex += 1;
			const isLetterIntroStep = step.audio === audios.intro[0];
			if (isLetterIntroStep) {
				const introAudio = step.audio;
				introAudio.ontimeupdate = () => {
					if (introAudio.duration > 0 && introAudio.currentTime >= introAudio.duration * 0.05) {
						setShowBigLetter(true);
						introAudio.ontimeupdate = null;
					}
				};
			}
			// Revelar el globo justo antes de reproducir su audio
			if (step.item) {
				revealBalloon(step.item);
			}
			setActiveItem(step.item);
			startTalking();
			step.audio.currentTime = 0;
			step.audio.onended = () => {
				step.audio.onended = null;
				stopTalking();
				setActiveItem(null);
				sequenceTimer.current = runtime.setTimeout(playNextStep, 180);
			};
			step.audio.play().catch(() => {
				step.audio.onended = null;
				stopTalking();
				setActiveItem(null);
			});
		}

		setShowBigLetter(false);
		setVisibleItems(new Set());
		playNextStep();
		return () => {
			runtime.clearTimeout(sequenceTimer.current);
			runtime.clearTimeout(shuffleTimer.current);
			runtime.clearTimeout(revealTimer.current);
			runtime.clearTimeout(errorTimer.current);
			audios.error.pause();
			audios.error.currentTime = 0;
			setShowConfetti(false);
			audios.celebration.onended = null;
			audios.celebration.pause();
			audios.celebration.currentTime = 0;
			audios.shuffle.onended = null;
			audios.shuffle.pause();
			audios.shuffle.currentTime = 0;
			stopShortAudios();
			audios.intro.forEach((introAudio) => {
				introAudio.onended = null;
				introAudio.pause();
				introAudio.currentTime = 0;
			});
			audios.pressure.onended = null;
			audios.pressure.pause();
			audios.pressure.currentTime = 0;
			allItemAudios().forEach((itemAudio) => {
				itemAudio.onended = null;
				itemAudio.pause();
				itemAudio.currentTime = 0;
			});
			setActiveItem(null);
			stopTalking();
		};
	}, [audios, menuOption]);

	return (
		<div className="page activity-page page-inicio-actividad">
			<BackButton />
			<FullscreenButton toggle />
			<div className="inicio-vowels inicio-syllables" aria-label={mode.listName}>
					{itemOrder.map((item) => {
						const isHidden = !visibleItems.has(item);
						const isRevealing = revealingItem === item;
						return (
							<div
								key={item}
								className={`inicio-vowel-button inicio-vowel-${item.toLowerCase()}${selectedItems.has(item) || activitySelectedItems.has(item) ? " selected" : ""}${activeItem === item ? " active" : ""}${incorrectItem === item ? " incorrect" : ""}${isShuffling ? " shuffling" : ""}${isHidden ? " hidden-balloon" : ""}${isRevealing ? " reveal-balloon" : ""}${isPhaseTwo && !isShuffling && !activitySelectedItems.has(item) ? " flying" : ""}`}
								role="button"
								tabIndex={0}
								aria-label={`Reproducir ${mode.itemName(item)}`}
								onClick={() => handleItemPress(item)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleItemPress(item);
									}
								}}
							>
								<span>{item}</span>
							</div>
						);
					})}
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
				<div
					className={`inicio-activity-letter-image-wrap${showBigLetter ? " is-visible" : ""}`}
					aria-hidden="true"
				>
					<img className="inicio-activity-letter-image" src={bigLetterImage} alt={LETTER_LABELS[menuOption] || "Letra A"} />
				</div>
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
		</div>
	);
}
