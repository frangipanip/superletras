import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { COMIDAS, LETRAS } from "../../shared/comidas.js";
import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import Monstruo, { CUADROS_MONSTRUO, imagenesMonstruo } from "../components/Monstruo";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { preloadImages, sound } from "../lib/assets";
import { cantidadComida, darComida, getRecompensas, sincronizar, subscribeRecompensas } from "../lib/recompensas";
import { readMenuOption } from "../lib/storage";
import "./actividad.css";
import "./Monstruo.css";

// Duración del vuelo de la comida hasta la boca (coincide con monstruo-vuelo en Monstruo.css).
const VUELO_MS = 650;
// Mientras vuela la comida tiene la boca abierta; al llegar pasa por estos cuadros (ms cada uno).
const SECUENCIA_COMER = [
	[CUADROS_MONSTRUO.mastica, 380],
	[CUADROS_MONSTRUO.normal, 120],
	[CUADROS_MONSTRUO.mastica, 380],
	[CUADROS_MONSTRUO.relame, 650],
	[CUADROS_MONSTRUO.feliz, 800]
];
// Dónde está la boca dentro de la imagen del monstruo (fracción del ancho y del alto).
const BOCA = { x: 0.5, y: 0.54 };

export default function MonstruoPage() {
	const location = useLocation();
	const runtime = usePageRuntime();
	const [letra] = useState(() => {
		const elegida = (location.state?.letra || readMenuOption() || "a").toLowerCase();
		return LETRAS.includes(elegida) ? elegida : "a";
	});
	usePageTitle(`Monstruo ${letra.toUpperCase()} - Mundo 1`);
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const [vuelos, setVuelos] = useState([]);
	const [cuadro, setCuadro] = useState(CUADROS_MONSTRUO.normal);
	const monstruoRef = useRef(null);
	// Timers de la secuencia de comer en curso: si le dan otra comida, arranca de nuevo.
	const comerTimers = useRef([]);
	const [audios] = useState(() => ({
		comer: runtime.audio(sound("correcto.mp3"), { preload: true }),
		lleno: runtime.audio(sound("Fabuloso.m4a"), { preload: true })
	}));

	const comidas = COMIDAS.map((comida) => {
		const { ganadas, dadas } = cantidadComida(letras, letra, comida.clave);
		return { ...comida, ganadas, dadas, guardadas: ganadas - dadas };
	});
	const lleno = comidas.every(({ dadas, necesarias }) => dadas >= necesarias);

	useEffect(() => {
		sincronizar();
		preloadImages(imagenesMonstruo(letra));
	}, []);

	function cancelarSecuencia() {
		comerTimers.current.forEach((id) => runtime.clearTimeout(id));
		comerTimers.current = [];
	}

	function comer() {
		cancelarSecuencia();
		let espera = 0;
		for (const [siguiente, duracion] of SECUENCIA_COMER) {
			comerTimers.current.push(runtime.setTimeout(() => setCuadro(siguiente), espera));
			espera += duracion;
		}
		comerTimers.current.push(runtime.setTimeout(() => setCuadro(CUADROS_MONSTRUO.normal), espera));
	}

	// Punto de la boca en pantalla: la imagen se ajusta dentro de su caja (object-fit: contain).
	function puntoBoca() {
		const imagen = monstruoRef.current.querySelector("img");
		const caja = imagen.getBoundingClientRect();
		const proporcion = imagen.naturalWidth && imagen.naturalHeight ? imagen.naturalWidth / imagen.naturalHeight : 1;
		const ancho = Math.min(caja.width, caja.height * proporcion);
		const alto = ancho / proporcion;
		return {
			x: caja.left + (caja.width - ancho) / 2 + ancho * BOCA.x,
			y: caja.top + (caja.height - alto) / 2 + alto * BOCA.y
		};
	}

	function darAlMonstruo(event, comida) {
		const boton = event.currentTarget.getBoundingClientRect();
		if (!darComida(letra, comida.clave)) {
			return;
		}
		const boca = puntoBoca();
		const origen = { x: boton.left + boton.width / 2, y: boton.top + boton.height / 2 };
		const vuelo = {
			id: `${Date.now()}-${Math.random()}`,
			emoji: comida.emoji,
			style: {
				left: `${origen.x}px`,
				top: `${origen.y}px`,
				"--vuelo-x": `${boca.x - origen.x}px`,
				"--vuelo-y": `${boca.y - origen.y}px`
			}
		};
		setVuelos((actuales) => [...actuales, vuelo]);
		cancelarSecuencia();
		setCuadro(CUADROS_MONSTRUO.abre);
		const quedaLleno = comidas.every(({ clave, dadas, necesarias }) => (clave === comida.clave ? dadas + 1 : dadas) >= necesarias);
		runtime.setTimeout(() => {
			setVuelos((actuales) => actuales.filter((item) => item.id !== vuelo.id));
			comer();
			const audio = quedaLleno ? audios.lleno : audios.comer;
			audio.currentTime = 0;
			audio.play().catch(() => {});
		}, VUELO_MS);
	}

	return (
		<div className="page activity-page page-monstruo">
			<BackButton />
			<FullscreenButton toggle />

			<main className="monstruo-escena">
				<section className="monstruo-izq" aria-label="Comidas que juntaste">
					<div className="monstruo-grilla-izq">
						{comidas.map((comida) => (
							<button
								key={comida.clave}
								type="button"
								className="monstruo-comida"
								disabled={comida.guardadas <= 0}
								aria-label={`Darle ${comida.nombre} al monstruo (tenés ${comida.guardadas})`}
								onClick={(event) => darAlMonstruo(event, comida)}
							>
								<span className="monstruo-emoji">{comida.emoji}</span>
								<span className="monstruo-insignia">{comida.guardadas}</span>
							</button>
						))}
					</div>
				</section>

				<section className="monstruo-centro" aria-live="polite">
					<h1>{lleno ? "¡Estoy lleno!" : `Monstruo de la ${letra.toUpperCase()}`}</h1>
					<div ref={monstruoRef} className="monstruo-lugar">
						<Monstruo letra={letra} cuadro={lleno && cuadro === CUADROS_MONSTRUO.normal ? CUADROS_MONSTRUO.feliz : cuadro} lleno={lleno} />
					</div>
				</section>

				<section className="monstruo-der" aria-label="Lo que necesita el monstruo">
					<div className="monstruo-grilla-der">
						{comidas.map(({ clave, emoji, nombre, dadas, necesarias }) => {
							const porcentaje = (100 * dadas) / necesarias;
							const estaLleno = dadas >= necesarias;
							return (
								<div key={clave} className={`monstruo-item-necesita ${estaLleno ? "completa" : ""}`} aria-label={`${nombre}: ${dadas} de ${necesarias}`}>
									<div className="monstruo-circulo-progreso" style={{ "--progreso": `${porcentaje}%` }}>
										<div className="monstruo-circulo-interior">
											<span className="monstruo-emoji">{emoji}</span>
										</div>
									</div>
									<span className="monstruo-cuenta-pill">
										{dadas}/{necesarias}
									</span>
								</div>
							);
						})}
					</div>
				</section>
			</main>

			{vuelos.map((vuelo) => (
				<span key={vuelo.id} className="monstruo-vuelo" style={vuelo.style} aria-hidden="true">
					{vuelo.emoji}
				</span>
			))}

		</div>
	);
}
