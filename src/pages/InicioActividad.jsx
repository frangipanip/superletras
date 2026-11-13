import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, img, MUNDO1_CHARACTERS, MUNDO2_CHARACTER_FRAMES, MUNDO2_CHARACTERS, MUNDO2_MOUTH_IMAGES, MUNDO3_CHARACTERS, MUNDO3_MOUTH_IMAGES, MUNDO4_CHARACTERS, MUNDO4_MOUTH_IMAGES, sound } from "../lib/assets";
import { whenPageReady } from "../lib/pageGate";
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
const RR_SYLLABLES = ["RRA", "RRE", "RRI", "RRO", "RRU"];
const AR_SYLLABLES = ["ARA", "ERE", "IRI", "ORO", "URU"];
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

function createSyllableMode(letter, items, audioFiles = {}) {
	return {
		items,
		intro: [`Esta es la letra ${letter.toUpperCase()}.mp3`, "ConLasVocales.mp3"],
		prompt: "Pulsasilaba.mp3",
		longAudio: (item) => audioFiles[item] || `${item.toLowerCase()}.mp3`,
		shortAudio: (item) => audioFiles[item] || `${item.toLowerCase()}.mp3`,
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
	["rr", RR_SYLLABLES, { RRA: "rra.mp3", RRE: "rre.mp3", RRI: "rri.mp3", RRO: "rro.mp3", RRU: "rru.mp3" }],
	["ar", AR_SYLLABLES],
	["y", Y_SYLLABLES],
	["ll", LL_SYLLABLES]
].map(([letter, items, audioFiles]) => [letter, createSyllableMode(letter, items, audioFiles)]));
const MUNDO4_MODES = {
	c: { ...createSyllableMode("c", ["CA", "CO", "CU"]), intro: ["Esta es la letra C.mp3"] },
	ce: { ...createSyllableMode("ce", ["CE", "CI"]), intro: ["Esta es la letra CE.mp3"] },
	q: { ...createSyllableMode("q", ["QUE", "QUI"]), intro: ["Esta es la letra Q.mp3", "ConLasVocalesQ.mp3"] },
	z: createSyllableMode("z", ["ZA", "ZE", "ZI", "ZO", "ZU"]),
	ch: createSyllableMode("ch", ["CHA", "CHE", "CHI", "CHO", "CHU"])
};
const MUNDO4_Q_REVIEW_ITEMS = ["CA", "CO", "CU"];
const MUNDO4_Q_ROUND_ITEMS = ["QUE", "QUI", ...MUNDO4_Q_REVIEW_ITEMS];
const MUNDO4_Q_REVIEW_CLAM_MS = 6900;
const MUNDO4_Q_REVIEW_HOLD_MS = 900;
const MUNDO4_SHELLS = {
	c: { closed: "almejacerradaC.png", open: "almejaabiertaC.png" },
	ce: { closed: "almejacerradaCE.png", open: "almejaabiertaCE.png" },
	q: { closed: "almejacerradaQ .png", open: "almejaabiertaQ.png" },
	z: { closed: "almejacerradaZ.png", open: "almejaabiertaZ.png" },
	ch: { closed: "almejacerradaCH.png", open: "almejaabiertaCH.png" }
};
// Mundo 4: la almeja cae cerrada desde arriba y se abre al llegar (dura lo mismo que mundo4-almeja-cae).
const MUNDO4_CLAM_FALL_MS = 1100;
// Nubes de arena que levanta la almeja al golpear el piso. Medidas en anchos de almeja:
// x0 = desde dónde sale (respecto del centro de la base), x1/y1 = adónde llega, size = diámetro.
const MUNDO4_DUST_PUFFS = [
	{ x0: -0.3, x1: -0.85, y1: -0.12, size: 0.5, delay: 0 },
	{ x0: -0.25, x1: -0.6, y1: -0.3, size: 0.38, delay: 50 },
	{ x0: -0.15, x1: -0.35, y1: -0.42, size: 0.28, delay: 100 },
	{ x0: 0.3, x1: 0.85, y1: -0.12, size: 0.5, delay: 20 },
	{ x0: 0.25, x1: 0.6, y1: -0.3, size: 0.38, delay: 70 },
	{ x0: 0.15, x1: 0.35, y1: -0.42, size: 0.28, delay: 120 }
];
// Granitos de arena que saltan un poco más lejos que las nubes.
const MUNDO4_DUST_GRAINS = [
	{ x0: -0.3, x1: -0.75, y1: -0.5, size: 0.035, delay: 0 },
	{ x0: -0.2, x1: -1, y1: -0.25, size: 0.025, delay: 30 },
	{ x0: 0.3, x1: 0.8, y1: -0.45, size: 0.035, delay: 10 },
	{ x0: 0.2, x1: 1.05, y1: -0.22, size: 0.025, delay: 40 }
];
const MUNDO4_SYLLABLE_COLORS = ["#9338e4", "#ed55c6", "#ea8686", "#3bece6", "#32d87f"];
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
	const isMundo4 = location.state?.world === 4;
	usePageTitle(isMundo4 ? "Inicio - Mundo 4" : isMundo3 ? "Inicio - Mundo 3" : isMundo2 ? "Inicio - Mundo 2" : "Inicio - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const activityCharacters = isMundo1 ? MUNDO1_CHARACTERS : isMundo2 ? MUNDO2_CHARACTERS : isMundo3 ? MUNDO3_CHARACTERS : isMundo4 ? MUNDO4_CHARACTERS : CHARACTERS;
	const mouthImages = isMundo3 ? MUNDO3_MOUTH_IMAGES : isMundo2 ? MUNDO2_MOUTH_IMAGES : isMundo4 ? MUNDO4_MOUTH_IMAGES : undefined;
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const menuOption = useActivityMenuOption();
	const isMundo4Q = isMundo4 && menuOption === "q";
	const modeOptions = isMundo4 ? MUNDO4_MODES : isMundo3 ? MUNDO3_MODES : isMundo2 ? MUNDO2_MODES : MODES;
	const fallbackOption = isMundo4 ? "c" : isMundo3 ? "r" : isMundo2 ? "p" : "a";
	const [mode] = useState(() => modeOptions[menuOption || fallbackOption] || modeOptions[fallbackOption]);
	const [clamState, setClamState] = useState(() => ({
		src: isMundo4 ? img(MUNDO4_SHELLS[menuOption || fallbackOption].closed) : "",
		moved: false
	}));
	// "waiting" (escondida arriba hasta que la pantalla termina de cargar), "falling" o "landed".
	const [clamDrop, setClamDrop] = useState(isMundo4 ? "waiting" : "landed");
	const [audios] = useState(() => ({
		intro: mode.intro.map((file) => runtime.audio(sound(file), { preload: true })),
		pressure: runtime.audio(sound("Presion.mp3"), { preload: true }),
		shuffle: runtime.audio(sound("Mezclarvocales.mp3"), { preload: true }),
		movement: runtime.audio(sound("yahoraconmovimiento.mp3"), { preload: true }),
		itemPrompt: runtime.audio(sound(mode.prompt), { preload: true }),
		celebration: runtime.audio(sound("Felicitaciones.mp3"), { preload: true }),
		error: runtime.audio(sound("error.mp3"), { preload: true }),
		qReviewWellDone: isMundo4Q ? runtime.audio(sound("muybien.mp3"), { preload: true }) : null,
		qReview: isMundo4Q ? runtime.audio(sound("recordaQ.mp3"), { preload: true }) : null,
		qReviewItems: isMundo4Q ? Object.fromEntries(MUNDO4_Q_REVIEW_ITEMS.map((item) => [
			item,
			runtime.audio(sound(`${item.toLowerCase()}.mp3`), { preload: true })
		])) : {},
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
	const [reviewClamVisible, setReviewClamVisible] = useState(false);
	const [reviewClamArrived, setReviewClamArrived] = useState(false);
	const [reviewItems, setReviewItems] = useState([]);
	const [visibleItems, setVisibleItems] = useState(() => new Set());
	const [revealingItem, setRevealingItem] = useState(null);
	const [isPhaseTwo, setIsPhaseTwo] = useState(false);
	const [isPhaseThree, setIsPhaseThree] = useState(false);
	const sequenceTimer = useRef(0);
	const reviewClamTimer = useRef(0);
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
	const [premio, otorgarPremio] = useRecompensa("inicio", isMundo2 || isMundo3 || isMundo4 ? null : MODES[menuOption] ? menuOption : "a");
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
	// Mundo 3: el bloque cae del cielo al centro y se va a su lugar (atrás) cuando empiezan los carros.
	const bigLetterCentered = isMundo3 && showBigLetter && visibleItems.size === 0;

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
				if (isMundo4Q) {
					setItemOrder([]);
				}
				setShowConfetti(true);
				// La actividad se completa al terminar la fase 3 (carteles en movimiento).
				if (isPhaseThree && !isMundo2 && !isMundo3 && !isMundo4) {
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
		if (isMundo4) {
			setClamDrop("landed");
			setClamState({
				src: img(menuOption === "q" ? "almejaabiertaQU.png" : MUNDO4_SHELLS[menuOption].open),
				moved: true
			});
		}
		stopTalking();
	}

	function startPhaseThree() {
		setIsPhaseThree(true);
		setSelectedItems(new Set());
		setActivitySelectedItems(new Set());
		if (isMundo4Q) {
			setItemOrder(shuffle(MUNDO4_Q_ROUND_ITEMS));
			setVisibleItems(new Set(MUNDO4_Q_ROUND_ITEMS));
		}
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

	function startFirstRoundShuffle() {
		setIsPhaseTwo(true);
		startTalking();
		audios.shuffle.currentTime = 0;
		const startRequests = () => {
			const roundItems = isMundo4Q ? MUNDO4_Q_ROUND_ITEMS : mode.items;
			setSelectedItems(new Set());
			setItemOrder(shuffle(roundItems));
			if (isMundo4Q) {
				setVisibleItems(new Set(roundItems));
			}
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

	function playQReviewSyllable(index) {
		if (index >= MUNDO4_Q_REVIEW_ITEMS.length) {
			sequenceTimer.current = runtime.setTimeout(() => {
				setReviewItems([]);
				setItemOrder([]);
				startFirstRoundShuffle();
			}, MUNDO4_Q_REVIEW_HOLD_MS);
			return;
		}
		const item = MUNDO4_Q_REVIEW_ITEMS[index];
		const audio = audios.qReviewItems[item];
		setReviewItems((current) => [...current, item]);
		startTalking();
		audio.currentTime = 0;
		const finish = () => {
			audio.onended = null;
			stopTalking();
			playQReviewSyllable(index + 1);
		};
		audio.onended = finish;
		audio.play().catch(finish);
	}

	function playQReviewNarration() {
		setReviewClamVisible(true);
		setReviewClamArrived(false);
		const clamDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MUNDO4_Q_REVIEW_CLAM_MS;
		let narrationFinished = false;
		let clamArrived = false;
		const continueWhenReady = () => {
			if (!narrationFinished || !clamArrived) {
				return;
			}
			playQReviewSyllable(0);
		};
		const narration = audios.qReview;
		narration.currentTime = 0;
		startTalking();
		narration.onended = () => {
			narration.onended = null;
			narrationFinished = true;
			stopTalking();
			continueWhenReady();
		};
		narration.play().catch(() => {
			narration.onended = null;
			narrationFinished = true;
			stopTalking();
			continueWhenReady();
		});
		reviewClamTimer.current = runtime.setTimeout(() => {
			clamArrived = true;
			setReviewClamArrived(true);
			continueWhenReady();
		}, clamDuration ? clamDuration + 100 : 0);
	}

	function startQReview() {
		const wellDone = audios.qReviewWellDone;
		startTalking();
		wellDone.currentTime = 0;
		const continueWithRecall = () => {
			wellDone.onended = null;
			stopTalking();
			playQReviewNarration();
		};
		wellDone.onended = continueWithRecall;
		wellDone.play().catch(continueWithRecall);
	}

	function completeItemSelection() {
		allItemAudios().forEach((itemAudio) => {
			itemAudio.onended = null;
			itemAudio.pause();
			itemAudio.currentTime = 0;
		});
		setActiveItem(null);
		setIsShuffling(false);
		if (isMundo4Q) {
			setIsPhaseTwo(true);
			sequenceTimer.current = runtime.setTimeout(() => {
				setItemOrder([]);
				setSelectedItems(new Set());
				startQReview();
			}, 420);
			return;
		}
		startFirstRoundShuffle();
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
		setReviewClamVisible(false);
		setReviewClamArrived(false);
		setReviewItems([]);
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
			const isLastIntroStep = audios.intro.includes(step.audio) && step.audio === audios.intro[audios.intro.length - 1];
			if (isMundo4 && isLetterIntroStep) {
				setClamState({ src: img(MUNDO4_SHELLS[menuOption].open), moved: false });
			}
			if (isMundo4 && menuOption === "q" && step.audio === audios.intro[1]) {
				setClamState({ src: img("almejaabiertaQU.png"), moved: false });
			}
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
			function finishStep() {
				step.audio.onended = null;
				stopTalking();
				setActiveItem(null);
				if (isMundo4 && isLastIntroStep) {
					setClamState((current) => ({ ...current, moved: true }));
				}
				sequenceTimer.current = runtime.setTimeout(playNextStep, isMundo4 && isLastIntroStep ? 850 : 180);
			}
			step.audio.onended = () => {
				finishStep();
			};
			step.audio.play().catch(() => {
				finishStep();
			});
		}

		setShowBigLetter(false);
		setVisibleItems(new Set());
		setRevealingItem(null);
		let cancelClamDrop = () => {};
		if (isMundo4) {
			setClamState({ src: img(MUNDO4_SHELLS[menuOption].closed), moved: false });
			setClamDrop("waiting");
			// La almeja cae recién cuando se ve la pantalla; al llegar abajo se abre (primer paso).
			cancelClamDrop = whenPageReady(() => {
				if (!introductionActive.current) {
					return;
				}
				setClamDrop("falling");
				sequenceTimer.current = runtime.setTimeout(() => {
					setClamDrop("landed");
					playNextStep();
				}, MUNDO4_CLAM_FALL_MS);
			});
		} else {
			playNextStep();
		}
		return () => {
			cancelClamDrop();
			introductionActive.current = false;
			runtime.clearTimeout(sequenceTimer.current);
			runtime.clearTimeout(reviewClamTimer.current);
			runtime.clearTimeout(shuffleTimer.current);
			runtime.clearTimeout(revealTimer.current);
			runtime.clearTimeout(errorTimer.current);
			audios.error.pause();
			audios.error.currentTime = 0;
			if (isMundo4Q) {
				audios.qReviewWellDone.onended = null;
				audios.qReviewWellDone.pause();
				audios.qReviewWellDone.currentTime = 0;
				audios.qReview.onended = null;
				audios.qReview.pause();
				audios.qReview.currentTime = 0;
				Object.values(audios.qReviewItems).forEach((audio) => {
					audio.onended = null;
					audio.pause();
					audio.currentTime = 0;
				});
			}
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
	}, [audios, isMundo4, menuOption, modeOptions]);

	return (
		<div className={`page activity-page page-inicio-actividad${isMundo2 ? " world-insectos" : ""}${isMundo3 ? " world-bloques" : ""}${isMundo4 ? " world-almejas" : ""}`} onClick={skipIntroduction}>
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
								style={isMundo4 ? {
									"--mundo4-syllable-color": MUNDO4_SYLLABLE_COLORS[(isMundo4Q ? MUNDO4_Q_ROUND_ITEMS : mode.items).indexOf(item)],
									...(itemOrder.length < 5 ? {
										left: `${itemOrder.length === 2 ? 38 + itemOrder.indexOf(item) * 24 : 25 + itemOrder.indexOf(item) * 20}%`,
										top: itemOrder.length === 2 ? "42%" : "36%"
									} : {})
								} : undefined}
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
					{reviewItems.map((item, index) => (
						<div
							key={`review-${item}`}
							className={`inicio-vowel-button inicio-vowel-${item.toLowerCase()} review-balloon`}
							style={{
								"--mundo4-syllable-color": MUNDO4_SYLLABLE_COLORS[MUNDO4_Q_ROUND_ITEMS.indexOf(item)],
								left: `${25 + index * 20}%`,
								top: "42%"
							}}
							aria-hidden="true"
						>
							<span>{item}</span>
						</div>
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
				{isMundo4 && (
					<div className={`inicio-mundo4-clam${clamState.moved ? " is-small" : ""}${clamDrop !== "landed" ? ` is-${clamDrop}` : ""}${reviewClamVisible ? " is-q-review" : ""}`} aria-hidden="true">
						<img src={clamState.src} alt="" draggable={false} />
						{/* Envuelve a la almeja cuando sube (.is-small). */}
						<span className="inicio-mundo4-clam-bubble" />
					</div>
				)}
				{isMundo4Q && reviewClamVisible && (
					<div className={`inicio-mundo4-review-clam${reviewClamArrived ? "" : " is-entering"}`} aria-hidden="true">
						<img src={img("almejaabiertaC.png")} alt="" draggable={false} />
						<span className="inicio-mundo4-review-clam-bubble" />
					</div>
				)}
				{/* Polvo del golpe: se monta al empezar la caída y la animación espera al momento del golpe
				    (ver .inicio-mundo4-dust); queda montado e invisible hasta que la almeja sube. */}
				{isMundo4 && (clamDrop === "falling" || (clamDrop === "landed" && !clamState.moved)) && (
					<div className="inicio-mundo4-dust" aria-hidden="true">
						{[
							...MUNDO4_DUST_PUFFS.map((piece) => ({ ...piece, kind: "puff" })),
							...MUNDO4_DUST_GRAINS.map((piece) => ({ ...piece, kind: "grain" }))
						].map((piece, index) => (
							<span
								key={index}
								className={`inicio-mundo4-dust-${piece.kind}`}
								style={{
									"--x0": piece.x0,
									"--x1": piece.x1,
									"--y1": piece.y1,
									"--size": piece.size,
									"--delay": `${piece.delay}ms`
								}}
							/>
						))}
					</div>
				)}
				{!isMundo4 && <div
					className={`inicio-activity-letter-image-wrap${showBigLetter ? " is-visible" : ""}${bigLetterCentered ? " is-centered" : ""}`}
					aria-hidden="true"
				>
					<img className="inicio-activity-letter-image" src={bigLetterImage} alt={letterLabels[menuOption] || letterLabels[fallbackOption]} />
				</div>}
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
						className={`inicio-activity-mouth${isMundo2 ? " mundo2-mouth-frame" : isMundo3 ? " mundo3-mouth-frame" : isMundo4 ? " mundo4-mouth-frame" : !isMundo1 && mouth.shifted ? " shifted-mouth" : ""}`}
						src={mouth.src}
						alt=""
						hidden={!mouth.visible}
					/>
				</button>
			)}
		</div>
	);
}
