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
import { sound } from "../lib/assets";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import "./actividad.css";
import "./Memotest.css";

const CARD_SETS = {
	a: ["A", "E", "I", "O", "U"],
	l: ["LA", "LE", "LI", "LO", "LU"],
	m: ["MA", "ME", "MI", "MO", "MU"],
	s: ["SA", "SE", "SI", "SO", "SU"],
	t: ["TA", "TE", "TI", "TO", "TU"],
};

const CONFETTI_COLORS = ["#f04f78", "#f6c945", "#55b96c", "#4d9ed8", "#9b6bd6", "#f08a36"];

function shuffleCards(values) {
	return [...values].sort(() => Math.random() - 0.5);
}

function buildDeck(mode) {
	const pool = CARD_SETS[mode] ?? CARD_SETS.a;
	const deck = pool.flatMap((value) => [
		{ id: `${value}-1`, value, matched: false, flipped: false },
		{ id: `${value}-2`, value, matched: false, flipped: false }
	]);

	return shuffleCards(deck).map((card, index) => ({
		...card,
		index,
		flipped: false,
		matched: false
	}));
}

function getAudioFileName(label) {
	if (label.length === 1) return `${label.toLowerCase()}.mp3`;
	if (["LA", "LE", "LI", "LO", "LU"].includes(label)) return `${label.toLowerCase()}.mp3`;
	if (["MA", "ME", "MI", "MO", "MU"].includes(label)) return `${label.toLowerCase()}.mp3`;
	if (label.startsWith("S")) return `${label}.mp3`;
	if (label === "TE") return "TE2.mp3";
	if (label.startsWith("T")) return `${label}.mp3`;
	return `${label.toLowerCase()}.wav`;
}

