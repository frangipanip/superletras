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
import { useAyudaError } from "../hooks/useAyudaError";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import "./actividad.css";
import "./Iniciales.css";

// El nombre del archivo coincide con la palabra, que se usa para formar la consigna.
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
		// Orden mezclado en cada vuelta (si no, siempre era A, E, I, O, U y se acertaba de memoria),
		// sin repetir el mismo sonido entre el final de una vuelta y el comienzo de la otra.
		let orden = shuffle(consignas);
		if (orden.length > 1 && orden[0] === rondas[rondas.length - 1]?.consigna) {
			orden = [...orden.slice(1), orden[0]];
		}
		orden.forEach((consigna) => {
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
			// La segunda vuelta muestra tres dibujos (uno correcto y dos que empiezan distinto).
			const cantidadIncorrectas = vuelta === 0 ? 1 : 2;
			const incorrectas = shuffle(noUsados.length >= cantidadIncorrectas ? noUsados : distractores).slice(0, cantidadIncorrectas);
			incorrectas.forEach((palabra) => usadas.add(palabra));
			rondas.push({
				consigna,
				options: shuffle([
					{ name: correcta, correct: true },
					...incorrectas.map((name) => ({ name, correct: false }))
				])
			});
		});
	}
	return rondas;
}

function optionImage(name) {
	return img(`peluches/${name}.png`);
}

function wordAudioFile(name) {
	const usaAudioPeluche = /^[aeioul]/.test(name) ||
		["mamadera", "mano", "mariposa", "martillo", "media", "megafono"].includes(name);
	return `${name}${usaAudioPeluche ? "PELUCHE" : ""}.mp3`;
}

export default function Peluche() {
	usePageTitle("Peluche - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	// Una opción guardada que no es una letra de Mundo 1 (por ejemplo "palabras") dejaba la pantalla en blanco.
	const [letra] = useState(() => (["a", "l", "m", "s", "t"].includes(readMenuOption()) ? readMenuOption() : "a"));
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
		const words = [...new Set(rondas.flatMap((ronda) => ronda.options.map((option) => option.name)))];
		return Object.fromEntries(
			words
				.map((name) => [name, runtime.audio(sound(`peluche/${wordAudioFile(name)}`), { preload: true })])
		);
	});
	const [instructionAudio] = useState(() => runtime.audio(sound("Pulsaeldibujo.mp3"), { preload: true }));
	const [helpAudio] = useState(() => runtime.audio(sound("apetaeltexto.mp3"), { preload: true }));
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const activity = rondas[activityIndex];
	const largoResaltado = letra === "a" ? 1 : 2;
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar la última ronda).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	const game = useRef({ errors: 0, rewarded: false, locked: false }).current;

	useEffect(() => {
		preloadImages(rondas.flatMap((ronda) => ronda.options.flatMap((option) => [
			optionImage(option.name),
			img(`peluches/${option.name}.webp`)
		])));
	}, [rondas]);

	// Al aparecer se nombran los dibujos (algunos se confunden: colectivo/micro); después la consigna:
	// sonido + "pulsá el dibujo…" + sonido. "Apretá el texto…" se dice solo en la primera ronda.
	function playInstruction(nombrarDibujos = false) {
		const targetAudio = consignaAudios[activity.consigna];
		const nombres = nombrarDibujos ? activity.options.map((option) => wordAudios[option.name]) : [];
		secuencia.reproducir([...nombres, targetAudio, instructionAudio, targetAudio, activityIndex === 0 ? helpAudio : null]);
	}

	// Durante el acierto no se corta el audio: su final es el que pasa a la siguiente ronda.
	function repetirConsigna() {
		if (!game.locked) playInstruction();
	}

	function escucharPalabra(name) {
		if (!game.locked) secuencia.reproducir([wordAudios[name]]);
	}

	useEffect(() => {
		ayuda.reiniciar();
		playInstruction(true);
		return secuencia.cancelar;
	}, [activityIndex]);

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
			const startedAt = Date.now();
			// Palabra → felicitación; la ronda siguiente espera a que termine de sonar.
			secuencia.reproducir([wordAudios[option.name], mudo(correctAudio)], () => {
				if (esUltima) {
					return;
				}
				runtime.setTimeout(() => {
					setActivityIndex((currentIndex) => currentIndex + 1);
					setAcertada(null);
					setVibrating(new Set());
					game.locked = false;
				}, Math.max(200, CORRECT_ANIMATION_MS - (Date.now() - startedAt)));
			});
			return;
		}

		// Palabra tocada → error → ayuda con el sonido pedido.
		secuencia.reproducir([
			wordAudios[option.name],
			mudo(errorAudio),
			...ayuda.trasError(consignaAudios[activity.consigna])
		]);
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
				<section className={`initials-grid${activity.options.length > 2 ? " initials-grid--tres" : ""}`} aria-label="Imágenes para elegir">
					{activity.options.map((option, optionIndex) => {
						const classNames = ["initials-option"];
						if (acertada === option.name) {
							classNames.push("correct");
						}
						if (vibrating.has(option.name)) {
							classNames.push("vibrating");
						}
						if (ayuda.pista && option.correct && !acertada) {
							classNames.push("pista-correcta");
						}
						return (
							<div className="initials-item" key={`${activityIndex}-${option.name}`}>
								<div className="initials-display">
									<img
										className="initials-pedestal"
										src={img(`peluches/${option.name.length > 7 ? "basetortaLarga" : "basetorta"}.png`)}
										alt=""
										aria-hidden="true"
									/>
									<button
										type="button"
										className={classNames.join(" ")}
										onClick={() => handleImageClick(option)}
										aria-label={option.name}
									>
										<img
											src={optionImage(option.name)}
											alt={option.name}
											onError={(event) => {
												event.currentTarget.onerror = null;
												event.currentTarget.src = img(`peluches/${option.name}.webp`);
											}}
										/>
									</button>
									<button
										type="button"
										className={`initials-name color-${(activityIndex * 3 + optionIndex) % 4}`}
										onClick={() => escucharPalabra(option.name)}
									>
										<>
											<span className="requested-sound">{option.name.slice(0, largoResaltado)}</span>
											{option.name.slice(largoResaltado)}
										</>
									</button>
								</div>
							</div>
						);
					})}
				</section>
			</main>
			<Character character={character} mouth={mouth} onClick={repetirConsigna} label="Repetir audio" />
			<PremioComida premio={premio} />
		</div>
	);
}
