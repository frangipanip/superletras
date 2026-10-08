import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, preloadImages, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { readMenuOption } from "../lib/storage";
import "./Iniciales.css";

// Banco de imágenes (public/assets/imagenes/peluches/<palabra>.webp). El nombre del archivo es la
// palabra: de ahí sale con qué vocal o sílaba empieza, así que no hay que renombrarlos.
const BANCO = [
	"anillo", "arbol", "auto", "avion", "bebe", "cartuchera", "colectivo",
	"elefante", "escalera", "escoba", "espejo", "estrella", "frutilla",
	"guitarra", "iglu", "iguana", "iman", "indio", "isla",
	"lago", "lana", "lapiz", "lata", "leche", "lechuga", "leon", "leña",
	"libro", "licuadora", "lila", "limon", "linterna", "lobo", "loro",
	"luciernaga", "luna", "lupa", "luz",
	"mamadera", "mano", "mariposa", "martillo", "media", "megafono", "melon",
	"mesa", "microfono", "microondas", "miel", "milanesa", "mochila", "momia",
	"moneda", "mono", "moto", "mundo", "murcielago", "musica", "muñeca",
	"ojo", "oreja", "oruga", "oso", "oveja", "perro",
	"saco", "sal", "sandia", "sapo", "semaforo", "serpiente", "serrucho", "servilleta",
	"silbato", "silla", "sillon", "sirena", "soga", "sol", "sopa",
	"subibaja", "submarino", "superheroe", "suricata",
	"taco", "taladro", "tambor", "tapa", "taza", "techo", "tele", "telefono",
	"tenedor", "tesoro", "tiburon", "tijera", "timbre", "titere", "tiza", "toalla",
	"tomate", "toro", "torre", "torta", "tren", "tubo", "tucan", "tuerca", "tutu",
	"unicornio", "uno", "urraca", "uva", "uña"
];

const VOCALES = ["a", "e", "i", "o", "u"];
// Cada consigna se pide dos veces (con imágenes distintas).
const VUELTAS = 2;
const CORRECT_ANIMATION_MS = 900;

function empiezaCon(palabra, consigna) {
	return palabra.startsWith(consigna);
}

function consignaAudio(consigna) {
	if (consigna.length === 1) {
		return `${consigna.toLowerCase()}.mp3`;
	}
	const lower = consigna.toLowerCase();
	if (lower.startsWith("s")) {
		return `${consigna.toUpperCase()}.mp3`;
	}
	if (lower === "te") {
		return "te.mp3";
	}
	if (["la", "le", "li", "lo", "lu"].includes(lower)) {
		return `${lower}.mp3`;
	}
	if (["ma", "me", "mi", "mo", "mu"].includes(lower)) {
		return `${lower}.mp3`;
	}
	if (lower.startsWith("t")) {
		return `${consigna.toUpperCase()}.mp3`;
	}
	return `${lower}.wav`;
}

function crearRondas(letra) {
	// Con la A se piden vocales; con las consonantes, sílabas. Se saltean las
	// consignas que todavía no tienen imágenes en el banco.
	const opciones = letra === "a" ? VOCALES : VOCALES.map((v) => letra + v);
	const consignas = opciones.filter((consigna) =>
		BANCO.some((palabra) => empiezaCon(palabra, consigna))
	);
	const correctas = Object.fromEntries(
		consignas.map((consigna) => [consigna, shuffle(BANCO.filter((palabra) => empiezaCon(palabra, consigna)))])
	);
	const usadas = new Set();
	const rondas = [];
	for (let vuelta = 0; vuelta < VUELTAS; vuelta += 1) {
		consignas.forEach((consigna) => {
			const opcionesCorrectas = correctas[consigna];
			const correcta = opcionesCorrectas[vuelta % opcionesCorrectas.length];
			usadas.add(correcta);
			const distractores = BANCO.filter((palabra) => {
				const perteneceAlGrupo = letra === "a"
					? VOCALES.some((vocal) => empiezaCon(palabra, vocal))
					: empiezaCon(palabra, letra);
				return perteneceAlGrupo && !empiezaCon(palabra, consigna);
			});
			const noUsados = distractores.filter((palabra) => !usadas.has(palabra));
			const incorrecta = shuffle(noUsados.length ? noUsados : distractores)[0];
			usadas.add(incorrecta);
			rondas.push({
				consigna,
				options: shuffle([
					{ name: correcta, correct: true },
					{ name: incorrecta, correct: false }
				])
			});
		});
	}
	return rondas;
}

function optionImage(name) {
	return img(`peluches/${name}.webp`);
}

function wordAudioFile(name) {
	return `${name}PELUCHE.mp3`;
}

