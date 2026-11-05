import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, img, MUNDO1_CHARACTERS, MUNDO2_CHARACTER_FRAMES, MUNDO2_CHARACTERS, MUNDO2_MOUTH_IMAGES, MUNDO3_CHARACTERS, MUNDO3_MOUTH_IMAGES, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useCarPhysics } from "../hooks/useCarPhysics";
import "./actividad.css";
import "./InicioActividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];
const L_SYLLABLES = ["LA", "LE", "LI", "LO", "LU"];
const M_SYLLABLES = ["MA", "ME", "MI", "MO", "MU"];
const S_SYLLABLES = ["SA", "SE", "SI", "SO", "SU"];
const T_SYLLABLES = ["TA", "TE", "TI", "TO", "TU"];
const P_SYLLABLES = ["PA", "PE", "PI", "PO", "PU"];
const N_SYLLABLES = ["NA", "NE", "NI", "NO", "NU"];
const D_SYLLABLES = ["DA", "DE", "DI", "DO", "DU"];
const F_SYLLABLES = ["FA", "FE", "FI", "FO", "FU"];
const H_SYLLABLES = ["HA", "HE", "HI", "HO", "HU"];
const R_SYLLABLES = ["RA", "RE", "RI", "RO", "RU"];
const RR_SYLLABLES = ["ARRA", "ARRE", "ARRI", "ARRO", "ARRU"];
const AR_SYLLABLES = ["ARA", "ARE", "ARI", "ARO", "ARU"];
const Y_SYLLABLES = ["YA", "YE", "YI", "YO", "YU"];
const LL_SYLLABLES = ["LLA", "LLE", "LLI", "LLO", "LLU"];
const CONFETTI_COLORS = ["#f04f78", "#f6c945", "#55b96c", "#4d9ed8", "#9b6bd6", "#f08a36"];

