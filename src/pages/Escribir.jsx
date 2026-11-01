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

const TECLADO = [
	{ clase: "consonantes", letras: ["L", "M", "S", "T"] },
	{ clase: "vocales", letras: ["A", "E", "I", "O", "U"] }
];

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
				<main className="escribir-escena" aria-label="Actividad de escribir palabras">
					<div className="escribir-pasos" aria-hidden="true">
						{ETAPA_IMAGENES[sabor].map((src, indice) => (
							<span key={indice} className={`escribir-paso${etapa > indice ? " hecho" : etapa === indice ? " actual" : ""}`}>
								<span className="escribir-paso-numero">{indice + 1}</span>
								<span className="escribir-paso-icono">
									<img src={src} alt="" />
								</span>
							</span>
						))}
					</div>

					<div className={`escribir-maquina${estado === "mal" ? " escribir-maquina-mal" : ""}`}>
						<div className="escribir-visor">
							<span className="escribir-visor-icono">
								<img src={ETAPA_IMAGENES[sabor][etapa]} alt="" />
							</span>
							<span className="escribir-visor-igual">=</span>
							<span className="escribir-visor-palabra">{palabra}</span>
						</div>
						<div className="escribir-casillas" aria-label={`Escribí ${palabra}`}>
							{Array.from({ length: palabra.length }, (_, indice) => (
								<span key={indice} className={`escribir-casilla${escrito[indice] ? " llena" : ""}`}>
									{escrito[indice] || ""}
								</span>
							))}
						</div>
						<div className="escribir-teclado">
							{TECLADO.map((fila) => (
								<div key={fila.clase} className={`escribir-fila-teclado escribir-fila-teclado-${fila.clase}`}>
									{fila.letras.map((letra) => (
										<button
											key={letra}
											type="button"
											className="escribir-tecla"
											disabled={bloqueado || escrito.length >= palabra.length}
											aria-label={`Letra ${letra}`}
											onClick={() => presionarLetra(letra)}
										>
											{letra}
										</button>
									))}
								</div>
							))}
						</div>
						<div className="escribir-controles-maquina">
							<button
								type="button"
								className="escribir-boton-borrar"
								aria-label="Borrar letra"
								disabled={bloqueado || escrito.length === 0}
								onClick={borrarLetra}
							>
								&#x2190;
							</button>
							<button
								type="button"
								className="escribir-boton-confirmar"
								aria-label="Confirmar palabra"
								disabled={bloqueado || escrito.length !== palabra.length}
								onClick={confirmar}
							>
								&#x2713;
							</button>
						</div>
					</div>

					<div className="escribir-entrega">
						<span className="escribir-tunel" aria-hidden="true" />
						<span className="escribir-entrega-producto">
							{etapa > 0 && <img key={etapa} src={ETAPA_IMAGENES[sabor][etapa - 1]} alt="" />}
						</span>
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
