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
import {
	audioPalabraPeluche,
	audioSonidoMundo1,
	imagenPeluche,
	imagenPelucheRespaldo,
	palabrasQueEmpiezanCon,
	sonidosDeLetra
} from "../lib/peluchesMundo1";
import "./actividad.css";
import "./Memotest.css";

// Letras del menú de Mundo 1 con memotest: la A juega con las vocales y el resto con sus sílabas.
const LETRAS_MEMOTEST = ["a", "l", "m", "s", "t"];

const CONFETTI_COLORS = ["#f04f78", "#f6c945", "#55b96c", "#4d9ed8", "#9b6bd6", "#f08a36"];

function shuffleCards(values) {
	return [...values].sort(() => Math.random() - 0.5);
}

function elegirAlAzar(lista) {
	return lista[Math.floor(Math.random() * lista.length)];
}

// Cada pareja: una carta con la vocal o sílaba escrita y otra con un dibujo de Peluches que empieza
// con ese sonido (A con ÁRBOL, LA con LANA...), elegido al azar en cada partida. La pareja se
// reconoce por el sonido (`value`), no por lo que muestra la carta.
function buildDeck(mode) {
	const deck = sonidosDeLetra(mode).flatMap((sonido) => {
		const value = sonido.toUpperCase();
		return [
			{ id: `${value}-texto`, value, palabra: null },
			{ id: `${value}-dibujo`, value, palabra: elegirAlAzar(palabrasQueEmpiezanCon(sonido)) }
		];
	});

	return shuffleCards(deck).map((card, index) => ({
		...card,
		index,
		flipped: false,
		matched: false
	}));
}

export default function Memotest() {
	usePageTitle("Memotest - Mundo 1");
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const selectedOption = useActivityMenuOption();
	const mode = LETRAS_MEMOTEST.includes(selectedOption) ? selectedOption : "a";
	const [cards, setCards] = useState(() => buildDeck(mode));
	// Audios de las cartas por archivo: la escrita dice su sonido y la del dibujo, la palabra.
	const cardAudios = useRef({});
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
	const [instructionAudio] = useState(() => runtime.audio(sound("memotestDibujos.mp3"), { preload: true }));

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

	function audioDeCarta(card) {
		const archivo = card.palabra ? audioPalabraPeluche(card.palabra) : audioSonidoMundo1(card.value);
		if (!cardAudios.current[archivo]) {
			cardAudios.current[archivo] = runtime.audio(sound(archivo), { preload: true });
		}
		return cardAudios.current[archivo];
	}

	function playCardAudio(card) {
		playVoice(audioDeCarta(card));
	}

	// Cada mazo nuevo trae otros dibujos: sus audios se piden antes de dar vuelta las cartas.
	useEffect(() => {
		cards.forEach(audioDeCarta);
	}, [cards]);

	// Consigna: al entrar y al tocar al personaje.
	function playInstruction() {
		playVoice(instructionAudio);
	}

	function playVoice(audio) {
		stopCardAudio();
		successAudio.pause();
		successAudio.currentTime = 0;
		successAudio.onended = null;
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
		const timer = runtime.setTimeout(playInstruction, 500);
		return () => runtime.clearTimeout(timer);
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
		playCardAudio(card);

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
		}, firstCard.value === secondCard.value ? 550 : 1500);
	}

	return (
		<div className="page activity-page page-memotest">
			<BackButton />
			<FullscreenButton toggle />

			<div className="activity-controls" aria-label="Controles del memotest">
				<button className="restart-button" type="button" aria-label="Reiniciar memotest" onClick={resetGame}>
					&#x21bb;
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
							aria-label={card.flipped || card.matched ? `Carta ${card.palabra ? `con el dibujo de ${card.palabra}` : card.value}` : "Carta oculta"}
						>
							<span className="memory-card-inner">
								<span className="memory-card-front">?</span>
								<span className={`memory-card-back${card.palabra ? " memory-card-dibujo" : ""}`}>
									{card.palabra ? (
										<img
											src={imagenPeluche(card.palabra)}
											alt=""
											draggable={false}
											onError={(event) => {
												const respaldo = imagenPelucheRespaldo(card.palabra);
												if (!event.currentTarget.src.endsWith(respaldo)) event.currentTarget.src = respaldo;
											}}
										/>
									) : card.value}
								</span>
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

			<Character character={character} mouth={mouth} celebrating={celebrating} label="Repetir consigna" onClick={playInstruction} />
			<PremioComida premio={premio} />
		</div>
	);
}
