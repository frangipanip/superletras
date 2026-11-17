import { useEffect, useRef, useState } from "react";
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
import { img, sound } from "../lib/assets";
import { archivoPalabra, ORACIONES } from "../lib/oraciones";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./Oraciones.css";

export default function Oraciones() {
	usePageTitle("Oraciones - Mundo 1");
	const runtime = usePageRuntime();
	const letra = useActivityMenuOption();
	const [personaje] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const [premio, otorgar] = useRecompensa("oraciones", letra || "a");
	const [ronda, setRonda] = useState(null);
	const [arrastre, setArrastre] = useState(null);
	const [audios] = useState(() => ({}));
	const tablero = useRef(null);
	const game = useRef({ indice: 0, token: 0, errores: 0, bloqueado: false, rondas: [], ronda: null, drag: null }).current;

	function audio(archivo) {
		if (!audios[archivo]) audios[archivo] = runtime.audio(sound(archivo), { preload: true });
		return audios[archivo];
	}

	function audioOracion() { return audio(`oraciones/${game.ronda.oracion.audio}.mp3`); }

	function repetir() {
		if (!game.ronda || game.bloqueado) return;
		secuencia.reproducir([audio("oracionesConsigna.mp3"), audioOracion()]);
	}

	function cargarRonda() {
		game.token += 1;
		const { oracion, modelo } = game.rondas[game.indice];
		game.ronda = {
			oracion, modelo, token: game.token, completada: false, incorrecta: null,
			casilleros: oracion.texto.split(" ").map((palabra) => ({ palabra, llena: false })),
			opciones: shuffle(oracion.texto.split(" ").map((palabra, id) => ({ palabra, id, usada: false })))
		};
		game.bloqueado = false;
		game.drag = null;
		setArrastre(null);
		setRonda(game.ronda);
		ayuda.reiniciar();
		repetir();
	}

	function reiniciar() {
		secuencia.cancelar();
		game.indice = 0;
		game.errores = 0;
		game.rondas = [
			...shuffle(ORACIONES).map((oracion) => ({ oracion, modelo: true })),
			...shuffle(ORACIONES).map((oracion) => ({ oracion, modelo: false }))
		];
		cargarRonda();
	}

	function actualizar(cambios) {
		game.ronda = { ...game.ronda, ...cambios };
		setRonda(game.ronda);
	}

	function colocar(indice, destino) {
		const actual = game.ronda;
		const opcion = actual.opciones[indice];
		const casillero = actual.casilleros[destino];
		if (game.bloqueado || !casillero || casillero.llena || opcion.usada) return;
		game.bloqueado = true;
		const token = game.token;
		if (opcion.palabra !== casillero.palabra) {
			game.errores += 1;
			actualizar({ incorrecta: indice });
			secuencia.reproducir([audio(archivoPalabra(opcion.palabra)), mudo(audio("error.mp3")), ...ayuda.trasError(audioOracion())], () => {
				if (token !== game.token) return;
				actualizar({ incorrecta: null });
				game.bloqueado = false;
			});
			return;
		}
		const casilleros = actual.casilleros.map((c, i) => i === destino ? { ...c, llena: true } : c);
		const completa = casilleros.every((c) => c.llena);
		actualizar({ casilleros, opciones: actual.opciones.map((o, i) => i === indice ? { ...o, usada: true } : o), completada: completa });
		secuencia.reproducir([
			audio(archivoPalabra(opcion.palabra)),
			...(completa ? [mudo(audio("correcto.mp3")), audioOracion()] : [])
		], () => {
			if (token !== game.token) return;
			if (!completa) { game.bloqueado = false; return; }
			runtime.setTimeout(() => {
				if (token !== game.token) return;
				if (game.indice === game.rondas.length - 1) {
					secuencia.reproducir([audio("Fabuloso.mp3")], () => otorgar(game.errores));
				} else {
					game.indice += 1;
					cargarRonda();
				}
			}, 900);
		});
	}

	function elegir(indice) {
		colocar(indice, game.ronda.casilleros.findIndex((c) => !c.llena));
	}

	function empezarArrastre(event, indice) {
		if (game.bloqueado || game.ronda.opciones[indice].usada) return;
		const caja = event.currentTarget.getBoundingClientRect();
		game.drag = { indice, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, width: caja.width, height: caja.height };
		setArrastre(game.drag);
		event.preventDefault();
	}

	function moverArrastre(event) {
		if (!game.drag) return;
		game.drag = { ...game.drag, x: event.clientX, y: event.clientY };
		setArrastre(game.drag);
	}

	function cancelarArrastre() { game.drag = null; setArrastre(null); }

	function soltarArrastre(event) {
		if (!game.drag) return;
		const { indice, startX, startY } = game.drag;
		cancelarArrastre();
		if (Math.hypot(event.clientX - startX, event.clientY - startY) < 12) { elegir(indice); return; }
		const casilleros = [...tablero.current.querySelectorAll(".oracion-casillero")];
		const destino = casilleros.findIndex((elemento) => {
			const rect = elemento.getBoundingClientRect();
			return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
		});
		colocar(indice, destino);
	}

	useEffect(() => {
		reiniciar();
		window.addEventListener("pointermove", moverArrastre);
		window.addEventListener("pointerup", soltarArrastre);
		window.addEventListener("pointercancel", cancelarArrastre);
		return () => {
			secuencia.cancelar();
			window.removeEventListener("pointermove", moverArrastre);
			window.removeEventListener("pointerup", soltarArrastre);
			window.removeEventListener("pointercancel", cancelarArrastre);
		};
	}, []);

	const siguiente = ronda?.casilleros.find((c) => !c.llena)?.palabra;
	return (
		<div className="page activity-page page-oraciones">
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls"><button className="restart-button" type="button" aria-label="Reiniciar actividad" onClick={reiniciar}>↻</button></div>
			{ronda && <main className={ronda.completada ? "oracion-juego completada" : "oracion-juego"}>
				<div className="oracion-avance" role="status" aria-label={`Vuelta ${ronda.modelo ? 1 : 2}, oración ${game.indice % ORACIONES.length + 1} de ${ORACIONES.length}`}>
					<svg className="oracion-modelo-icono" viewBox="0 0 24 24" aria-label={ronda.modelo ? "Con modelo" : "Sin modelo"} fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{!ronda.modelo && <path d="M3 3l18 18" />}</svg>
					{ORACIONES.map((o, i) => <span key={o.id} className={i < game.indice % ORACIONES.length ? "hecha" : i === game.indice % ORACIONES.length ? "actual" : ""} aria-hidden="true">●</span>)}
				</div>
				<img key={ronda.token} className="oracion-dibujo" src={img(`oraciones/${ronda.oracion.id}.png`)} alt={ronda.oracion.texto} draggable={false} />
				<div className="oracion-tablero" ref={tablero} style={{ "--palabras": ronda.casilleros.length }} aria-label="Palabras en orden">
					{ronda.casilleros.map((c, i) => <div key={i} className={`oracion-casillero${c.llena ? " llena" : ""}`} aria-label={`Lugar ${i + 1}${c.llena ? `: ${c.palabra}` : " vacío"}`}>
						{c.llena ? c.palabra : ronda.modelo ? <span className="oracion-modelo">{c.palabra}</span> : <span className="oracion-vacio" aria-hidden="true">·</span>}
					</div>)}
				</div>
				<div className="oracion-opciones" aria-label="Fichas de palabras">
					{ronda.opciones.map((o, i) => <button className={`oracion-ficha${ronda.incorrecta === i ? " incorrecta" : ""}${ayuda.pista && o.palabra === siguiente && !o.usada ? " pista-correcta" : ""}`} type="button" key={`${ronda.token}-${o.id}`} aria-label={`Palabra ${o.palabra}`} disabled={o.usada} style={arrastre?.indice === i ? { opacity: 0.3 } : undefined} onPointerDown={(event) => empezarArrastre(event, i)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); elegir(i); } }}>{o.palabra}</button>)}
				</div>
			</main>}
			{arrastre && <div className="oracion-ficha arrastrando" aria-hidden="true" style={{ left: arrastre.x, top: arrastre.y, width: arrastre.width, height: arrastre.height }}>{ronda.opciones[arrastre.indice].palabra}</div>}
			<Character character={personaje} mouth={mouth} label="Repetir oración" onClick={repetir} />
			<PremioComida premio={premio} />
		</div>
	);
}
