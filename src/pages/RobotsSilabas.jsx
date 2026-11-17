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
import { img, MUNDO5_MOUTH_IMAGES, sound } from "../lib/assets";
import { incorrectasMundo5, MUNDO5_PRESENTACIONES, MUNDO5_SYLLABLES } from "../lib/mundo5";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./RobotsSilabas.css";

export default function RobotsSilabas({ actividad }) {
	const recolectar = actividad === "mariposas";
	usePageTitle(`${recolectar ? "Robots voladores" : "Jardín de robots"} - Mundo 5`);
	const runtime = usePageRuntime();
	const opcion = useActivityMenuOption();
	const modo = Object.hasOwn(MUNDO5_SYLLABLES, opcion) ? opcion : "g";
	const [personaje] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, MUNDO5_MOUTH_IMAGES);
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const [premio, otorgar] = useRecompensa(actividad, modo);
	const [opciones, setOpciones] = useState([]);
	const [aciertos, setAciertos] = useState(0);
	const [terminado, setTerminado] = useState(false);
	const [audios] = useState(() => ({}));
	const game = useRef({ token: 0, bloqueado: false, errores: 0, ronda: 0, aciertos: 0, orden: [] }).current;
	const pedido = useRef("");
	const total = recolectar ? 5 : MUNDO5_SYLLABLES[modo].length;

	function audio(archivo) {
		if (!audios[archivo]) audios[archivo] = runtime.audio(sound(archivo), { preload: true });
		return audios[archivo];
	}

	function consigna() {
		return recolectar
			? [audio(MUNDO5_PRESENTACIONES[modo]), audio(modo === "ge" || modo === "j" ? "pecesGFuerte.mp3" : "pecesGSuave.mp3")]
			: [audio("Pulsasilaba.mp3"), audio(`${pedido.current.toLowerCase()}.mp3`)];
	}

	function cargarRonda() {
		ayuda.reiniciar();
		const correctas = MUNDO5_SYLLABLES[modo];
		pedido.current = game.orden[game.ronda];
		const etiquetas = recolectar
			? [...Array.from({ length: 5 }, (_, i) => correctas[i % correctas.length]), ...incorrectasMundo5(modo)]
			: [pedido.current, ...shuffle([...correctas.filter((s) => s !== pedido.current), ...incorrectasMundo5(modo)]).slice(0, 3)];
		setOpciones(shuffle(etiquetas).map((silaba, i) => ({ silaba, imagen: `robotSilabas${i % 4 + 1}.png`, correcta: recolectar ? correctas.includes(silaba) : silaba === pedido.current, resultado: null })));
		game.bloqueado = false;
		secuencia.reproducir(consigna());
	}

	function reiniciar() {
		secuencia.cancelar();
		game.token += 1;
		game.errores = 0;
		game.ronda = 0;
		game.aciertos = 0;
		game.orden = shuffle(MUNDO5_SYLLABLES[modo]);
		setAciertos(0);
		setTerminado(false);
		cargarRonda();
	}

	function elegir(indice) {
		const opcion = opciones[indice];
		if (game.bloqueado || opcion.resultado || terminado) return;
		game.bloqueado = true;
		const token = game.token;
		const sonido = audio(`${opcion.silaba.toLowerCase()}.mp3`);
		if (!opcion.correcta) {
			game.errores += 1;
			setOpciones((actuales) => actuales.map((o, i) => i === indice ? { ...o, resultado: "error" } : o));
			const repetir = recolectar ? audio(MUNDO5_PRESENTACIONES[modo]) : audio(`${pedido.current.toLowerCase()}.mp3`);
			secuencia.reproducir([sonido, mudo(audio("error.mp3")), ...ayuda.trasError(repetir)], () => { if (token === game.token) game.bloqueado = false; });
			return;
		}
		game.aciertos += 1;
		setAciertos(game.aciertos);
		setOpciones((actuales) => actuales.map((o, i) => i === indice ? { ...o, resultado: "acierto" } : o));
		secuencia.reproducir([sonido, mudo(audio("correcto.mp3"))], () => {
			runtime.setTimeout(() => {
				if (token !== game.token) return;
				if (game.aciertos === total) {
					setTerminado(true);
					secuencia.reproducir([audio("Fabuloso.mp3")], () => otorgar(game.errores));
				} else if (recolectar) {
					game.bloqueado = false;
					ayuda.reiniciar();
				} else {
					game.ronda += 1;
					cargarRonda();
				}
			}, 450);
		});
	}

	function repetir() {
		if (!game.bloqueado && !terminado) secuencia.reproducir(consigna());
	}

	useEffect(() => { reiniciar(); return () => secuencia.cancelar(); }, []);

	return (
		<div className={`page activity-page page-robots-silabas ${recolectar ? "robots-voladores" : "robots-jardin"}`}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls"><button className="restart-button" type="button" onClick={reiniciar} aria-label="Reiniciar actividad">↻</button></div>
			<div className="robots-avance" role="status" aria-label={`${aciertos} de ${total} aciertos`}>
				{Array.from({ length: total }, (_, i) => <span className={i < aciertos ? "hecho" : ""} key={i} aria-hidden="true">★</span>)}
			</div>
			<main className="robots-opciones" aria-label={recolectar ? "Robots voladores con sílabas" : "Robots con sílabas"}>
				{opciones.map((o, i) => (
					<div className={`robot-opcion ${o.resultado || ""}${ayuda.pista && o.correcta && !o.resultado ? " pista-correcta" : ""}`} key={`${game.token}-${game.ronda}-${i}`}>
						<button className="robot-elegir" type="button" aria-label={`Elegir ${o.silaba}`} disabled={Boolean(o.resultado) || terminado} onClick={() => elegir(i)}>
							<img src={img(o.imagen)} alt="" draggable={false} />
							<span className="robot-silaba">{o.silaba}</span>
						</button>
						{!recolectar && !o.resultado && <button className="robot-escuchar" type="button" aria-label={`Escuchar ${o.silaba}`} onClick={() => { if (!game.bloqueado && !terminado) secuencia.reproducir([audio(`${o.silaba.toLowerCase()}.mp3`)]); }}>
							<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zM16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
						</button>}
					</div>
				))}
			</main>
			<Character character={personaje} mouth={mouth} onClick={repetir} label="Repetir consigna" celebrating={terminado} />
			<PremioComida premio={premio} />
		</div>
	);
}
