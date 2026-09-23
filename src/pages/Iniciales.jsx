import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { img, preloadImages, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import { readMenuOption } from "../lib/storage";
import "./Iniciales.css";

// Banco de imágenes (public/assets/imagenes/peluches/<palabra>.webp). El nombre del archivo es la
// palabra: de ahí sale con qué vocal o sílaba empieza, así que no hay que renombrarlos.
const BANCO = [
	"avion", "frutilla", "arbol", "sol", "auto", "anillo",
	"elefante", "estrella", "escalera", "espejo", "escoba", "perro",
	"iguana", "iglu", "isla", "iman", "indio", "cartuchera",
	"oruga", "oveja", "ojo", "oreja", "oso", "guitarra",
	"uva", "uno", "unicornio", "uña", "urraca", "colectivo",
	"lana", "lapiz", "lago", "lata", "bebe", "mano",
	"leche", "leña", "lechuga", "leon", "limon", "libro",
	"licuadora", "linterna", "lila", "loro", "lobo", "tren"
];

const VOCALES = ["a", "e", "i", "o", "u"];
const SILABAS_L = ["la", "le", "li", "lo", "lu"];
// Cada consigna se pide dos veces (con imágenes distintas).
const VUELTAS = 2;
const CORRECT_ANIMATION_MS = 900;

function empiezaCon(palabra, consigna) {
	return palabra.startsWith(consigna);
}

function consignaAudio(consigna) {
	// Las vocales están como A.wav, E.wav...; las sílabas como la.wav, le.wav...
	return consigna.length === 1 ? `${consigna.toUpperCase()}.wav` : `${consigna}.wav`;
}

function crearRondas(letra) {
	// Con la L se piden sílabas; con cualquier otra letra, las vocales. Se saltean las
	// consignas que todavía no tienen imágenes en el banco.
	const consignas = (letra === "l" ? SILABAS_L : VOCALES).filter((consigna) =>
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
			const distractores = BANCO.filter((palabra) => !empiezaCon(palabra, consigna));
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

export default function Peluche() {
	usePageTitle("Peluche - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
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
	const activity = rondas[activityIndex];
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar la última ronda).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	const game = useRef({ errors: 0, rewarded: false, locked: false }).current;

	useEffect(() => {
		preloadImages(rondas.flatMap((ronda) => ronda.options.map((option) => optionImage(option.name))));
	}, [rondas]);

	useEffect(() => {
		Object.values(consignaAudios).forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		const instructionAudio = consignaAudios[activity.consigna];
		instructionAudio.currentTime = 0;
		instructionAudio.play().catch(() => {});
		return () => {
			instructionAudio.pause();
			instructionAudio.currentTime = 0;
		};
	}, [activity.consigna, consignaAudios]);

	function handleImageClick(option) {
		if (game.locked) {
			return;
		}

		if (option.correct) {
			game.locked = true;
			consignaAudios[activity.consigna].pause();
			correctAudio.pause();
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
			setAcertada(option.name);
			const esUltima = activityIndex === rondas.length - 1;
			if (esUltima && !game.rewarded) {
				game.rewarded = true;
				otorgarPremio(game.errors);
			}
			if (!esUltima) {
				runtime.setTimeout(() => {
					setActivityIndex((currentIndex) => currentIndex + 1);
					setAcertada(null);
					setVibrating(new Set());
					game.locked = false;
				}, CORRECT_ANIMATION_MS);
			}
			return;
		}

		game.errors += 1;
		errorAudio.pause();
		errorAudio.currentTime = 0;
		errorAudio.play().catch(() => {});
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
					{activity.options.map((option) => {
						const classNames = ["initials-option"];
						if (acertada === option.name) {
							classNames.push("correct");
						}
						if (vibrating.has(option.name)) {
							classNames.push("vibrating");
						}
						return (
							<button
								key={`${activityIndex}-${option.name}`}
								type="button"
								className={classNames.join(" ")}
								onClick={() => handleImageClick(option)}
								aria-label={option.name}
							>
								<img src={optionImage(option.name)} alt={option.name} />
							</button>
						);
					})}
				</section>
			</main>
			<Character character={character} />
			<PremioComida premio={premio} />
		</div>
	);
}
