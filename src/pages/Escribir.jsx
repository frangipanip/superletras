import { useCallback, useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { img, preloadImages, sound } from "../lib/assets";
import "./actividad.css";
import "./Escribir.css";

const MAQUINA_FRAMES = [0, 1, 2, 3, 2, 1].map((frame) => img(`maquina${frame}.png`));
const OPCIONES = [
	{ nombre: "Helado", imagen: img("ophelado.png"), habilitada: false },
	{ nombre: "Cupcake", imagen: img("opcupcake.png"), habilitada: false },
	{ nombre: "Bebida", imagen: img("opbebida.png"), habilitada: true }
];
const RONDAS = [
	{ palabra: "LULA", imagen: img("vaso.png"), audio: "PLlula.mp3", entrega: [1, 2, 3, 4] },
	{ palabra: "OLA", imagen: img("vasolleno.png"), audio: "PLola.mp3", entrega: [5, 6, 7, 8, 9, 10, 11] },
	{ palabra: "LALI", imagen: img("vasocrema.png"), audio: "PLlali.mp3", entrega: [12, 13, 14, 15] }
];
const FILAS_TECLADO = [["L", "M"], ["S", "T"], ["A", "E", "I"], ["O", "U"]];
const LETRAS_VOCAL = new Set(["A", "E", "I", "O", "U"]);

preloadImages([
	...MAQUINA_FRAMES,
	...OPCIONES.map((opcion) => opcion.imagen),
	...RONDAS.map((ronda) => ronda.imagen),
	...RONDAS.flatMap((ronda) => ronda.entrega.map((frame) => img(`vaso${frame}.png`)))
]);

export default function Escribir() {
	usePageTitle("Escribir");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	useActivityMenuOption();

	const [fase, setFase] = useState("elegir");
	const [ronda, setRonda] = useState(0);
	const [escrito, setEscrito] = useState([]);
	const [productoFrame, setProductoFrame] = useState(null);
	const [maquinaFrame, setMaquinaFrame] = useState(0);
	const [estado, setEstado] = useState("jugando");
	const [bloqueado, setBloqueado] = useState(false);
	const bloqueadoRef = useRef(false);
	const audioRef = useRef(null);
	const entregaTimerRef = useRef(0);
	const errorTimerRef = useRef(0);

	const fijarBloqueado = useCallback((valor) => {
		bloqueadoRef.current = valor;
		setBloqueado(valor);
	}, []);

	const detenerAudio = useCallback(() => {
		const audio = audioRef.current;
		audioRef.current = null;
		if (audio) {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		}
		stopTalking();
	}, [stopTalking]);

	const reproducirAudio = useCallback((archivo, hablar = false) => {
		detenerAudio();
		const audio = runtime.audio(sound(archivo), { preload: true });
		audioRef.current = audio;
		if (hablar) {
			startTalking();
		}
		audio.onended = () => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			if (hablar) stopTalking();
		};
		audio.play().catch((error) => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			if (hablar) stopTalking();
			console.error(`No se pudo reproducir el audio ${archivo}.`, error);
		});
	}, [detenerAudio, runtime, startTalking, stopTalking]);

	useEffect(() => {
		const timer = runtime.setInterval(() => {
			setMaquinaFrame((actual) => (actual + 1) % MAQUINA_FRAMES.length);
		}, 180);
		return () => runtime.clearInterval(timer);
	}, [runtime]);

	useEffect(() => {
		if (fase === "jugando") {
			reproducirAudio(RONDAS[ronda].audio, true);
			return detenerAudio;
		}
		if (fase === "final") {
			reproducirAudio("Fabuloso.mp3", true);
			return detenerAudio;
		}
		return undefined;
	}, [fase, ronda, reproducirAudio, detenerAudio]);

	const reiniciar = useCallback(() => {
		runtime.clearInterval(entregaTimerRef.current);
		runtime.clearTimeout(errorTimerRef.current);
		entregaTimerRef.current = 0;
		errorTimerRef.current = 0;
		fijarBloqueado(false);
		detenerAudio();
		setFase("elegir");
		setRonda(0);
		setEscrito([]);
		setProductoFrame(null);
		setEstado("jugando");
	}, [detenerAudio, fijarBloqueado, runtime]);

	function elegirBebida() {
		setRonda(0);
		setEscrito([]);
		setProductoFrame(null);
		setEstado("jugando");
		setFase("jugando");
	}

	function presionarLetra(letra) {
		if (bloqueadoRef.current || fase !== "jugando") return;
		setEscrito((actual) => (actual.length >= RONDAS[ronda].palabra.length ? actual : [...actual, letra]));
	}

	function borrarLetra() {
		if (bloqueadoRef.current || fase !== "jugando") return;
		setEscrito((actual) => actual.slice(0, -1));
	}

	function animarEntrega() {
		const frames = RONDAS[ronda].entrega;
		let indice = 0;
		setProductoFrame(img(`vaso${frames[indice]}.png`));
		entregaTimerRef.current = runtime.setInterval(() => {
			indice += 1;
			setProductoFrame(img(`vaso${frames[indice]}.png`));
			if (indice === frames.length - 1) {
				runtime.clearInterval(entregaTimerRef.current);
				entregaTimerRef.current = runtime.setTimeout(() => {
					entregaTimerRef.current = 0;
					if (ronda === RONDAS.length - 1) {
						setFase("final");
					} else {
						setRonda((actual) => actual + 1);
						setEscrito([]);
						setFase("jugando");
					}
					fijarBloqueado(false);
				}, 500);
			}
		}, 140);
	}

	function confirmar() {
		if (bloqueadoRef.current || fase !== "jugando" || escrito.length !== RONDAS[ronda].palabra.length) return;
		fijarBloqueado(true);
		detenerAudio();
		if (escrito.join("") === RONDAS[ronda].palabra) {
			reproducirAudio("correcto.mp3");
			animarEntrega();
			return;
		}

		reproducirAudio("error.mp3");
		setEstado("mal");
		errorTimerRef.current = runtime.setTimeout(() => {
			errorTimerRef.current = 0;
			setEstado("jugando");
			setEscrito([]);
			fijarBloqueado(false);
		}, 650);
	}

	const rondaActual = RONDAS[ronda];

	return (
		<div className="page activity-page page-escribir">
			<BackButton />
			<FullscreenButton toggle />

			<main className="escribir-escena" aria-label="Actividad de escribir">
				<div className={`escribir-lienzo${estado === "mal" ? " escribir-sacudida" : ""}`}>
					<img className="escribir-maquina" src={MAQUINA_FRAMES[maquinaFrame]} alt="" />
					{productoFrame && <img className="escribir-producto" src={productoFrame} alt="" />}

					{fase === "elegir" && (
						<div className="escribir-opciones" aria-label="Elegí qué preparar">
							{OPCIONES.map((opcion) => (
								<button
									key={opcion.nombre}
									className="escribir-opcion"
									type="button"
									disabled={!opcion.habilitada}
									aria-label={opcion.habilitada ? `Preparar ${opcion.nombre}` : `${opcion.nombre}, próximamente`}
									onClick={opcion.habilitada ? elegirBebida : undefined}
								>
									<img src={opcion.imagen} alt="" />
								</button>
							))}
						</div>
					)}

					{fase === "jugando" && rondaActual && (
						<>
							<div className="escribir-consigna" aria-live="polite">
								<span className="escribir-consigna-icono" aria-hidden="true">
									<img src={rondaActual.imagen} alt="" />
								</span>
								<span className="escribir-igual">=</span>
								<span className="escribir-palabra">{rondaActual.palabra}</span>
							</div>

							<div className="escribir-casillas" aria-label={`Escribí ${rondaActual.palabra}`}>
								{Array.from({ length: rondaActual.palabra.length }, (_, indice) => (
									<span key={indice} className={`escribir-casilla${escrito[indice] ? " llena" : ""}`}>
										{escrito[indice] || ""}
									</span>
								))}
							</div>
						</>
					)}

					{fase === "jugando" && (
						<div className="escribir-teclado" aria-label="Teclado">
							{FILAS_TECLADO.map((fila, indice) => (
								<div className={`escribir-fila escribir-fila-${fila.length}`} key={indice}>
									{fila.map((letra) => (
										<button
											key={letra}
											className={`escribir-tecla${LETRAS_VOCAL.has(letra) ? " vocal" : " consonante"}`}
											type="button"
											disabled={bloqueado || escrito.length >= rondaActual.palabra.length}
											onClick={() => presionarLetra(letra)}
										>
											{letra}
										</button>
									))}
								</div>
							))}
							<div className="escribir-fila escribir-fila-acciones">
								<button
									className="escribir-tecla escribir-borrar"
									type="button"
									aria-label="Borrar última letra"
									disabled={bloqueado || escrito.length === 0}
									onClick={borrarLetra}
								>
									<svg className="escribir-icono" viewBox="0 0 48 32" aria-hidden="true">
										<path className="escribir-icono-flecha" d="M4 16 21 3v7.5h21a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5H21V29Z" />
									</svg>
								</button>
								<button
									className="escribir-tecla escribir-confirmar"
									type="button"
									aria-label="Confirmar palabra"
									disabled={bloqueado || escrito.length !== rondaActual.palabra.length}
									onClick={confirmar}
								>
									<svg className="escribir-icono" viewBox="0 0 48 32" aria-hidden="true">
										<path className="escribir-icono-borde" d="m12 16 8 8 16-16" />
										<path className="escribir-icono-trazo" d="m12 16 8 8 16-16" />
									</svg>
								</button>
							</div>
						</div>
					)}

					{fase === "final" && (
						<div className="escribir-final">
							<p>¡Fabuloso!</p>
							<button type="button" onClick={reiniciar}>Otra bebida</button>
						</div>
					)}
				</div>

				{character && (
					<Character
						character={character}
						mouth={mouth}
						label={fase === "jugando" ? "Escuchar la palabra otra vez" : "Personaje"}
						onClick={fase === "jugando" && rondaActual ? () => reproducirAudio(rondaActual.audio, true) : undefined}
					/>
				)}
			</main>
		</div>
	);
}