export default function Memotest() {
	usePageTitle("Memotest - Mundo 1");
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const selectedOption = useActivityMenuOption();
	const mode = CARD_SETS[selectedOption] ? selectedOption : "a";
	const [cards, setCards] = useState(() => buildDeck(mode));
	const [cardAudios] = useState(() =>
		Object.fromEntries(CARD_SETS[mode].map((label) => [label, runtime.audio(sound(getAudioFileName(label)), { preload: true })]))
	);
	const [selectedIndices, setSelectedIndices] = useState([]);
	const [moves, setMoves] = useState(0);
	const [matchedPairs, setMatchedPairs] = useState(0);
	const [premio, otorgarPremio] = useRecompensa("memotest", mode);
	const [celebrating, setCelebrating] = useState(false);
	// Todas las parejas encontradas: el cartel de felicitaciones queda hasta reiniciar.
	const [finished, setFinished] = useState(false);
	const activeCardAudio = useRef(null);
	const [celebrationAudio] = useState(() => runtime.audio(sound("Felicitaciones.mp3"), { preload: true }));
	const [successAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));

	function stopCardAudio() {
		const audio = activeCardAudio.current;
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		}
		activeCardAudio.current = null;
		stopTalking();
	}

	function playCardAudio(label) {
		stopCardAudio();
		successAudio.pause();
		successAudio.currentTime = 0;
		successAudio.onended = null;
		const audio = cardAudios[label];
		if (!audio) {
			return;
		}
		activeCardAudio.current = audio;
		startTalking();
		audio.onended = () => {
			audio.onended = null;
			if (activeCardAudio.current === audio) {
				activeCardAudio.current = null;
				stopTalking();
			}
		};
		audio.currentTime = 0;
		audio.play().catch(() => {
			audio.onended = null;
			if (activeCardAudio.current === audio) {
				activeCardAudio.current = null;
				stopTalking();
			}
		});
	}

	useEffect(() => {
		setCards(buildDeck(mode));
		setSelectedIndices([]);
		setMoves(0);
		setMatchedPairs(0);
		setCelebrating(false);
		setFinished(false);
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
		successAudio.pause();
		successAudio.currentTime = 0;
		stopCardAudio();
		stopTalking();
	}, [mode]);

	useEffect(() => {
		if (matchedPairs > 0 && matchedPairs === cards.length / 2) {
				const cantidad = moves <= 11 ? 3 : moves <= 16 ? 2 : 1;
				otorgarPremio(moves - matchedPairs, cantidad);
			setFinished(true);
			setCelebrating(true);
				stopCardAudio();
			startTalking();
			celebrationAudio.currentTime = 0;
			celebrationAudio.onended = () => {
				celebrationAudio.onended = null;
				stopTalking();
				setCelebrating(false);
			};
			celebrationAudio.play().catch(() => {
				celebrationAudio.onended = null;
				stopTalking();
				setCelebrating(false);
			});
		}
	}, [matchedPairs]);

	function resetGame() {
		setCards(buildDeck(mode));
		setSelectedIndices([]);
		setMoves(0);
		setMatchedPairs(0);
		setCelebrating(false);
		setFinished(false);
		stopCardAudio();
		celebrationAudio.onended = null;
		celebrationAudio.pause();
		celebrationAudio.currentTime = 0;
		successAudio.pause();
		successAudio.currentTime = 0;
		stopTalking();
	}

	function handleCardClick(index) {
		if (finished || selectedIndices.length === 2) {
			return;
		}

		const card = cards[index];
		if (!card || card.flipped || card.matched) {
			return;
		}
		playCardAudio(card.value);

		const nextSelection = [...selectedIndices, index];
		setCards((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, flipped: true } : item)));
		setSelectedIndices(nextSelection);

		if (nextSelection.length < 2) {
			return;
		}

		setMoves((current) => current + 1);
		const [firstIndex, secondIndex] = nextSelection;
		const firstCard = cards[firstIndex];
		const secondCard = cards[secondIndex];

		runtime.setTimeout(() => {
			if (firstCard.value === secondCard.value) {
				setCards((current) => current.map((item, itemIndex) => {
					if (itemIndex === firstIndex || itemIndex === secondIndex) {
						return { ...item, matched: true, flipped: true };
					}
					return item;
				}));
				setMatchedPairs((current) => current + 1);
				// La última pareja no suena "correcto": enseguida arranca la felicitación.
				if (matchedPairs + 1 === cards.length / 2) {
					setSelectedIndices([]);
					return;
				}
				startTalking();
				successAudio.currentTime = 0;
				successAudio.onended = () => {
					successAudio.onended = null;
					stopTalking();
				};
				successAudio.play().catch(() => {
					successAudio.onended = null;
					stopTalking();
				});
			} else {
				setCards((current) => current.map((item, itemIndex) => {
					if (itemIndex === firstIndex || itemIndex === secondIndex) {
						return { ...item, flipped: false };
					}
					return item;
				}));
			}
			setSelectedIndices([]);
		}, 550);
	}

	return (
		<div className="page activity-page page-memotest">
			<BackButton />
			<FullscreenButton toggle />

			<div className="activity-controls" aria-label="Controles del memotest">
				<button className="restart-button" type="button" aria-label="Reiniciar memotest" onClick={resetGame}>
					&#x21bb; Reiniciar
				</button>
			</div>

			<main className="memotest-container">
				<section className="memotest-board" aria-label="Tablero de memotest">
					{cards.map((card, index) => (
						<button
							key={card.id}
							type="button"
							className={`memory-card${card.flipped || card.matched ? " flipped" : ""}${card.matched ? " matched" : ""}`}
							onClick={() => handleCardClick(index)}
							aria-label={card.flipped || card.matched ? `Carta ${card.value}` : "Carta oculta"}
						>
							<span className="memory-card-inner">
								<span className="memory-card-front">?</span>
								<span className="memory-card-back">{card.value}</span>
							</span>
						</button>
					))}
				</section>
			</main>

			{finished && (
				<div className="memotest-finished" role="status">
					{celebrating && (
						<div className="memotest-confetti" aria-hidden="true">
							{Array.from({ length: 28 }, (_, index) => (
								<span
									key={index}
									style={{
										left: `${(index * 37) % 100}%`,
										animationDelay: `${(index % 7) * 80}ms`,
										background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
										transform: `rotate(${(index * 53) % 360}deg)`
									}}
								/>
							))}
						</div>
					)}
					<p className="memotest-finished-message">¡Felicitaciones!</p>
				</div>
			)}

			<Character character={character} mouth={mouth} celebrating={celebrating} />
			<PremioComida premio={premio} />
		</div>
	);
}
