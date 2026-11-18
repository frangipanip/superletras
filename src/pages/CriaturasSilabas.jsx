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
import { incorrectasMundo6, MUNDO6_LETRA_AUDIO, MUNDO6_SYLLABLES } from "../lib/mundo6";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import "./CriaturasSilabas.css";

// Mariposas ("recolectar": tocar todas las de la letra) y Flores ("jardín": tocar la sílaba pedida)
// de los mundos que no tienen pantalla propia. Cada mundo pone sus sílabas, distractores, consignas
// y dibujos (cuatro, que se reparten entre las opciones).
const MUNDOS = {
	5: {
		titulos: { mariposas: "Robots voladores", flores: "Jardín de robots" },
		silabas: MUNDO5_SYLLABLES,
		primera: "g",
		incorrectas: incorrectasMundo5,
		bocas: MUNDO5_MOUTH_IMAGES,
		// Presentación de la letra y la regla ("tocá donde la G suena suave").
		consignaRecolectar: (modo) => [MUNDO5_PRESENTACIONES[modo], modo === "ge" || modo === "j" ? "pecesGFuerte.mp3" : "pecesGSuave.mp3"],
		repetirRecolectar: (modo) => MUNDO5_PRESENTACIONES[modo],
		dibujos: {
			mariposas: [1, 2, 3, 4].map((n) => `robotSilabas${n}.png`),
			flores: [1, 2, 3, 4].map((n) => `robotSilabas${n}.png`)
		}
	},
	6: {
		titulos: { mariposas: "Mariposas", flores: "Jardín de unicornios" },
		silabas: MUNDO6_SYLLABLES,
		primera: "b",
		incorrectas: incorrectasMundo6,
		// Mundo 6 usa el personaje común (no hay bocas de unicornio).
		bocas: undefined,
		// "B larga suena B" · "Pulsá todas las mariposas que tengan" · "B larga suena B".
		consignaRecolectar: (modo) => [MUNDO6_LETRA_AUDIO[modo], "Pulsa.mp3", MUNDO6_LETRA_AUDIO[modo]],
		repetirRecolectar: (modo) => MUNDO6_LETRA_AUDIO[modo],
		dibujos: {
			mariposas: [1, 2, 3, 4].map((n) => `mariposaUnicornio${n}.png`),
			flores: [1, 2, 3, 4].map((n) => `florUnicornio${n}.png`)
		}
	}
};

export default function CriaturasSilabas({ actividad, mundo }) {
	const config = MUNDOS[mundo] || MUNDOS[5];
	const recolectar = actividad === "mariposas";
	usePageTitle(`${config.titulos[actividad]} - Mundo ${mundo}`);
	const runtime = usePageRuntime();
	const opcion = useActivityMenuOption();
	const modo = Object.hasOwn(config.silabas, opcion) ? opcion : config.primera;
	const [personaje] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, config.bocas);
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	const [premio, otorgar] = useRecompensa(actividad, modo);
	const [opciones, setOpciones] = useState([]);
	const [aciertos, setAciertos] = useState(0);
	const [terminado, setTerminado] = useState(false);
	const [audios] = useState(() => ({}));
	const game = useRef({ token: 0, bloqueado: false, errores: 0, ronda: 0, aciertos: 0, orden: [] }).current;
	const pedido = useRef("");
	const correctas = config.silabas[modo];
	const total = recolectar ? 5 : correctas.length;
	const dibujos = config.dibujos[actividad];

	function audio(archivo) {
		if (!audios[archivo]) audios[archivo] = runtime.audio(sound(archivo), { preload: true });
		return audios[archivo];
	}

	function consigna() {
		return recolectar
			? config.consignaRecolectar(modo).map(audio)
			: [audio("Pulsasilaba.mp3"), audio(`${pedido.current.toLowerCase()}.mp3`)];
	}

	function cargarRonda() {
		ayuda.reiniciar();
		pedido.current = game.orden[game.ronda];
		const etiquetas = recolectar
			? [...Array.from({ length: 5 }, (_, i) => correctas[i % correctas.length]), ...config.incorrectas(modo)]
			: [pedido.current, ...shuffle([...correctas.filter((s) => s !== pedido.current), ...config.incorrectas(modo)]).slice(0, 3)];
		setOpciones(shuffle(etiquetas).map((silaba, i) => ({
			silaba,
			imagen: dibujos[i % dibujos.length],
			correcta: recolectar ? correctas.includes(silaba) : silaba === pedido.current,
			resultado: null
		})));
		game.bloqueado = false;
		secuencia.reproducir(consigna());
	}

	function reiniciar() {
		secuencia.cancelar();
		game.token += 1;
		game.errores = 0;
		game.ronda = 0;
		game.aciertos = 0;
		game.orden = shuffle(correctas);
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
			if (!recolectar) {
				// Jardín: la opción se sacude y vuelve a quedar disponible.
				const ronda = game.ronda;
				runtime.setTimeout(() => {
					if (token !== game.token || ronda !== game.ronda) return;
					setOpciones((actuales) => actuales.map((o, i) => i === indice && o.resultado === "error" ? { ...o, resultado: null } : o));
				}, 400);
			}
			const repetir = recolectar ? audio(config.repetirRecolectar(modo)) : audio(`${pedido.current.toLowerCase()}.mp3`);
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
		<div className={`page activity-page page-criaturas-silabas mundo${mundo} ${recolectar ? "criaturas-recolectar" : "criaturas-jardin"}`}>
			<BackButton />
			<FullscreenButton toggle />
			<div className="activity-controls"><button className="restart-button" type="button" onClick={reiniciar} aria-label="Reiniciar actividad">↻</button></div>
			<div className="criaturas-avance" role="status" aria-label={`${aciertos} de ${total} aciertos`}>
				{Array.from({ length: total }, (_, i) => <span className={i < aciertos ? "hecho" : ""} key={i} aria-hidden="true">★</span>)}
			</div>
			<main className="criaturas-opciones" aria-label={`${config.titulos[actividad]} con sílabas`}>
				{opciones.map((o, i) => (
					<div className={`criatura-opcion ${o.resultado || ""}${ayuda.pista && o.correcta && !o.resultado ? " pista-correcta" : ""}`} key={`${game.token}-${game.ronda}-${i}`}>
						<button className="criatura-elegir" type="button" aria-label={`Elegir ${o.silaba}`} disabled={Boolean(o.resultado) || terminado} onClick={() => elegir(i)}>
							<img src={img(o.imagen)} alt="" draggable={false} />
							<span className="criatura-silaba">{o.silaba}</span>
						</button>
					</div>
				))}
			</main>
			<Character character={personaje} mouth={mouth} onClick={repetir} label="Repetir consigna" celebrating={terminado} />
			<PremioComida premio={premio} />
		</div>
	);
}
