import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida from "../components/PremioComida";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePeluchesJuego } from "../hooks/usePeluchesJuego";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO2_CHARACTER_FRAMES, MUNDO2_MOUTH_IMAGES, preloadImages } from "../lib/assets";
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
// Aleteo del personaje: los 4 cuadros en 1 s, igual que en Inicio de Mundo 2.
const WING_FRAME_MS = 250;

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
	const { activity, activityIndex, acertada, vibrating, premio, elegir, escucharPalabra, repetirConsigna } = usePeluchesJuego({
		runtime,
		letra,
		rondas,
		consignaAudio: (consigna) => `${consigna}.mp3`,
		palabraAudio: (id) => `palabras/${id}.mp3`,
		startTalking,
		stopTalking
	});
	const [wingFrame, setWingFrame] = useState(0);

	useEffect(() => {
		if (!character) return undefined;
		preloadImages(MUNDO2_CHARACTER_FRAMES[character]);
		let timer = 0;

		// Se frena con la pestaña oculta para no gastar batería.
		function updateAnimation() {
			runtime.clearInterval(timer);
			timer = 0;
			if (document.visibilityState === "visible") {
				timer = runtime.setInterval(() => {
					setWingFrame((current) => (current + 1) % MUNDO2_CHARACTER_FRAMES[character].length);
				}, WING_FRAME_MS);
			}
		}

		updateAnimation();
		document.addEventListener("visibilitychange", updateAnimation);
		return () => {
			document.removeEventListener("visibilitychange", updateAnimation);
			runtime.clearInterval(timer);
		};
	}, [character, runtime]);

	useEffect(() => {
		preloadImages([...FLORES.map((flor) => img(`peluchesM2/${flor}.png`)), ...rondas.flatMap((ronda) => ronda.options.map((option) => imagenDe(option.id)))]);
	}, [rondas]);

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
									<button type="button" className={classNames.join(" ")} onClick={() => elegir(option)} aria-label={texto}>
										<img src={imagenDe(option.id)} alt={texto} draggable={false} />
									</button>
								</div>
								<button
									type="button"
									className={`pm2-name ${flor}${texto.length > 10 ? " long" : ""}`}
									onClick={() => escucharPalabra(option.id)}
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
				image={character ? MUNDO2_CHARACTER_FRAMES[character][wingFrame] : undefined}
				onClick={repetirConsigna}
				label="Repetir consigna"
			/>
			<PremioComida premio={premio} />
		</div>
	);
}