// Cada letra del menú de Mundo 1 trae su propia presentación: los carteles que se pulsan,
// los audios con los que arranca y la consigna con la que después se piden de a uno.
const MODES = {
	a: {
		items: VOWELS,
		intro: ["Esta es la letra A.mp3"],
		prompt: "Pulsavocal.mp3",
		longAudio: (item) => `${item.toLowerCase()}.mp3`,
		shortAudio: (item) => `${item.toLowerCase()}.mp3`,
		itemName: (item) => `vocal ${item}`,
		listName: "Vocales"
	},
	l: {
		items: L_SYLLABLES,
		intro: ["Esta es la letra L.mp3", "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => `${item.toLowerCase()}.mp3`,
		shortAudio: (item) => `${item.toLowerCase()}.mp3`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con L"
	},
	m: {
		items: M_SYLLABLES,
		intro: ["Esta es la letra M.mp3", "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => `${item.toLowerCase()}.mp3`,
		shortAudio: (item) => `${item.toLowerCase()}.mp3`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con M"
	},
	s: {
		items: S_SYLLABLES,
		intro: ["Esta es la letra S.mp3", "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => `${item}.mp3`,
		shortAudio: (item) => `${item}.mp3`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con S"
	},
	t: {
		items: T_SYLLABLES,
		intro: ["Esta es la letra T.mp3", "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => item === "TE" ? "te.mp3" : `${item}.mp3`,
		shortAudio: (item) => item === "TE" ? "te.mp3" : `${item}.mp3`,
		itemName: (item) => `sílaba ${item}`,
		listName: "Sílabas con T"
	}
};

function createSyllableMode(letter, items) {
	return {
		items,
		intro: [`Esta es la letra ${letter.toUpperCase()}.mp3`, "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => `${item.toLowerCase()}.mp3`,
		shortAudio: (item) => `${item.toLowerCase()}.mp3`,
		itemName: (item) => `sílaba ${item}`,
		listName: `Sílabas con ${letter.toUpperCase()}`
	};
}

const MUNDO2_MODES = {
	p: createSyllableMode("p", P_SYLLABLES),
	n: createSyllableMode("n", N_SYLLABLES),
	d: createSyllableMode("d", D_SYLLABLES),
	f: createSyllableMode("f", F_SYLLABLES),
	h: createSyllableMode("h", H_SYLLABLES)
};
const MUNDO3_MODES = Object.fromEntries([
	["r", R_SYLLABLES],
	["rr", RR_SYLLABLES],
	["ar", AR_SYLLABLES],
	["y", Y_SYLLABLES],
	["ll", LL_SYLLABLES]
].map(([letter, items]) => [letter, createSyllableMode(letter, items)]));
const MUNDO2_LETTER_IMAGES = {
	p: "letraP.png",
	n: "letraN.png",
	d: "letraD.png",
	f: "letraF.png",
	h: "letraH.png"
};
const MUNDO3_LETTER_IMAGES = {
	r: "bloqueR.png",
	rr: "bloqueRR.png",
	ar: "bloqueAR.png",
	y: "bloqueY.png",
	ll: "bloqueLL.png"
};
const MUNDO3_CAR_IMAGES = [1, 2, 3, 4, 5].map((car) => img(`carro${car}.png`));
// Bloques y plantas de fondoIniciobloques.png (1672x941) que están adelante o al borde del
// piso: los carros no pueden pasar por encima.
const MUNDO3_BACKGROUND_OBSTACLES = {
	width: 1672,
	height: 941,
	rects: [
		[0, 260, 100, 420],
		[1510, 330, 1672, 430],
		[0, 690, 135, 941],
		[0, 780, 300, 941],
		[0, 860, 440, 941],
		[1365, 815, 1672, 941],
		[1490, 700, 1672, 941]
	]
};
const MUNDO2_LETTER_LABELS = {
	p: "Letra P",
	n: "Letra N",
	d: "Letra D",
	f: "Letra F",
	h: "Letra H"
};
const MUNDO3_LETTER_LABELS = {
	r: "Letra R",
	rr: "Letra RR",
	ar: "Letra AR",
	y: "Letra Y",
	ll: "Letra LL"
};
const MUNDO2_INSECT_FRAMES = Object.fromEntries(["A", "E", "I", "O", "U"].map((vowel) => [
	vowel,
	[1, 2, 3].map((frame) => img(`mariquita${vowel}${frame}.png`))
]));

export default function InicioActividad() {
	const location = useLocation();
	const isMundo1 = location.state?.world === 1;
	const isMundo2 = location.state?.world === 2;
	const isMundo3 = location.state?.world === 3;
	usePageTitle(isMundo3 ? "Inicio - Mundo 3" : isMundo2 ? "Inicio - Mundo 2" : "Inicio - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const activityCharacters = isMundo1 ? MUNDO1_CHARACTERS : isMundo2 ? MUNDO2_CHARACTERS : isMundo3 ? MUNDO3_CHARACTERS : CHARACTERS;
	const mouthImages = isMundo3 ? MUNDO3_MOUTH_IMAGES : isMundo2 ? MUNDO2_MOUTH_IMAGES : undefined;
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const menuOption = useActivityMenuOption();
	const modeOptions = isMundo3 ? MUNDO3_MODES : isMundo2 ? MUNDO2_MODES : MODES;
	const fallbackOption = isMundo3 ? "r" : isMundo2 ? "p" : "a";
	const [mode] = useState(() => modeOptions[menuOption || fallbackOption] || modeOptions[fallbackOption]);
	const [audios] = useState(() => ({
		intro: mode.intro.map((file) => runtime.audio(sound(file), { preload: true })),
		pressure: runtime.audio(sound("Presion.mp3"), { preload: true }),
		shuffle: runtime.audio(sound("Mezclarvocales.mp3"), { preload: true }),
		movement: runtime.audio(sound("yahoraconmovimiento.mp3"), { preload: true }),
		itemPrompt: runtime.audio(sound(mode.prompt), { preload: true }),
		celebration: runtime.audio(sound("Felicitaciones.mp3"), { preload: true }),
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
	const [isPhaseThree, setIsPhaseThree] = useState(false);
	const sequenceTimer = useRef(0);
	const shuffleTimer = useRef(0);
	const errorTimer = useRef(0);
	const revealTimer = useRef(0);
	const introductionActive = useRef(false);
	const requestedItemIndex = useRef(0);
	// Carteles equivocados tocados al pedirlos (fases 2 y 3): definen cuántas comidas se ganan.
	const errorCount = useRef(0);
	// Mundo 3: en la fase 3 los carros manejan con física (chocan y rebotan sin pisarse).
	const carRefs = useRef(new Map());
	const characterRef = useRef(null);
	const leftCars = useRef(activitySelectedItems);
	leftCars.current = activitySelectedItems;
	const isDriving = isMundo3 && isPhaseThree && !isShuffling;
	useCarPhysics(runtime, { active: isDriving, itemRefs: carRefs, stoppedRef: leftCars, obstacleRefs: [characterRef], background: MUNDO3_BACKGROUND_OBSTACLES });
	const [premio, otorgarPremio] = useRecompensa("inicio", isMundo2 || isMundo3 ? null : MODES[menuOption] ? menuOption : "a");
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
	const letterImages = isMundo2 ? MUNDO2_LETTER_IMAGES : LETTER_IMAGES;
	const activityLetterImages = isMundo3 ? MUNDO3_LETTER_IMAGES : letterImages;
	const letterLabels = isMundo3 ? MUNDO3_LETTER_LABELS : isMundo2 ? MUNDO2_LETTER_LABELS : LETTER_LABELS;
	const bigLetterImage = img(activityLetterImages[menuOption] || activityLetterImages[fallbackOption]);

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

	function repeatInstruction() {
		if (introductionActive.current || isShuffling || showConfetti || visibleItems.size < mode.items.length) {
			return;
		}
		if (requestedItem) {
			playRequestedItem(requestedItem);
			return;
		}
		if (isPhaseTwo || isPhaseThree) {
			return;
		}
		stopShortAudios();
		startTalking();
		audios.pressure.currentTime = 0;
		audios.pressure.onended = () => {
			audios.pressure.onended = null;
			stopTalking();
		};
		audios.pressure.play().catch(() => {
			audios.pressure.onended = null;
			stopTalking();
		});
	}

	function handleItemPress(item) {
		if (isShuffling) {
			return;
		}
		if (isPhaseThree && !requestedItem) {
			return;
		}
		if (visibleItems.size < mode.items.length) {
			return;
		}
		if (selectedItems.has(item) || activitySelectedItems.has(item)) {
			return;
		}
		if (requestedItem) {
			if (item !== requestedItem) {
				errorCount.current += 1;
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
				// La actividad se completa al terminar la fase 3 (carteles en movimiento).
				if (isPhaseThree && !isMundo2 && !isMundo3) {
					otorgarPremio(errorCount.current);
				}
				audios.celebration.onended = () => {
					audios.celebration.onended = null;
					stopTalking();
					setShowConfetti(false);
					if (!isPhaseThree) {
						startPhaseThree();
					}
				};
				startTalking();
				audios.celebration.currentTime = 0;
				audios.celebration.play().catch(() => {
					stopTalking();
					setShowConfetti(false);
					if (!isPhaseThree) {
						startPhaseThree();
					}
				});
				return;
			}
			requestedItemIndex.current += 1;
			setRequestedItem(null);
			runtime.setTimeout(() => {
				const nextItem = mode.items[requestedItemIndex.current];
				setRequestedItem(nextItem);
				playRequestedItem(nextItem);
			}, 180);
			return;
		}
		playItem(item);
	}

	function revealItem(item) {
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

	function skipIntroduction(event) {
		if (!introductionActive.current || event.target.closest("button, a")) {
			return;
		}
		introductionActive.current = false;
		runtime.clearTimeout(sequenceTimer.current);
		runtime.clearTimeout(revealTimer.current);
		[...audios.intro, ...Object.values(audios.itemsLong), audios.pressure].forEach((audio) => {
			audio.onended = null;
			audio.ontimeupdate = null;
			audio.pause();
			audio.currentTime = 0;
		});
		setShowBigLetter(true);
		setVisibleItems(new Set(mode.items));
		setRevealingItem(null);
		setActiveItem(null);
		stopTalking();
	}

	function startPhaseThree() {
		setIsPhaseThree(true);
		setSelectedItems(new Set());
		setActivitySelectedItems(new Set());
		startTalking();
		audios.movement.currentTime = 0;
		const startRequests = () => {
			requestedItemIndex.current = 0;
			setRequestedItem(mode.items[0]);
			playRequestedItem(mode.items[0]);
		};
		audios.movement.onended = () => {
			audios.movement.onended = null;
			stopTalking();
			startRequests();
		};
		audios.movement.play().catch(() => {
			audios.movement.onended = null;
			stopTalking();
			startRequests();
		});
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
		if (!modeOptions[menuOption]) {
			return undefined;
		}
		introductionActive.current = true;
		// Presentación: primero los audios de la letra y después cada cartel con su audio largo.
		const steps = [
			...audios.intro.map((audio) => ({ audio, item: null })),
			...mode.items.map((item) => ({ audio: audios.itemsLong[item], item }))
		];
		let stepIndex = 0;

		function playNextStep() {
			if (stepIndex >= steps.length) {
				introductionActive.current = false;
				setShowBigLetter(true);
				setActiveItem(null);
				audios.pressure.currentTime = 0;
				audios.pressure.onended = () => {
					audios.pressure.onended = null;
					introductionActive.current = false;
					stopTalking();
				};
				startTalking();
				audios.pressure.play().catch(() => {
					introductionActive.current = false;
					stopTalking();
				});
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
				revealItem(step.item);
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
				sequenceTimer.current = runtime.setTimeout(playNextStep, 180);
			});
		}

		setShowBigLetter(false);
		setVisibleItems(new Set());
		setRevealingItem(null);
		playNextStep();
		return () => {
			introductionActive.current = false;
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
			audios.movement.onended = null;
			audios.movement.pause();
			audios.movement.currentTime = 0;
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
	}, [audios, menuOption, modeOptions]);

	return (
		<div className={`page activity-page page-inicio-actividad${isMundo2 ? " world-insectos" : ""}${isMundo3 ? " world-bloques" : ""}`} onClick={skipIntroduction}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="inicio-vowels inicio-syllables" aria-label={mode.listName}>
					{itemOrder.map((item) => {
						const isHidden = !visibleItems.has(item);
						const isRevealing = revealingItem === item;
						const isExploded = selectedItems.has(item) || activitySelectedItems.has(item);
						return (
							<div
								key={item}
								className={`inicio-vowel-button inicio-vowel-${item.toLowerCase()}${isExploded ? " selected" : ""}${activeItem === item ? " active" : ""}${incorrectItem === item ? " incorrect" : ""}${isShuffling ? " shuffling" : ""}${isHidden ? " hidden-balloon" : ""}${isRevealing ? " reveal-balloon" : ""}${isPhaseThree && !isShuffling && !activitySelectedItems.has(item) ? (isMundo3 ? " driving" : " flying") : ""}`}
								ref={(node) => {
									if (node) carRefs.current.set(item, node);
									else carRefs.current.delete(item);
								}}
								role="button"
								tabIndex={isExploded ? -1 : 0}
								aria-disabled={isExploded}
								aria-label={`Reproducir ${mode.itemName(item)}`}
								onClick={() => handleItemPress(item)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleItemPress(item);
									}
								}}
							>
								{isMundo2 && MUNDO2_INSECT_FRAMES[item.slice(-1)].map((src, frameIndex) => (
									<img key={src} className={`inicio-insect-frame inicio-insect-frame-${frameIndex + 1}`} src={src} alt="" draggable={false} />
								))}
								{isMundo3 && (
									<img className="inicio-car-image" src={MUNDO3_CAR_IMAGES[mode.items.indexOf(item)]} alt="" draggable={false} />
								)}
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
					<img className="inicio-activity-letter-image" src={bigLetterImage} alt={letterLabels[menuOption] || letterLabels[fallbackOption]} />
				</div>
			<PremioComida premio={premio} />
			{character && (
				<button ref={characterRef} className={`inicio-activity-character${isMundo1 ? " dulce-character" : ""}${isMundo2 ? " mundo2-flying-character" : ""}${isMundo3 ? " mundo3-block-character" : ""}`} type="button" aria-label="Repetir consigna" onClick={repeatInstruction}>
					{isMundo2 ? MUNDO2_CHARACTER_FRAMES[character].map((src, index) => (
						<img
							key={`${src}-${index}`}
							className={`inicio-mundo2-character-frame inicio-mundo2-character-frame-${index + 1}`}
							src={src}
							alt=""
							aria-hidden="true"
						/>
					)) : <img src={activityCharacters[character].image} alt={activityCharacters[character].alt} />}
					<img
						className={`inicio-activity-mouth${isMundo2 ? " mundo2-mouth-frame" : isMundo3 ? " mundo3-mouth-frame" : !isMundo1 && mouth.shifted ? " shifted-mouth" : ""}`}
						src={mouth.src}
						alt=""
						hidden={!mouth.visible}
					/>
				</button>
			)}
		</div>
	);
}
