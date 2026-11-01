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
import "./actividad.css";
import "./Escribir.css";

const LETRAS = ["L", "M", "S", "T", "A", "E", "I", "O", "U"];

const SABORES = {
	helado: { nombre: "Helado" },
	cupcake: { nombre: "Cupcake" },
	bebida: { nombre: "Bebida" }
};

// Foto del producto acumulado luego de cada etapa (recortada y compuesta a partir de las
// imágenes que mandó Paula de la máquina de golosinas). Cada imagen ya incluye las piezas
// de las etapas anteriores, lista para mostrar tal cual según cuántas se entregaron.
const ETAPA_IMAGENES = {
	helado: [img("escribirHeladoPaso1.png"), img("escribirHeladoPaso2.png"), img("escribirHeladoPaso3.png")],
	cupcake: [img("escribirCupcakePaso1.png"), img("escribirCupcakePaso2.png"), img("escribirCupcakePaso3.png")],
	bebida: [img("escribirBebidaPaso1.png"), img("escribirBebidaPaso2.png"), img("escribirBebidaPaso3.png")]
};

// La foto de la máquina de Paula, con la palabra de ejemplo y el ícono fijo "despintados"
// para poner ahí encima el ícono/palabra de cada ronda. El resto (teclado, casillas, botones,
// pasos 1-2-3, túnel) se usa tal cual: los controles se ubican por encima en las mismas
// coordenadas (en % sobre la foto) donde están dibujados en la imagen.
const FONDO_FABRICA = {
	helado: img("escribirMaquinaHelado.jpg"),
	cupcake: img("escribirMaquinaCupcake.jpg"),
	bebida: img("escribirMaquinaBebida.jpg")
};

// Posición (en % sobre la foto) de cada tecla, tomada de dónde está dibujada en la imagen.
const TECLA_POSICION = {
	L: { left: 30.62, top: 59.32, width: 6.88, height: 8.31 },
	M: { left: 39.37, top: 59.32, width: 6.88, height: 8.31 },
	S: { left: 48.12, top: 59.32, width: 6.88, height: 8.31 },
	T: { left: 56.87, top: 59.32, width: 6.88, height: 8.31 },
	A: { left: 28.44, top: 70.48, width: 6.25, height: 8.88 },
	E: { left: 36.25, top: 70.48, width: 6.25, height: 8.88 },
	I: { left: 44.06, top: 70.48, width: 6.25, height: 8.88 },
	O: { left: 51.56, top: 70.48, width: 6.25, height: 8.88 },
	U: { left: 59.06, top: 70.48, width: 6.25, height: 8.88 }
};

// Posición (en %) del círculo 1-2-3 que ya trae la foto, para dibujar el aro de "actual/hecho" encima.
const PASO_POSICION = [
	{ left: 8.1, top: 32.6, size: 11 },
	{ left: 8.1, top: 53.4, size: 11 },
	{ left: 8.1, top: 72.7, size: 11 }
];

function elegirPalabra(letra, anterior) {
	const grupo = GROUPS[Object.hasOwn(GROUPS, letra) ? letra : "l"];
	const candidatas = grupo.items.filter((palabra) => palabra !== anterior);
	return candidatas[Math.floor(Math.random() * candidatas.length)];
}

