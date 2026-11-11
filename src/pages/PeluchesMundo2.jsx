import { useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO2_MOUTH_IMAGES, preloadImages, sound } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./PeluchesMundo2.css";

// Palabras de las láminas de Mundo 2. El nombre de la imagen (peluchesM2/<id>.png) y del audio
// (sonido/<personaje>/palabras/<id>.mp3) es la palabra sin tildes; ACENTOS da cómo se escribe.
const PALABRAS = [
	"pato", "pelota", "pincel", "pollito", "puerta", "pastel", "peine", "pileta", "pochoclos", "puente",
	"paraguas", "percha", "piedra", "policia", "pulsera", "pantalon", "pera", "pulpo",
	"naranja", "nene", "nieve", "noche", "nuez", "navidad", "negro", "nido", "novia", "nudo", "nariz", "nena",
	"ninja", "nube", "nave", "nueve", "nadar",
	"dado", "dedo", "diente", "dona", "duende", "dalmata", "delantal", "dinosaurio", "doctor", "durazno",
	"dardo", "destornillador", "dinero", "domino", "ducha", "despertador", "diario", "dulce", "desierto",
	"factura", "feliz", "fideo", "foca", "fuente", "fantasma", "felpudo", "fiebre", "foco", "fuego",
	"faro", "felino", "ficha", "foto", "fuerza", "farmacia",
	"hamburguesa", "helado", "hilo", "hoja", "huracan", "hacha", "heladera", "hielo", "hongo", "huevo",
	"hada", "helicoptero", "hipopotamo", "hormiga", "huella", "hamaca", "heroe", "horno", "hueso", "hebilla"
];
const ACENTOS = {
	policia: "policía",
	pantalon: "pantalón",
	dalmata: "dálmata",
	domino: "dominó",
	huracan: "huracán",
	helicoptero: "helicóptero",
	hipopotamo: "hipopótamo",
	heroe: "héroe"
};
const LETRAS = ["p", "n", "d", "f", "h"];
const VOCALES = ["a", "e", "i", "o", "u"];
const FLORES = ["florVioleta", "florCoral"];
// Cada sílaba se pide dos veces (con imágenes distintas).
const VUELTAS = 2;
const CORRECT_ANIMATION_MS = 900;
const VIBRATE_MS = 350;

const textoDe = (id) => ACENTOS[id] || id;
const imagenDe = (id) => img(`peluchesM2/${id}.png`);

function crearRondas(letra) {
	const consignas = VOCALES.map((vocal) => letra + vocal).filter((consigna) =>
		PALABRAS.some((palabra) => palabra.startsWith(consigna))
	);
	const usadas = new Set();
	const rondas = [];
	for (let vuelta = 0; vuelta < VUELTAS; vuelta += 1) {
		let orden = shuffle(consignas);
		// Que no se repita la misma sílaba entre el final de una vuelta y el comienzo de la otra.
		if (orden.length > 1 && orden[0] === rondas[rondas.length - 1]?.consigna) {
			orden = [...orden.slice(1), orden[0]];
		}
		orden.forEach((consigna) => {
			// Se prefieren palabras que todavía no aparecieron (ni como acierto ni como error).
			const opciones = PALABRAS.filter((palabra) => palabra.startsWith(consigna));
			const nuevas = opciones.filter((palabra) => !usadas.has(palabra));
			const correcta = shuffle(nuevas.length ? nuevas : opciones)[0];
			usadas.add(correcta);
			// El error empieza con la misma consonante y otra vocal.
			const distractores = PALABRAS.filter((palabra) => palabra.startsWith(letra) && !palabra.startsWith(consigna));
			const noUsados = distractores.filter((palabra) => !usadas.has(palabra));
			const incorrecta = shuffle(noUsados.length ? noUsados : distractores)[0];
			usadas.add(incorrecta);
			rondas.push({
				consigna,
				options: shuffle([
					{ id: correcta, correct: true },
					{ id: incorrecta, correct: false }
				])
			});
		});
	}
	return rondas;
}

