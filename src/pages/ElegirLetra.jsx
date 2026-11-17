import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useAyudaError } from "../hooks/useAyudaError";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { commonSound, img, MUNDO5_MOUTH_IMAGES, preloadImages, sound } from "../lib/assets";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./ElegirLetra.css";

// "¿Jirafa va con J o con G?": se ve el dibujo y la palabra con un hueco, se oye la palabra y se
// elige la letra. Cada mundo pone su par de letras (dos letras que suenan igual), sus palabras y su
// carpeta de recursos (imagenes/peluches/<carpeta>/<id>.png y sonido/<personaje>/peluche/<carpeta>/<id>.mp3).
// `fijas` salen siempre (las que de verdad confunden: GE/GI con JE/JI); el resto completa las rondas.
const MUNDOS = {
	5: {
		letras: ["J", "G"],
		consigna: "vaConJoG.mp3",
		carpeta: "MUNDO5",
		mouthImages: MUNDO5_MOUTH_IMAGES,
		fijas: ["gente", "gelatina", "girasol", "jirafa"],
		otras: ["jugo", "jaula", "jabon", "abeja"],
		acentos: { jabon: "jabón" }
	}
};
const RONDAS = 6;

function crearRondas(config) {
	const palabras = shuffle([...config.fijas, ...shuffle(config.otras).slice(0, RONDAS - config.fijas.length)]);
	return palabras.map((id) => {
		const texto = (config.acentos[id] || id).toUpperCase();
		// La letra que falta es la primera del par que aparece en la palabra (ABE_A, _IRAFA).
		const posicion = Math.min(...config.letras.map((letra) => texto.indexOf(letra)).filter((indice) => indice >= 0));
		return { id, texto, posicion, letra: texto[posicion] };
	});
}

export default function ElegirLetra() {
	const location = useLocation();
	const mundo = MUNDOS[location.state?.world] ? location.state.world : 5;
	const config = MUNDOS[mundo];
	usePageTitle(`¿${config.letras[0]} o ${config.letras[1]}?`);
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, config.mouthImages);
	const menuOption = useActivityMenuOption();
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const [consignaAudio] = useState(() => runtime.audio(sound(config.consigna), { preload: true }));
	const [aciertoAudio] = useState(() => runtime.audio(commonSound("acierto.mp3"), { preload: true }));
	const ayuda = useAyudaError(runtime);
	const [premio, otorgarPremio] = useRecompensa("elegir", menuOption);
	const [rondas, setRondas] = useState(() => crearRondas(config));
	const [indice, setIndice] = useState(0);
	const [elegida, setElegida] = useState(null);
	const [equivocada, setEquivocada] = useState(null);
	const game = useRef({ errores: 0, bloqueado: false }).current;
	const ronda = rondas[indice];

	const imagenDe = (id) => img(`peluches/${config.carpeta}/${id}.png`);
	const palabraAudio = (id) => runtime.audio(sound(`peluche/${config.carpeta}/${id}.mp3`));

	function consigna() {
		secuencia.reproducir([palabraAudio(ronda.id), consignaAudio, palabraAudio(ronda.id)]);
	}

	useEffect(() => {
		preloadImages(rondas.map((item) => imagenDe(item.id)));
	}, [rondas]);

	useEffect(() => {
		game.bloqueado = false;
		setElegida(null);
		setEquivocada(null);
		ayuda.reiniciar();
		const timer = runtime.setTimeout(consigna, indice === 0 ? 600 : 250);
		return () => runtime.clearTimeout(timer);
	}, [indice, rondas]);

	function elegir(letra) {
		if (game.bloqueado || premio) return;
		if (letra !== ronda.letra) {
			game.errores += 1;
			setEquivocada(letra);
			runtime.setTimeout(() => setEquivocada((actual) => (actual === letra ? null : actual)), 500);
			secuencia.reproducir([mudo(runtime.audio(sound("error.mp3"))), ...ayuda.trasError(palabraAudio(ronda.id))]);
			return;
		}
		game.bloqueado = true;
		setElegida(letra);
		const ultima = indice + 1 >= rondas.length;
		secuencia.reproducir([mudo(aciertoAudio), palabraAudio(ronda.id)], () => {
			if (ultima) {
				otorgarPremio(game.errores);
				return;
			}
			setIndice((actual) => actual + 1);
		});
	}

	function reiniciar() {
		secuencia.cancelar();
		game.errores = 0;
		setRondas(crearRondas(config));
		setIndice(0);
	}

	return (
		<div className={`page activity-page page-elegir-letra elegir-mundo${mundo}`}>
			<BackButton />
			<FullscreenButton toggle />
			<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={reiniciar}>&#x21bb;</button>
			<main className="elegir-escena">
				<div className="elegir-tarjeta" key={ronda.id}>
					<button className="elegir-dibujo" type="button" aria-label={`Escuchar ${ronda.texto.toLowerCase()}`} onClick={consigna}>
						<img src={imagenDe(ronda.id)} alt={ronda.texto.toLowerCase()} draggable={false} />
					</button>
					<p className="elegir-palabra" aria-label={ronda.texto}>
						{[...ronda.texto].map((letra, posicion) => (
							posicion === ronda.posicion ? (
								<span key={posicion} className={`elegir-hueco${elegida ? " lleno" : ""}`}>{elegida || ""}</span>
							) : (
								<span key={posicion}>{letra}</span>
							)
						))}
					</p>
				</div>
				<div className="elegir-opciones" aria-label="Letras">
					{config.letras.map((letra) => (
						<button
							key={letra}
							type="button"
							className={`elegir-letra${equivocada === letra ? " ficha-rebote" : ""}${elegida === letra ? " correcta" : ""}${ayuda.pista && letra === ronda.letra ? " pista-correcta" : ""}`}
							onClick={() => elegir(letra)}
							aria-label={`Letra ${letra}`}
						>
							{letra}
						</button>
					))}
				</div>
			</main>
			<Character character={character} mouth={mouth} onClick={consigna} label="Repetir consigna" />
			<PremioComida premio={premio} />
		</div>
	);
}