export default function Escribir() {
	usePageTitle("Escribir");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const menuOption = useActivityMenuOption();
	const letter = Object.hasOwn(GROUPS, menuOption) ? menuOption : "l";

	const [fase, setFase] = useState("elegir");
	const [sabor, setSabor] = useState(null);
	const [etapa, setEtapa] = useState(0);
	const [palabra, setPalabra] = useState(null);
	const [escrito, setEscrito] = useState([]);
	const [estado, setEstado] = useState("jugando");
	const [bloqueado, setBloqueado] = useState(false);
	const bloqueadoRef = useRef(false);
	const audioRef = useRef(null);

	function fijarBloqueado(valor) {
		bloqueadoRef.current = valor;
		setBloqueado(valor);
	}

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

	const reproducirPalabra = useCallback((palabraAReproducir) => {
		detenerAudio();
		const audio = runtime.audio(sound(`PL${palabraAReproducir.toLowerCase()}.mp3`), { preload: true });
		audioRef.current = audio;
		startTalking();
		audio.onended = () => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
		};
		audio.play().catch((error) => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
			console.error(`No se pudo reproducir el audio de la palabra ${palabraAReproducir}.`, error);
		});
	}, [detenerAudio, runtime, startTalking, stopTalking]);

	const reproducirFabuloso = useCallback(() => {
		detenerAudio();
		const audio = runtime.audio(sound("Fabuloso.mp3"), { preload: true });
		audioRef.current = audio;
		startTalking();
		audio.onended = () => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
		};
		audio.play().catch((error) => {
			if (audioRef.current !== audio) return;
			audioRef.current = null;
			stopTalking();
			console.error("No se pudo reproducir el audio de Fabuloso.", error);
		});
	}, [detenerAudio, runtime, startTalking, stopTalking]);

	function reproducirCorrecto() {
		const audio = runtime.audio(sound("correcto.mp3"), { preload: true });
		audio.play().catch((error) => {
			console.error("No se pudo reproducir el sonido correcto.", error);
		});
	}

	function reproducirError() {
		const audio = runtime.audio(sound("error.mp3"), { preload: true });
		audio.play().catch((error) => {
			console.error("No se pudo reproducir el sonido de error.", error);
		});
	}

	useEffect(() => {
		if (fase === "maquina" && palabra) {
			reproducirPalabra(palabra);
			return detenerAudio;
		}
		if (fase === "listo") {
			reproducirFabuloso();
			return detenerAudio;
		}
		return undefined;
	}, [fase, palabra, reproducirPalabra, reproducirFabuloso, detenerAudio]);

	function reiniciar() {
		fijarBloqueado(false);
		detenerAudio();
		setFase("elegir");
		setSabor(null);
		setEtapa(0);
		setPalabra(null);
		setEscrito([]);
		setEstado("jugando");
	}

	useEffect(() => {
		reiniciar();
	}, [letter]);

	function elegirSabor(clave) {
		fijarBloqueado(false);
		setSabor(clave);
		setEtapa(0);
		setPalabra(elegirPalabra(letter));
		setEscrito([]);
		setEstado("jugando");
		setFase("maquina");
	}

	function presionarLetra(letra) {
		if (bloqueadoRef.current || !palabra) return;
		setEscrito((actual) => (actual.length >= palabra.length ? actual : [...actual, letra]));
	}

	function borrarLetra() {
		if (bloqueadoRef.current) return;
		setEscrito((actual) => actual.slice(0, -1));
	}

	function confirmar() {
		if (bloqueadoRef.current || !palabra || escrito.length !== palabra.length) return;
		fijarBloqueado(true);
		detenerAudio();
		if (escrito.join("") === palabra) {
			reproducirCorrecto();
			const siguienteEtapa = etapa + 1;
			runtime.setTimeout(() => {
				if (siguienteEtapa >= 3) {
					setEtapa(3);
					setFase("listo");
					fijarBloqueado(false);
				} else {
					setEtapa(siguienteEtapa);
					setPalabra(elegirPalabra(letter, palabra));
					setEscrito([]);
					fijarBloqueado(false);
				}
			}, 700);
			return;
		}
		reproducirError();
		setEstado("mal");
		runtime.setTimeout(() => {
			setEstado("jugando");
			setEscrito([]);
			fijarBloqueado(false);
		}, 600);
	}

	return (
		<div className="page activity-page page-escribir">
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls">
				<button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={reiniciar}>
					&#x21bb; Reiniciar
				</button>
			</div>
			{character && (
				<div className="escribir-personaje">
					<Character
						character={character}
						mouth={mouth}
						label={fase === "maquina" ? "Escuchar la palabra otra vez" : "Personaje"}
						onClick={fase === "maquina" && palabra ? () => reproducirPalabra(palabra) : undefined}
					/>
				</div>
			)}

			{fase === "elegir" && (
				<main className="escribir-elegir" aria-label="Elegir qué preparar">
					{Object.entries(SABORES).map(([clave, datos]) => (
						<button key={clave} type="button" className="escribir-sabor-boton" onClick={() => elegirSabor(clave)}>
							<span className="escribir-sabor-icono">
								<img src={ETAPA_IMAGENES[clave][2]} alt="" />
							</span>
							<span className="escribir-sabor-nombre">{datos.nombre}</span>
						</button>
					))}
				</main>
			)}

			{fase === "maquina" && palabra && (
				<main className="escribir-fabrica" aria-label="Actividad de escribir palabras">
					<div className={`escribir-foto-maquina${estado === "mal" ? " escribir-sacudida" : ""}`}>
						<img className="escribir-fondo-maquina" src={FONDO_FABRICA[sabor]} alt="" />

						{PASO_POSICION.map((posicion, indice) => (
							<span
								key={indice}
								aria-hidden="true"
								className={`escribir-paso-aro${etapa > indice ? " hecho" : etapa === indice ? " actual" : ""}`}
								style={{ left: `${posicion.left}%`, top: `${posicion.top}%`, width: `${posicion.size}%`, height: `${posicion.size}%` }}
							/>
						))}

						<div className="escribir-visor-overlay">
							<span className="escribir-visor-icono">
								<img src={ETAPA_IMAGENES[sabor][etapa]} alt="" />
							</span>
							<span className="escribir-visor-igual">=</span>
							<span className="escribir-visor-palabra">{palabra}</span>
						</div>

						<div className="escribir-casillas-overlay" aria-label={`Escribí ${palabra}`}>
							{Array.from({ length: palabra.length }, (_, indice) => (
								<span key={indice} className={`escribir-casilla-overlay${escrito[indice] ? " llena" : ""}`}>
									{escrito[indice] || ""}
								</span>
							))}
						</div>

						{LETRAS.map((letra) => (
							<button
								key={letra}
								type="button"
								className="escribir-tecla-overlay"
								style={{
									left: `${TECLA_POSICION[letra].left}%`,
									top: `${TECLA_POSICION[letra].top}%`,
									width: `${TECLA_POSICION[letra].width}%`,
									height: `${TECLA_POSICION[letra].height}%`
								}}
								disabled={bloqueado || escrito.length >= palabra.length}
								aria-label={`Letra ${letra}`}
								onClick={() => presionarLetra(letra)}
							/>
						))}

						<button
							type="button"
							className="escribir-boton-overlay escribir-boton-borrar-overlay"
							aria-label="Borrar letra"
							disabled={bloqueado || escrito.length === 0}
							onClick={borrarLetra}
						/>
						<button
							type="button"
							className="escribir-boton-overlay escribir-boton-confirmar-overlay"
							aria-label="Confirmar palabra"
							disabled={bloqueado || escrito.length !== palabra.length}
							onClick={confirmar}
						/>

						<div className="escribir-entrega-overlay">
							{etapa > 0 && <img key={etapa} src={ETAPA_IMAGENES[sabor][etapa - 1]} alt="" />}
						</div>
					</div>
				</main>
			)}

			{fase === "listo" && (
				<main className="escribir-listo" aria-label="Pedido listo">
					<span className="escribir-listo-producto">
						<img src={ETAPA_IMAGENES[sabor][2]} alt="" />
					</span>
					<p className="escribir-listo-texto">&iexcl;Fabuloso!</p>
					<button type="button" className="escribir-boton-otro" onClick={reiniciar}>
						Elegir otro sabor
					</button>
				</main>
			)}
		</div>
	);
}
