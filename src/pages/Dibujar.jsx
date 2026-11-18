import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import GuiaTrazado from "../components/GuiaTrazado";
import PremioComida, { useRecompensa } from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { commonSound, sound, MUNDO1_MOUTH_IMAGES, MUNDO2_MOUTH_IMAGES, MUNDO3_MOUTH_IMAGES, MUNDO4_MOUTH_IMAGES, MUNDO5_MOUTH_IMAGES } from "../lib/assets";
import { DIBUJAR_POR_MUNDO, PRIMERA_LETRA, audioDeTrazo } from "../lib/dibujar";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import {
	CURVE_COMPLETE_PROGRESS,
	advancePath,
	anchoDeTablero,
	armarTrazos,
	getPathPoint,
	puntosHasta,
	samePoint,
} from "../lib/trazados";
import "./Dibujar.css";

const BOCAS = { 1: MUNDO1_MOUTH_IMAGES, 2: MUNDO2_MOUTH_IMAGES, 3: MUNDO3_MOUTH_IMAGES, 4: MUNDO4_MOUTH_IMAGES, 5: MUNDO5_MOUTH_IMAGES };
// Distancia al punto donde quedó el trazo (o al punto para tocar) para poder apoyar el dedo.
const TOQUE = 0.12;

// Dibujar en todos los mundos: se traza cada opción de la lista de la izquierda (las vocales en
// Mundo 1, o las sílabas de la letra: LA, LE, LI...). Al terminar una se la nombra y se pasa sola a la
// siguiente que falte; con todas, 3 galletitas para el monstruo de la letra.
export default function Dibujar() {
	const location = useLocation();
	const mundo = DIBUJAR_POR_MUNDO[location.state?.world] ? location.state.world : 1;
	usePageTitle(`Dibujar - Mundo ${mundo}`);
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, location.state?.world ? BOCAS[mundo] : undefined);
	const menuOption = useActivityMenuOption();
	const opcionesDelMundo = DIBUJAR_POR_MUNDO[mundo];
	const [letra] = useState(() => (Object.hasOwn(opcionesDelMundo, menuOption) ? menuOption : PRIMERA_LETRA[mundo]));
	const opciones = opcionesDelMundo[letra];
	// Las vocales de Mundo 1 trazan la i minúscula, como siempre; en las sílabas la I va en mayúscula.
	const vocales = mundo === 1 && letra === "a";
	const [ancho] = useState(() => anchoDeTablero(opciones, vocales));
	const [premio, otorgarPremio] = useRecompensa("dibujar", letra);

	const [activa, setActiva] = useState(opciones[0]);
	const [trazos, setTrazos] = useState(() => armarTrazos(opciones[0], ancho, vocales));
	// Trazo en curso y su avance (0 a 1): viven en refs porque se leen dentro de los movimientos del dedo.
	const [indice, setIndice] = useState(0);
	const [avance, setAvance] = useState(0);
	const juego = useRef({ indice: 0, avance: 0, terminada: false, hechas: new Set(), premiada: false }).current;
	const [arrastrando, setArrastrando] = useState(false);
	const [terminada, setTerminada] = useState(false);
	const [hechas, setHechas] = useState(() => new Set());
	const boardRef = useRef(null);

	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [aciertoAudio] = useState(() => runtime.audio(commonSound("acierto.mp3"), { preload: true }));
	const [dibujasteAudio] = useState(() => runtime.audio(sound("dibujaste.mp3"), { preload: true }));
	const [instructionAudio] = useState(() => runtime.audio(sound("dibujarConsigna.mp3"), { preload: true }));
	const [dibujarAhoraAudio] = useState(() => runtime.audio(sound("dibujarAhora.mp3"), { preload: true }));
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));

	useEffect(() => {
		const timer = runtime.setTimeout(playInstruction, 500);
		return () => runtime.clearTimeout(timer);
	}, []);

	const trazo = trazos[indice];
	// Dónde apoyar el dedo: donde quedó el trazo, o el punto para tocar.
	const apoyo = trazo ? (trazo.punto ?? getPathPoint(trazo.path, avance)) : null;

	function playInstruction() {
		secuencia.reproducir([instructionAudio]);
	}

	function getBoardPoint(event) {
		const board = boardRef.current;
		const point = event?.touches?.[0] ?? event?.changedTouches?.[0] ?? event;
		const bounds = board.getBoundingClientRect();
		// La unidad es el alto del tablero (las letras están en celdas cuadradas).
		return {
			x: ((point?.clientX ?? 0) - bounds.left - board.clientLeft) / board.clientHeight,
			y: ((point?.clientY ?? 0) - bounds.top - board.clientTop) / board.clientHeight,
		};
	}

	function cambiarAvance(valor) {
		juego.avance = valor;
		setAvance(valor);
	}

	function cambiarTrazo(valor) {
		juego.indice = valor;
		setIndice(valor);
		cambiarAvance(0);
	}

	// Empieza de cero la opción `texto` (o la misma, después de terminarla).
	function empezar(texto) {
		juego.terminada = false;
		setTerminada(false);
		setArrastrando(false);
		setActiva(texto);
		setTrazos(armarTrazos(texto, ancho, vocales));
		cambiarTrazo(0);
	}

	function elegir(texto) {
		if (!opciones.includes(texto)) return;
		secuencia.cancelar();
		stopTalking();
		empezar(texto);
	}

	function terminarTrazo() {
		const siguiente = juego.indice + 1;
		if (siguiente < trazos.length) {
			cambiarTrazo(siguiente);
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
			return;
		}
		cambiarAvance(1);
		juego.indice = siguiente;
		setIndice(siguiente);
		terminarOpcion();
	}

	// Al completar: acierto y el nombre ("¡Muy bien! Dibujaste la letra:" en las vocales). Después
	// sigue sola la próxima que falte; si ya están todas, se puede volver a trazar la misma.
	function terminarOpcion() {
		juego.terminada = true;
		setTerminada(true);
		juego.hechas.add(activa);
		setHechas(new Set(juego.hechas));
		if (juego.hechas.size === opciones.length && !juego.premiada) {
			juego.premiada = true;
			otorgarPremio(0, 3);
		}
		const nombre = runtime.audio(sound(audioDeTrazo(activa)));
		secuencia.reproducir(vocales ? [mudo(aciertoAudio), dibujasteAudio, nombre] : [mudo(aciertoAudio), nombre], () => {
			const desde = opciones.indexOf(activa);
			const siguiente = [...opciones.slice(desde + 1), ...opciones.slice(0, desde)].find((texto) => !juego.hechas.has(texto));
			if (!siguiente) {
				empezar(activa);
				return;
			}
			empezar(siguiente);
			// "Ahora dibujá la letra:" solo tiene sentido con las vocales.
			if (vocales) secuencia.reproducir([dibujarAhoraAudio, runtime.audio(sound(audioDeTrazo(siguiente)))]);
		});
	}

	// Si se va antes de terminar todas: 2 comidas con 3 o más hechas, 1 con alguna.
	function leaveActivity() {
		if (!juego.premiada) {
			const cantidad = juego.hechas.size >= 3 ? 2 : juego.hechas.size > 0 ? 1 : 0;
			if (cantidad > 0) {
				juego.premiada = true;
				otorgarPremio(0, cantidad);
				return;
			}
		}
		window.history.back();
	}

	function startDragging(event) {
		if (juego.terminada || !trazo) return;
		const point = getBoardPoint(event);
		event.preventDefault();
		if (trazo.punto) {
			if (samePoint(point, trazo.punto, TOQUE)) terminarTrazo();
			return;
		}
		// Se retoma desde donde quedó el trazo (al principio, es el punto de inicio).
		if (!samePoint(point, getPathPoint(trazo.path, juego.avance), TOQUE)) return;
		setArrastrando(true);
		if (typeof event?.pointerId !== "undefined") {
			boardRef.current?.setPointerCapture(event.pointerId);
		}
	}

	function movePointer(event) {
		if (!arrastrando || juego.terminada || !trazo?.path) return;
		const siguiente = advancePath(trazo.path, juego.avance, getBoardPoint(event));
		if (siguiente === null) return;
		cambiarAvance(siguiente);
		// Al llegar al final se completa sin tener que soltar el dedo.
		if (siguiente >= CURVE_COMPLETE_PROGRESS) {
			setArrastrando(false);
			terminarTrazo();
		}
	}

	function finishDragging(event) {
		const pointerId = event?.pointerId;
		if (boardRef.current && typeof pointerId !== "undefined") {
			try {
				boardRef.current.releasePointerCapture(pointerId);
			} catch {
				// Ignorar si el elemento no tenía capturado el puntero.
			}
		}
		// Si se suelta antes de terminar, el trazo queda donde está para continuarlo.
		setArrastrando(false);
	}

	// Flecha punteada desde el punto de apoyo hacia donde va el trazo (antes de empezarlo).
	const mostrarGuia = !terminada && trazo && !arrastrando;
	const destinoGuia = mostrarGuia && trazo.path && avance === 0
		? getPathPoint(trazo.path, Math.min(1, 0.3 / trazo.path[trazo.path.length - 1].distance))
		: null;
	const xy = (punto) => `${punto.x * 100},${punto.y * 100}`;

	return (
		<div className={`page activity-page page-dibujar dibujar-mundo${mundo}`}>
			<BackButton onClick={leaveActivity} />
			<FullscreenButton toggle />
			<button className="dibujar-clear" type="button" onClick={() => elegir(activa)} aria-label="Borrar y empezar de nuevo">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /></svg>
			</button>
			<main className="dibujar-layout">
				<div className="dibujar-workspace">
					<div className={`dibujar-vowel-picker${vocales ? "" : " dibujar-silabas"}`} aria-label="Qué dibujar">
						{opciones.map((texto) => (
							<button
								key={texto}
								type="button"
								className={`dibujar-vowel-button${texto === activa ? " selected" : ""}${hechas.has(texto) ? " hecha" : ""}`}
								onClick={() => elegir(texto)}
								aria-label={`Dibujar ${texto}${hechas.has(texto) ? ", ya dibujada" : ""}`}
							>
								{texto}
							</button>
						))}
					</div>
					<section
						className="dibujar-board"
						ref={boardRef}
						style={{ "--dibujar-ancho": ancho }}
						onPointerDown={startDragging}
						onPointerMove={movePointer}
						onPointerUp={finishDragging}
						onPointerCancel={finishDragging}
						onPointerLeave={finishDragging}
						onTouchStart={startDragging}
						onTouchMove={movePointer}
						onTouchEnd={finishDragging}
						onTouchCancel={finishDragging}
						aria-label={`Trazar ${activa}`}
					>
						<GuiaTrazado ancho={ancho} trazos={trazos} />
						{mostrarGuia && (
							<div
								className="dibujar-point dibujar-point-start dibujar-point-guia"
								style={{ left: `${(apoyo.x / ancho) * 100}%`, top: `${apoyo.y * 100}%` }}
							/>
						)}
						<svg className="dibujar-trace" viewBox={`0 0 ${ancho * 100} 100`} aria-hidden="true">
							<defs>
								<marker id="dibujar-flecha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
									<path d="M0 0L10 5L0 10z" fill="#3a2a63" />
								</marker>
							</defs>
							{destinoGuia && (
								<line
									className="dibujar-guia-linea"
									x1={apoyo.x * 100}
									y1={apoyo.y * 100}
									x2={destinoGuia.x * 100}
									y2={destinoGuia.y * 100}
									stroke="#3a2a63"
									strokeWidth="2.5"
									strokeDasharray="4 4"
									strokeLinecap="round"
									markerEnd="url(#dibujar-flecha)"
								/>
							)}
							{trazos.map((cada, numero) => {
								if (numero > indice || (numero === indice && avance === 0)) return null;
								if (cada.punto) {
									return <circle key={numero} cx={cada.punto.x * 100} cy={cada.punto.y * 100} r="7" fill="#fc2cd2" />;
								}
								const hasta = numero < indice ? 1 : avance;
								return (
									<polyline
										key={numero}
										points={puntosHasta(cada.path, hasta).map(xy).join(" ")}
										fill="none"
										stroke="#fc2cd2"
										strokeWidth="10"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								);
							})}
						</svg>
					</section>
				</div>
			</main>
			<Character character={character} mouth={mouth} label="Repetir consigna" onClick={playInstruction} />
			<PremioComida premio={premio} />
		</div>
	);
}
