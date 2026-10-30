import { useCallback, useEffect, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { img, sound } from "../lib/assets";
import { GROUPS } from "../lib/palabras";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./Decora.css";

const MANGA_COLORES = ["Rosa", "Amarilla", "Celeste"];
const IMAGENES_GOTAS = {
	Rosa: ["gotaRosa1.png", "gotaRosa2.png"],
	Amarilla: ["gptaAmarilla1.png", "gotaAmarilla2.png"],
	Celeste: ["gotaCeleste1.png", "gotaCeleste2.png"]
};
const IMAGENES_PASTEL = {
	Amarilla: {
		base: "bizcochueloAmarillo.png",
		granas: "bizcochueloAmarillogranas.png",
		frutillas: "bizcochueloAmarillofrutilla.png",
		velas: "bizcochueloAmarillovelas.png"
	},
	Celeste: {
		base: "bizcochueloCeleste.png",
		granas: "bizcochueloCelestegranas.png",
		frutillas: "bizcochueloCelestefrutillas.png",
		velas: "bizcochueloCelestevelas.png"
	},
	Rosa: {
		base: "bizcochueloRosa.png",
		granas: "bizcochueloRosagranas.png",
		frutillas: "bizcochueloRosafrutillas.png",
		velas: "bizcochueloRosavelas.png"
	}
};
const CONFETI = Array.from({ length: 44 }, (_, index) => ({
	left: `${(index * 37) % 100}%`,
	delay: `${(index % 11) * 0.12}s`,
	color: ["#ff4081", "#ffcb35", "#28c6e8", "#8d62dd", "#61c86b"][index % 5]
}));

function crearRonda(letra, palabraAnterior) {
	const grupo = GROUPS[Object.hasOwn(GROUPS, letra) ? letra : "l"];
	const candidatas = grupo.items.filter((palabra) => palabra !== palabraAnterior);
	const palabra = candidatas[Math.floor(Math.random() * candidatas.length)];
	const opciones = shuffle([palabra, ...shuffle(grupo.items.filter((item) => item !== palabra)).slice(0, 2)]);
	return {
		palabra,
		opciones: opciones.map((valor, indice) => ({
			id: `${indice}-${valor}`,
			valor,
			correcta: valor === palabra
		}))
	};
}

function obtenerDireccionEntrada(etapa) {
	return ["right", "bottom", "right", "left"][etapa];
}

function obtenerDireccionSalida(etapa) {
	return ["left", "left", "right", "right"][etapa];
}

export default function Decora() {
	usePageTitle("Decora");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const letra = Object.hasOwn(GROUPS, menuOption) ? menuOption : "l";
	const [etapa, setEtapa] = useState(0);
	const [ronda, setRonda] = useState(() => crearRonda(letra));
	const [fase, setFase] = useState("playing");
	const [seleccionada, setSeleccionada] = useState(null);
	const [retroalimentacion, setRetroalimentacion] = useState(null);
	const [colorPastel, setColorPastel] = useState(null);
	const [decoracionPastel, setDecoracionPastel] = useState("base");
	const [crema, setCrema] = useState(null);
	const [bizcochueloConCremaVisible, setBizcochueloConCremaVisible] = useState(false);
	const [gotas, setGotas] = useState(null);
	const [efecto, setEfecto] = useState(null);
	const [transicion, setTransicion] = useState(null);
	const [transicionVisual, setTransicionVisual] = useState(null);
	const [fondoArriba, setFondoArriba] = useState(false);
	const [confetiVisible, setConfetiVisible] = useState(false);
	const [entradaInicial, setEntradaInicial] = useState(true);
	const interactionRef = useRef(false);
	const sceneRef = useRef(null);
	const strawberryBoxRefs = useRef([]);
	const candleDisplayRefs = useRef([]);
	const audioRef = useRef(null);
	const audioSequenceRef = useRef(0);
	const timersRef = useRef(new Set());

	const limpiarTemporizadores = useCallback(() => {
		timersRef.current.forEach((timer) => runtime.clearTimeout(timer));
		timersRef.current.clear();
	}, [runtime]);

	const programar = useCallback((callback, delay) => {
		let timer;
		timer = runtime.setTimeout(() => {
			timersRef.current.delete(timer);
			callback();
		}, delay);
		timersRef.current.add(timer);
		return timer;
	}, [runtime]);

	const detenerAudio = useCallback(() => {
		audioSequenceRef.current += 1;
		const audio = audioRef.current;
		audioRef.current = null;
		if (audio) {
			audio.onended = null;
			audio.pause();
			audio.currentTime = 0;
		}
		stopTalking();
	}, [stopTalking]);

	const reproducirAudio = useCallback((nombre) => {
		detenerAudio();
		const secuencia = audioSequenceRef.current;
		const audio = runtime.audio(sound(nombre), { preload: true });
		audioRef.current = audio;
		startTalking();
		audio.onended = () => {
			if (audioSequenceRef.current !== secuencia || audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
		};
		audio.play().catch((error) => {
			if (audioSequenceRef.current !== secuencia || audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
			console.error(`No se pudo reproducir el audio ${nombre}.`, error);
		});
	}, [detenerAudio, runtime, startTalking, stopTalking]);

	useEffect(() => {
		if (fase === "playing") {
			reproducirAudio(`PL${ronda.palabra.toLowerCase()}.mp3`);
		} else if (fase === "complete") {
			reproducirAudio("Fabuloso.mp3");
		}
		return detenerAudio;
	}, [detenerAudio, fase, reproducirAudio, ronda]);

	useEffect(() => {
		const timer = runtime.setTimeout(() => setEntradaInicial(false), 1150);
		return () => runtime.clearTimeout(timer);
	}, [runtime]);

	useEffect(() => () => {
		limpiarTemporizadores();
		detenerAudio();
	}, [detenerAudio, limpiarTemporizadores]);

	function reproducirError() {
		const audio = runtime.audio(sound("error.mp3"), { preload: true });
		audio.play().catch((error) => {
			console.error("No se pudo reproducir el sonido de error.", error);
		});
	}

	function obtenerColorManga(opcion) {
		const indice = ronda.opciones.findIndex(({ id }) => id === opcion.id);
		return MANGA_COLORES[indice];
	}

	function pasarEtapa(siguienteEtapa, idSeleccionada) {
		const etapaAnterior = etapa;
		const rondaAnterior = ronda;
		const siguienteRonda = crearRonda(letra, rondaAnterior.palabra);
		setTransicion({
			desde: etapaAnterior,
			rondaAnterior,
			seleccionada: idSeleccionada
		});
		setEtapa(siguienteEtapa);
		setRonda(siguienteRonda);
		setSeleccionada(null);
		setRetroalimentacion(null);
		setCrema(null);
		setGotas(null);
		setEfecto(null);
		setFase("transition");
		if (etapaAnterior === 0) {
			setTransicionVisual("salida");
			programar(() => {
				setTransicion(null);
				setFondoArriba(true);
				setTransicionVisual("fondo");
				programar(() => {
					setTransicionVisual("entrada");
					programar(() => {
						setTransicionVisual(null);
						setFase("playing");
						interactionRef.current = false;
					}, 1100);
				}, 450);
			}, 950);
			return;
		}

		setTransicionVisual(null);
		programar(() => {
			setTransicion(null);
			setFase("playing");
			interactionRef.current = false;
		}, 1250);
	}

	function finalizarConError(opcion) {
		interactionRef.current = true;
		detenerAudio();
		setSeleccionada(opcion.id);
		setRetroalimentacion("wrong");
		setFase("wrong");
		reproducirError();

		if (etapa === 0) {
			setGotas({ color: obtenerColorManga(opcion) });
		}
		programar(() => {
			setSeleccionada(null);
			setRetroalimentacion(null);
			setGotas(null);
			setFase("playing");
			interactionRef.current = false;
		}, 850);
	}

	function finalizarCorrectamente(opcion) {
		interactionRef.current = true;
		detenerAudio();
		setSeleccionada(opcion.id);
		setRetroalimentacion("correct");
		setFase("correct");

		if (etapa === 0) {
			const color = obtenerColorManga(opcion);
			setDecoracionPastel("base");
			programar(() => setCrema(color), 200);
			programar(() => {
				setColorPastel(color);
				setBizcochueloConCremaVisible(true);
			}, 399);
			programar(() => setCrema(null), 400);
			programar(() => pasarEtapa(1, opcion.id), 850);
			return;
		}

		if (etapa === 1) {
			setEfecto({ tipo: "granas", indice: ronda.opciones.indexOf(opcion) });
			programar(() => {
				setDecoracionPastel("granas");
				setBizcochueloConCremaVisible(false);
			}, 930);
			programar(() => pasarEtapa(2, opcion.id), 1900);
			return;
		}

		if (etapa === 2) {
			programar(() => {
				const indice = ronda.opciones.indexOf(opcion);
				const caja = strawberryBoxRefs.current[indice];
				const escena = sceneRef.current;
				const imagen = caja?.querySelector("img");
				if (!caja || !escena || !imagen || !imagen.naturalWidth || !imagen.naturalHeight) {
					console.error("No se pudo determinar el punto de salida de las frutillas.");
					return;
				}

				const cajaRect = imagen.getBoundingClientRect();
				const escenaRect = escena.getBoundingClientRect();
				const escala = Math.min(
					cajaRect.width / imagen.naturalWidth,
					cajaRect.height / imagen.naturalHeight
				);
				const anchoImagen = imagen.naturalWidth * escala;
				const altoImagen = imagen.naturalHeight * escala;
				const izquierdaImagen = cajaRect.left + (cajaRect.width - anchoImagen) / 2;
				const arribaImagen = cajaRect.top + (cajaRect.height - altoImagen) / 2;
				const origen = {
					x: izquierdaImagen + anchoImagen / 2 - escenaRect.left,
					y: arribaImagen + altoImagen * 0.25 - escenaRect.top
				};
				setEfecto({ tipo: "frutillas", indice, origen });
			}, 350);
			programar(() => setDecoracionPastel("frutillas"), 1780);
			programar(() => pasarEtapa(3, opcion.id), 2000);
			return;
		}

		const indice = ronda.opciones.indexOf(opcion);
		const escena = sceneRef.current;
		const exhibidor = candleDisplayRefs.current[indice];
		const torta = escena?.querySelector(".decora-cake");
		if (!escena || !exhibidor || !torta) {
			console.error("No se pudo determinar el recorrido de las velas desde el exhibidor hasta la torta.");
		} else {
			const escenaRect = escena.getBoundingClientRect();
			const exhibidorRect = exhibidor.getBoundingClientRect();
			const tortaRect = torta.getBoundingClientRect();
			setEfecto({
				tipo: "velas",
				origen: {
					x: exhibidorRect.left + exhibidorRect.width / 2 - escenaRect.left,
					y: exhibidorRect.top + exhibidorRect.height * 0.24 - escenaRect.top,
					separacion: exhibidorRect.width * 0.12
				},
				destino: {
					x: tortaRect.left + tortaRect.width / 2 - escenaRect.left,
					y: tortaRect.top + tortaRect.height * 0.2 - escenaRect.top,
					separacion: tortaRect.width * 0.14
				}
			});
		}
		programar(() => {
			setDecoracionPastel("velas");
			setFase("complete");
			setConfetiVisible(true);
		}, 1450);
	}

	function elegirOpcion(opcion) {
		if (fase !== "playing" || interactionRef.current) return;
		if (opcion.correcta) {
			finalizarCorrectamente(opcion);
		} else {
			finalizarConError(opcion);
		}
	}

	function reiniciar() {
		limpiarTemporizadores();
		detenerAudio();
		interactionRef.current = false;
		setEtapa(0);
		setRonda(crearRonda(letra));
		setFase("playing");
		setSeleccionada(null);
		setRetroalimentacion(null);
		setColorPastel(null);
		setDecoracionPastel("base");
		setCrema(null);
		setBizcochueloConCremaVisible(false);
		setGotas(null);
		setEfecto(null);
		setTransicion(null);
		setTransicionVisual(null);
		setFondoArriba(false);
		setConfetiVisible(false);
		setEntradaInicial(true);
		programar(() => setEntradaInicial(false), 1150);
	}

	function renderOpcion(opcion, indice, etapaOpciones, lectura, idSeleccionada, estado) {
		const esSeleccionada = idSeleccionada === opcion.id;
		const clase = [
			"decora-choice",
			esSeleccionada && estado === "wrong" && "is-wrong",
			esSeleccionada && estado === "correct" && "is-correct"
		].filter(Boolean).join(" ");
		const props = {
			type: "button",
			disabled: !lectura,
			"aria-label": `Elegir ${opcion.valor}`,
			"aria-pressed": esSeleccionada,
			onClick: () => elegirOpcion(opcion)
		};
		const estiloIndice = { "--choice-delay": `${indice * 130}ms` };

		if (etapaOpciones === 0) {
			return (
				<button
					key={opcion.id}
					{...props}
					style={estiloIndice}
					className={`${clase} decora-manga-choice`}
				>
					<span className="decora-label">{opcion.valor}</span>
				</button>
			);
		}

		if (etapaOpciones === 1) {
			const imagen = idSeleccionada === opcion.id && estado === "correct"
				? "frascogranasAbierto.png"
				: "frascogranasCerrado.png";
			return (
				<button key={opcion.id} {...props} style={estiloIndice} className={`${clase} decora-jar`}>
					<img src={img(imagen)} alt="" draggable={false} />
					<span className="decora-label">{opcion.valor}</span>
				</button>
			);
		}

		if (etapaOpciones === 2) {
			return (
				<button
					key={opcion.id}
					ref={(element) => { strawberryBoxRefs.current[indice] = element; }}
					{...props}
					style={estiloIndice}
					className={`${clase} decora-strawberry-box`}
				>
					<img src={img("cajonfrutillas.png")} alt="" draggable={false} />
					<span className="decora-label">{opcion.valor}</span>
				</button>
			);
		}

		const imagen = idSeleccionada === opcion.id && estado === "correct"
			? "excibidorvacio.png"
			: "excibidorvelas.png";
		return (
			<button
				key={opcion.id}
				ref={(element) => { candleDisplayRefs.current[indice] = element; }}
				{...props}
				style={estiloIndice}
				className={`${clase} decora-candle-display`}
			>
				<img src={img(imagen)} alt="" draggable={false} />
				<span className="decora-label">{opcion.valor}</span>
			</button>
		);
	}

	function renderEtapa(etapaRender, rondaRender, lectura, entrada, salida, seleccionRender, estadoRender) {
		const nombreEtapa = ["mangas", "frascos", "frutillas", "velas"][etapaRender];
		const claseEntradaEtapa = entrada ? `decora-enter-${entrada}` : "";
		const claseSalidaEtapa = salida ? `decora-exit-${salida}` : "";

		if (etapaRender === 0) {
			const indiceSeleccionado = rondaRender.opciones.findIndex(({ id }) => id === seleccionRender);
			const desplazamiento = indiceSeleccionado === 0 ? "30%" : indiceSeleccionado === 2 ? "-30%" : "0%";
			return (
				<div
					className={`decora-layer decora-layer--mangas ${claseEntradaEtapa} ${claseSalidaEtapa}`}
					style={{ "--decora-shift": estadoRender === "wrong" || estadoRender === "correct" ? desplazamiento : "0%" }}
					aria-hidden={!lectura}
				>
					<img className="decora-mangas-image" src={img("mangas.png")} alt="" draggable={false} />
					<div className="decora-mangas-choices">
						{rondaRender.opciones.map((opcion, indice) => renderOpcion(
							opcion,
							indice,
							0,
							lectura,
							seleccionRender,
							estadoRender
						))}
					</div>
					{gotas && (
						<div className={`decora-drops decora-drops--${rondaRender.opciones.findIndex(({ id }) => id === seleccionRender)}`} aria-hidden="true">
							{IMAGENES_GOTAS[gotas.color].map((imagen) => (
								<img key={imagen} src={img(imagen)} alt="" draggable={false} />
							))}
						</div>
					)}
				</div>
			);
		}

		if (etapaRender === 1) {
			return (
				<div className={`decora-layer decora-layer--${nombreEtapa} ${claseEntradaEtapa} ${claseSalidaEtapa}`} aria-hidden={!lectura}>
					{rondaRender.opciones.map((opcion, indice) =>
						renderOpcion(opcion, indice, 1, lectura, seleccionRender, estadoRender)
					)}
				</div>
			);
		}

		if (etapaRender === 2) {
			return (
				<div className={`decora-layer decora-layer--${nombreEtapa}${estadoRender === "correct" ? " is-correct" : ""} ${claseEntradaEtapa} ${claseSalidaEtapa}`} aria-hidden={!lectura}>
					{rondaRender.opciones.map((opcion, indice) => renderOpcion(
						opcion,
						indice,
						2,
						lectura,
						seleccionRender,
						estadoRender
					))}
				</div>
			);
		}

		return (
			<div className={`decora-layer decora-layer--${nombreEtapa} ${claseEntradaEtapa} ${claseSalidaEtapa}`} aria-hidden={!lectura}>
				{rondaRender.opciones.map((opcion, indice) => renderOpcion(
					opcion,
					indice,
					3,
					lectura,
					seleccionRender,
					estadoRender
				))}
			</div>
		);
	}

	const transicionInactiva = transicion !== null;
	const imagenPastel = colorPastel
		? IMAGENES_PASTEL[colorPastel][decoracionPastel]
		: "bizcochuelo.png";
	const mostrandoBizcochueloBase = !colorPastel;
	const mostrarBizcochueloConCrema = Boolean(colorPastel && bizcochueloConCremaVisible);

	return (
		<div className={`page activity-page decora-page${fondoArriba ? " decora-page--fondo-arriba" : ""}`}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={reiniciar}>
					&#x21bb; Reiniciar
				</button>
			</div>
			{character && (
				<div className="decora-character">
					<Character
						character={character}
						mouth={mouth}
						label={fase === "playing" ? "Escuchar la palabra otra vez" : "Personaje"}
						onClick={fase === "playing" ? () => reproducirAudio(`PL${ronda.palabra.toLowerCase()}.mp3`) : undefined}
					/>
				</div>
			)}
			<main ref={sceneRef} className={`decora-scene${fase === "complete" ? " is-complete" : ""}${fondoArriba ? " decora-scene--fondo-arriba" : ""}`} aria-label="Actividad de decorar el pastel">
				<div className={`decora-cake${decoracionPastel === "velas" ? " decora-cake--velas" : ""}`} aria-live="polite">
					<img
						src={img(mostrandoBizcochueloBase ? "bizcochuelo.png" : imagenPastel)}
						alt={mostrandoBizcochueloBase ? "" : "Pastel en decoración"}
						draggable={false}
					/>
				</div>
				{crema && fase === "correct" && (
					<img className="decora-cream" src={img(`crema${crema}.png`)} alt="" draggable={false} />
				)}
				{efecto && fase === "correct" && (
					<div className={`decora-flying decora-flying--${efecto.tipo}`} aria-hidden="true">
						{(efecto.tipo === "frutillas" ? Array.from({ length: 5 }, (_, index) => index) : efecto.tipo === "velas" ? Array.from({ length: 5 }, (_, index) => index) : [0]).map((indice) => (
							<img
								key={indice}
								src={img(efecto.tipo === "frutillas" ? "frutilladecora.png" : efecto.tipo === "velas" ? `vela${indice + 1}.png` : "granas.png")}
								alt=""
								draggable={false}
								style={{
									"--flight-delay": `${indice * 100}ms`,
									"--flight-fruit-x": efecto.tipo === "frutillas" ? `${efecto.origen.x + (indice - 2) * 12}px` : "50%",
									"--flight-fruit-y": efecto.tipo === "frutillas" ? `${efecto.origen.y + (indice % 2) * 8}px` : "50%",
									"--flight-candle-x": efecto.tipo === "velas" ? `${efecto.origen.x + (indice - 2) * efecto.origen.separacion}px` : "50%",
									"--flight-candle-y": efecto.tipo === "velas" ? `${efecto.origen.y}px` : "50%",
									"--flight-candle-target-x": efecto.tipo === "velas" ? `${efecto.destino.x + (indice - 2) * efecto.destino.separacion}px` : "50%",
									"--flight-candle-target-y": efecto.tipo === "velas" ? `${efecto.destino.y}px` : "50%",
									"--flight-x": efecto.tipo === "granas"
										? efecto.indice === 0
											? "calc(50% - var(--decora-jar-offset))"
											: efecto.indice === 2
												? "calc(50% + var(--decora-jar-offset))"
												: "50%"
										: `${efecto.tipo === "frutillas" ? 43 + efecto.indice * 7 + indice * 2 : 14 + efecto.indice * 34}%`,
									"--flight-y": `${efecto.tipo === "frutillas" ? 22 + efecto.indice * 26 : efecto.tipo === "velas" ? 49 : 70}%`,
									"--flight-dy": "-18vh"
								}}
							/>
						))}
					</div>
				)}
				{transicion && renderEtapa(
					transicion.desde,
					transicion.rondaAnterior,
					false,
					null,
					obtenerDireccionSalida(transicion.desde),
					transicion.seleccionada,
					"correct"
				)}
				{etapa < 4 && !(etapa === 1 && transicionVisual && transicionVisual !== "entrada") && renderEtapa(
					etapa,
					ronda,
					fase === "playing" && !transicionInactiva,
					transicionVisual === "entrada"
						? obtenerDireccionEntrada(etapa)
						: transicion
							? obtenerDireccionEntrada(etapa)
						: entradaInicial && etapa === 0
							? "right"
							: null,
					null,
					seleccionada,
					retroalimentacion
				)}
				{mostrarBizcochueloConCrema && (
					<div className="decora-cake decora-cake--frosted" aria-hidden="true">
						<img src={img(imagenPastel)} alt="" draggable={false} />
					</div>
				)}
				{confetiVisible && (
					<div className="decora-confetti" aria-hidden="true">
						{CONFETI.map((particula, indice) => (
							<span
								key={indice}
								style={{
									"--confetti-left": particula.left,
									"--confetti-delay": particula.delay,
									"--confetti-color": particula.color
								}}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