export default function PeluchesMundo2() {
	usePageTitle("Peluches - Mundo 2");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO2_MOUTH_IMAGES);
	const menuOption = useActivityMenuOption();
	const [letra] = useState(() => (LETRAS.includes(menuOption) ? menuOption : "p"));
	const [rondas] = useState(() => crearRondas(letra));
	const [activityIndex, setActivityIndex] = useState(0);
	const [acertada, setAcertada] = useState(null);
	const [vibrating, setVibrating] = useState(() => new Set());
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3")));
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [consignaAudios] = useState(() => Object.fromEntries(
		[...new Set(rondas.map((ronda) => ronda.consigna))].map((consigna) => [
			consigna,
			runtime.audio(sound(`${consigna}.mp3`), { preload: true })
		])
	));
	const [wordAudios] = useState(() => Object.fromEntries(
		[...new Set(rondas.flatMap((ronda) => ronda.options.map((option) => option.id)))].map((id) => [
			id,
			runtime.audio(sound(`palabras/${id}.mp3`), { preload: true })
		])
	));
	const [instructionAudio] = useState(() => runtime.audio(sound("Pulsaeldibujo.mp3"), { preload: true }));
	const [helpAudio] = useState(() => runtime.audio(sound("apetaeltexto.mp3"), { preload: true }));
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	const sequenceToken = useRef(0);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	const game = useRef({ errors: 0, rewarded: false, locked: false }).current;
	const activity = rondas[activityIndex];

	useEffect(() => {
		preloadImages([...FLORES.map((flor) => img(`peluchesM2/${flor}.png`)), ...rondas.flatMap((ronda) => ronda.options.map((option) => imagenDe(option.id)))]);
	}, [rondas]);

	function silenciarTodo() {
		sequenceToken.current += 1;
		[...Object.values(consignaAudios), ...Object.values(wordAudios), instructionAudio, helpAudio].forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
		stopTalking();
	}

	// Consigna: "pa" + "pulsá el dibujo que empieza con" + "pa" + "apretá el texto para escucharlo".
	function playInstruction() {
		silenciarTodo();
		const token = sequenceToken.current;
		const targetAudio = consignaAudios[activity.consigna];
		const sequence = [targetAudio, instructionAudio, targetAudio, helpAudio];
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

	// El personaje lee la palabra (moviendo la boca) y después sigue onEnd.
	function playWord(id, onEnd) {
		silenciarTodo();
		const audio = wordAudios[id];
		let completed = false;
		const finish = () => {
			if (completed) {
				return;
			}
			completed = true;
			audio.onended = null;
			stopTalking();
			onEnd?.();
		};
		audio.currentTime = 0;
		audio.onended = finish;
		startTalking();
		audio.play().catch(finish);
	}

	function playFeedback(audio) {
		audio.pause();
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	useEffect(() => {
		playInstruction();
		return silenciarTodo;
	}, [activityIndex]);

	function handleOptionClick(option) {
		if (game.locked) {
			return;
		}

		if (option.correct) {
			game.locked = true;
			setAcertada(option.id);
			const esUltima = activityIndex === rondas.length - 1;
			if (esUltima && !game.rewarded) {
				game.rewarded = true;
				otorgarPremio(game.errors);
			}
			playWord(option.id, () => {
				playFeedback(correctAudio);
				if (!esUltima) {
					runtime.setTimeout(() => {
						setActivityIndex((current) => current + 1);
						setAcertada(null);
						setVibrating(new Set());
						game.locked = false;
					}, CORRECT_ANIMATION_MS);
				}
			});
			return;
		}

		game.errors += 1;
		playWord(option.id, () => playFeedback(errorAudio));
		setVibrating((current) => new Set(current).add(option.id));
		runtime.setTimeout(() => {
			setVibrating((current) => {
				const next = new Set(current);
				next.delete(option.id);
				return next;
			});
		}, VIBRATE_MS);
	}

	return (
		<div className="page activity-page page-peluches-m2">
			<BackButton />
			<FullscreenButton toggle />
			<main className="pm2-activity">
				<section className="pm2-field" aria-label="Dibujos para elegir">
					{activity.options.map((option, optionIndex) => {
						const texto = textoDe(option.id);
						const flor = FLORES[(activityIndex + optionIndex) % FLORES.length];
						const classNames = ["pm2-option"];
						if (acertada === option.id) {
							classNames.push("correct");
						} else if (acertada) {
							classNames.push("dimmed");
						}
						if (vibrating.has(option.id)) {
							classNames.push("vibrating");
						}
						return (
							<div className={`pm2-item pm2-item-${optionIndex + 1}`} key={`${activityIndex}-${option.id}`}>
								<div className="pm2-stage">
									<img className="pm2-flower" src={img(`peluchesM2/${flor}.png`)} alt="" aria-hidden="true" draggable={false} />
									<button type="button" className={classNames.join(" ")} onClick={() => handleOptionClick(option)} aria-label={texto}>
										<img src={imagenDe(option.id)} alt={texto} draggable={false} />
									</button>
								</div>
								<button
									type="button"
									className={`pm2-name ${flor}${texto.length > 10 ? " long" : ""}`}
									onClick={() => {
										if (!game.locked) playWord(option.id);
									}}
									aria-label={`Escuchar ${texto}`}
								>
									<span className="requested-sound">{texto.slice(0, 2)}</span>
									{texto.slice(2)}
								</button>
							</div>
						);
					})}
				</section>
			</main>
			<Character
				character={character}
				mouth={mouth}
				onClick={() => {
					// Durante el acierto no se corta la palabra: su final es el que pasa a la siguiente ronda.
					if (!game.locked) playInstruction();
				}}
				label="Repetir consigna"
			/>
			<PremioComida premio={premio} />
		</div>
	);
}
