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
import { whenPageReady } from "../lib/pageGate";
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
// Cada sílaba se pide dos veces (con imágenes distintas).
const VUELTAS = 2;
// Aleteo del personaje: los 4 cuadros en 1 s, igual que en Inicio de Mundo 2.
const WING_FRAME_MS = 250;

// Escena: una luciérnaga sobre una brizna a cada lado, proyectando un haz de luz con una opción.
const LADOS = [
	{ id: "izquierda", luciernaga: "luciernagaIzquierda", brizna: "briznaIzquierda" },
	{ id: "derecha", luciernaga: "luciernagaDerecha", brizna: "briznaDerecha" }
];
// Secuencia de entrada (una sola vez, cuando terminó de cargar la pantalla). Las duraciones de
// las animaciones están en PeluchesMundo2.css y tienen que coincidir con estas.
const VUELO_MS = 2800; // las luciérnagas entran volando y se posan
const HAZ_DEMORA_MS = 500; // se acomodan en la brizna antes de encender la luz
const HAZ_MS = 900; // el haz baja hasta el suelo
const APARECER_MS = 700; // las opciones se materializan dentro del haz
const SALIR_MS = 450; // entre rondas: se apagan las opciones anteriores
// Chispitas que flotan dentro de cada haz (posición en % del haz, demora y tamaño).
const PARTICULAS = [
	{ x: 50, y: 18, d: 0, s: 1 },
	{ x: 38, y: 34, d: 1.1, s: 0.8 },
	{ x: 62, y: 40, d: 0.5, s: 1.2 },
	{ x: 30, y: 58, d: 1.7, s: 0.9 },
	{ x: 72, y: 62, d: 0.9, s: 0.8 },
	{ x: 48, y: 52, d: 2.3, s: 1 },
	{ x: 20, y: 80, d: 0.3, s: 1.1 },
	{ x: 82, y: 84, d: 1.4, s: 0.9 },
	{ x: 56, y: 76, d: 2, s: 1.2 },
	{ x: 40, y: 90, d: 0.7, s: 0.8 },
	{ x: 66, y: 24, d: 1.9, s: 0.7 },
	{ x: 26, y: 44, d: 2.6, s: 0.7 },
	{ x: 78, y: 50, d: 0.2, s: 1 },
	{ x: 12, y: 92, d: 1.2, s: 0.9 },
	{ x: 90, y: 70, d: 2.4, s: 0.8 },
	{ x: 34, y: 70, d: 1.6, s: 1.1 }
];
const CHISPAS_ACIERTO = 10;

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
	// Ronda cuyas opciones ya se ven: la consigna espera a que aparezcan (ver usePeluchesJuego).
	const [rondaVisible, setRondaVisible] = useState(-1);
	const { activityIndex, acertada, vibrating, premio, elegir, escucharPalabra, repetirConsigna } = usePeluchesJuego({
		runtime,
		letra,
		rondas,
		consignaAudio: (consigna) => `${consigna}.mp3`,
		palabraAudio: (id) => `palabras/${id}.mp3`,
		startTalking,
		stopTalking,
		rondaVisible
	});
	const [wingFrame, setWingFrame] = useState(0);
	// Entrada de la escena: "espera" → "volando" → "posadas" → "proyectando" (queda así).
	const [escena, setEscena] = useState("espera");
	// Ronda dibujada en los haces (durante el cambio de ronda sigue la anterior hasta apagarse).
	const [mostrada, setMostrada] = useState(0);
	// "ocultas" | "apareciendo" | "visibles" | "saliendo"
	const [opciones, setOpciones] = useState("ocultas");
	const ronda = rondas[mostrada];
	// Solo se puede tocar cuando las opciones de la ronda actual terminaron de aparecer.
	const interactivo = opciones === "visibles" && rondaVisible === activityIndex;

	function mostrarOpciones(index) {
		setMostrada(index);
		setOpciones("apareciendo");
		runtime.setTimeout(() => {
			setOpciones("visibles");
			setRondaVisible(index);
		}, APARECER_MS);
	}

	// Entrada: vuelan las luciérnagas, se posan, se encienden los haces y aparecen las opciones.
	useEffect(() => whenPageReady(() => {
		setEscena("volando");
		runtime.setTimeout(() => {
			setEscena("posadas");
			runtime.setTimeout(() => {
				setEscena("proyectando");
				runtime.setTimeout(() => mostrarOpciones(0), HAZ_MS);
			}, HAZ_DEMORA_MS);
		}, VUELO_MS);
	}), [runtime]);

	// Cambio de ronda: las luciérnagas se quedan; se apagan las opciones y aparecen las nuevas.
	useEffect(() => {
		if (activityIndex === 0) {
			return;
		}
		setOpciones("saliendo");
		runtime.setTimeout(() => mostrarOpciones(activityIndex), SALIR_MS);
	}, [activityIndex]);

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
		preloadImages(rondas.flatMap((ronda) => ronda.options.map((option) => imagenDe(option.id))));
	}, [rondas]);

	const pageClassNames = ["page", "activity-page", "page-peluches-m2"];
	if (escena !== "espera") pageClassNames.push("pm2-volando");
	if (escena === "posadas" || escena === "proyectando") pageClassNames.push("pm2-posadas");
	if (escena === "proyectando") pageClassNames.push("pm2-proyectando");

	return (
		<div className={pageClassNames.join(" ")}>
			<BackButton />
			<FullscreenButton toggle />
			<main className="pm2-activity">
				<section className={`pm2-scene pm2-opciones-${opciones}`} aria-label="Dibujos para elegir">
					{LADOS.map((lado, optionIndex) => {
						const option = ronda.options[optionIndex];
						const texto = textoDe(option.id);
						const classNames = ["pm2-option"];
						const hazClassNames = ["pm2-haz"];
						if (acertada === option.id) {
							classNames.push("correct");
							hazClassNames.push("brillando");
						} else if (acertada) {
							classNames.push("dimmed");
							hazClassNames.push("tenue");
						}
						if (vibrating.has(option.id)) {
							classNames.push("vibrating");
							hazClassNames.push("parpadeo");
						}
						return (
							<div className={`pm2-lado pm2-lado-${lado.id}`} key={lado.id}>
								{/* La brizna, el haz y la luciérnaga se flexionan juntos al posarse. */}
								<div className="pm2-percha">
									<img className="pm2-brizna" src={img(`peluchesM2/${lado.brizna}.png`)} alt="" aria-hidden="true" draggable={false} />
									<div className={hazClassNames.join(" ")} aria-hidden="true">
										<div className="pm2-haz-suelo" />
										<div className="pm2-haz-luz">
											<div className="pm2-haz-cono" />
										</div>
										<div className="pm2-haz-particulas">
											{PARTICULAS.map((particula, index) => (
												<span
													key={index}
													style={{ "--x": `${particula.x}%`, "--y": `${particula.y}%`, "--d": `${particula.d + optionIndex * 0.6}s`, "--s": particula.s }}
												/>
											))}
										</div>
										<div className="pm2-haz-fuente" />
									</div>
									<div className="pm2-luciernaga">
										<div className="pm2-luciernaga-ondas">
											<img src={img(`peluchesM2/${lado.luciernaga}.png`)} alt="" aria-hidden="true" draggable={false} />
										</div>
									</div>
								</div>
								<div className="pm2-proyeccion" key={`${mostrada}-${option.id}`}>
									<button
										type="button"
										className={classNames.join(" ")}
										onClick={() => interactivo && elegir(option)}
										aria-label={texto}
									>
										<img src={imagenDe(option.id)} alt={texto} draggable={false} />
									</button>
									{acertada === option.id && (
										<span className="pm2-chispas" aria-hidden="true">
											{Array.from({ length: CHISPAS_ACIERTO }, (_, index) => (
												<span key={index} style={{ "--a": `${(360 / CHISPAS_ACIERTO) * index}deg` }} />
											))}
										</span>
									)}
									<button
										type="button"
										className={`pm2-name${texto.length > 10 ? " long" : ""}`}
										onClick={() => interactivo && escucharPalabra(option.id)}
										aria-label={`Escuchar ${texto}`}
									>
										<span className="pm2-name-texto">
											<span className="requested-sound">{texto.slice(0, 2)}</span>
											{texto.slice(2)}
										</span>
									</button>
								</div>
							</div>
						);
					})}
				</section>
			</main>
			<Character
				character={character}
				mouth={mouth}
				image={character ? MUNDO2_CHARACTER_FRAMES[character][wingFrame] : undefined}
				onClick={() => rondaVisible === activityIndex && repetirConsigna()}
				label="Repetir consigna"
			/>
			<PremioComida premio={premio} />
		</div>
	);
}