export default function Peluche() {
	usePageTitle("Peluche - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [letra] = useState(() => readMenuOption() || "a");
	const [rondas] = useState(() => crearRondas(letra));
	const [activityIndex, setActivityIndex] = useState(0);
	const [acertada, setAcertada] = useState(null);
	const [vibrating, setVibrating] = useState(() => new Set());
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3")));
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [consignaAudios] = useState(() =>
		Object.fromEntries(
			[...new Set(rondas.map((ronda) => ronda.consigna))].map((consigna) => [
				consigna,
				runtime.audio(sound(consignaAudio(consigna)), { preload: true })
			])
		)
	);
	const [wordAudios] = useState(() => {
		if (letra !== "a" && letra !== "l") {
			return {};
		}
		const words = [...new Set(rondas.flatMap((ronda) => ronda.options.map((option) => option.name)))];
		return Object.fromEntries(
			words
				.map((name) => [name, runtime.audio(sound(`peluche/${wordAudioFile(name)}`), { preload: true })])
		);
	});
	const [instructionAudio] = useState(() => runtime.audio(sound("Pulsaeldibujo.mp3"), { preload: true }));
	const [helpAudio] = useState(() => runtime.audio(sound("apetaeltexto.mp3"), { preload: true }));
	const sequenceToken = useRef(0);
	const activity = rondas[activityIndex];
	const largoResaltado = letra === "a" ? 1 : 2;
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar la última ronda).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	const game = useRef({ errors: 0, rewarded: false, locked: false }).current;

	useEffect(() => {
		preloadImages(rondas.flatMap((ronda) => ronda.options.map((option) => optionImage(option.name))));
	}, [rondas]);

	function playInstruction() {
		window.speechSynthesis?.cancel();
		const token = sequenceToken.current + 1;
		sequenceToken.current = token;
		const targetAudio = consignaAudios[activity.consigna];
		const sequence = [targetAudio, instructionAudio, targetAudio, helpAudio];
		sequence.forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
		startTalking();

		function playNext(index) {
			if (token !== sequenceToken.current) {
				return;
			}
			if (index === sequence.length) {
				stopTalking();
				return;
			}
			const audio = sequence[index];
			let advanced = false;
			const advance = () => {
				if (advanced) {
					return;
				}
				advanced = true;
				audio.onended = null;
				playNext(index + 1);
			};
			audio.currentTime = 0;
			audio.onended = advance;
			audio.play().catch(advance);
		}

		playNext(0);
	}

	function stopInstructionSequence() {
		sequenceToken.current += 1;
		[...Object.values(consignaAudios), ...Object.values(wordAudios), instructionAudio, helpAudio].forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
		window.speechSynthesis?.cancel();
		stopTalking();
	}

	function playWordName(name, onEnd) {
		stopInstructionSequence();
		const wordAudio = wordAudios[name];
		if (wordAudio) {
			let completed = false;
			const finish = () => {
				if (completed) {
					return;
				}
				completed = true;
				wordAudio.onended = null;
				stopTalking();
				onEnd?.();
			};
			wordAudio.currentTime = 0;
			wordAudio.onended = finish;
			startTalking();
			wordAudio.play().catch(finish);
			return;
		}
		if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
			onEnd?.();
			return;
		}
		const utterance = new SpeechSynthesisUtterance(name);
		utterance.lang = "es-AR";
		if (onEnd) {
			let completed = false;
			const finish = () => {
				if (completed) {
					return;
				}
				completed = true;
				onEnd();
			};
			utterance.onend = finish;
			utterance.onerror = finish;
		}
		window.speechSynthesis.speak(utterance);
	}

	useEffect(() => {
		playInstruction();
		return stopInstructionSequence;
	}, [activity.consigna, consignaAudios, helpAudio, instructionAudio]);

	function handleImageClick(option) {
		if (game.locked) {
			return;
		}

		if (option.correct) {
			game.locked = true;
			setAcertada(option.name);
			const esUltima = activityIndex === rondas.length - 1;
			if (esUltima && !game.rewarded) {
				game.rewarded = true;
				otorgarPremio(game.errors);
			}
			playWordName(option.name, () => {
				correctAudio.pause();
				correctAudio.currentTime = 0;
				correctAudio.play().catch(() => {});
				if (!esUltima) {
					runtime.setTimeout(() => {
						setActivityIndex((currentIndex) => currentIndex + 1);
						setAcertada(null);
						setVibrating(new Set());
						game.locked = false;
					}, CORRECT_ANIMATION_MS);
				}
			});
			return;
		}

		playWordName(option.name, () => {
			errorAudio.pause();
			errorAudio.currentTime = 0;
			errorAudio.play().catch(() => {});
		});
		game.errors += 1;
		setVibrating((current) => new Set(current).add(option.name));
		runtime.setTimeout(() => {
			setVibrating((current) => {
				const next = new Set(current);
				next.delete(option.name);
				return next;
			});
		}, 350);
	}

	return (
		<div className="page activity-page page-peluche">
			<BackButton />
			<FullscreenButton toggle />
			<main className="initials-activity">
				<section className="initials-grid" aria-label="Imágenes para elegir">
					{activity.options.map((option, optionIndex) => {
						const classNames = ["initials-option"];
						if (acertada === option.name) {
							classNames.push("correct");
						}
						if (vibrating.has(option.name)) {
							classNames.push("vibrating");
						}
						return (
							<div className="initials-item" key={`${activityIndex}-${option.name}`}>
								<button
									type="button"
									className={classNames.join(" ")}
									onClick={() => handleImageClick(option)}
									aria-label={option.name}
								>
									<img src={optionImage(option.name)} alt={option.name} />
								</button>
								<button
									type="button"
									className={`initials-name color-${(activityIndex * 2 + optionIndex) % 4}`}
									onClick={() => playWordName(option.name)}
								>
									<>
										<span className="requested-sound">{option.name.slice(0, largoResaltado)}</span>
										{option.name.slice(largoResaltado)}
									</>
								</button>
							</div>
						);
					})}
				</section>
			</main>
			<Character character={character} mouth={mouth} onClick={playInstruction} label="Repetir audio" />
			<PremioComida premio={premio} />
		</div>
	);
}
