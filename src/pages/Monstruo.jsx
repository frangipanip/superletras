import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { COMIDAS, LETRAS } from "../../shared/comidas.js";
import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import Monstruo from "../components/Monstruo";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { sound } from "../lib/assets";
import { cantidadComida, darComida, getRecompensas, sincronizar, subscribeRecompensas, usarCodigo } from "../lib/recompensas";
import { readMenuOption } from "../lib/storage";
import "./actividad.css";
import "./Monstruo.css";

// Duración del vuelo de la comida hasta la boca (coincide con monstruo-vuelo en Monstruo.css).
const VUELO_MS = 650;
const MASTICAR_MS = 700;

function copiarTexto(texto, respaldo) {
	if (navigator.clipboard?.writeText) {
		return navigator.clipboard.writeText(texto);
	}
	// Sin HTTPS no hay API del portapapeles: se copia seleccionando el texto.
	respaldo.select();
	document.execCommand("copy");
	return Promise.resolve();
}

export default function MonstruoPage() {
	const location = useLocation();
	const runtime = usePageRuntime();
	const [letra] = useState(() => {
		const elegida = (location.state?.letra || readMenuOption() || "a").toLowerCase();
		return LETRAS.includes(elegida) ? elegida : "a";
	});
	usePageTitle(`Monstruo ${letra.toUpperCase()} - Mundo 1`);
	const { codigo, letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const [vuelos, setVuelos] = useState([]);
	const [comiendo, setComiendo] = useState(false);
	const [copiado, setCopiado] = useState(false);
	const [cambiando, setCambiando] = useState(false);
	const [borrador, setBorrador] = useState("");
	const [errorCodigo, setErrorCodigo] = useState("");
	const [buscando, setBuscando] = useState(false);
	const monstruoRef = useRef(null);
	const codigoRef = useRef(null);
	const masticarTimer = useRef(0);
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
	}, []);

	function darAlMonstruo(event, comida) {
		const boton = event.currentTarget.getBoundingClientRect();
		if (!darComida(letra, comida.clave)) {
			return;
		}
		const boca = monstruoRef.current.getBoundingClientRect();
		const vuelo = {
			id: `${Date.now()}-${Math.random()}`,
			emoji: comida.emoji,
			style: {
				left: `${boton.left + boton.width / 2}px`,
				top: `${boton.top + boton.height / 2}px`,
				"--vuelo-x": `${boca.left + boca.width / 2 - (boton.left + boton.width / 2)}px`,
				"--vuelo-y": `${boca.top + boca.height * 0.52 - (boton.top + boton.height / 2)}px`
			}
		};
		setVuelos((actuales) => [...actuales, vuelo]);
		const quedaLleno = comidas.every(({ clave, dadas, necesarias }) => (clave === comida.clave ? dadas + 1 : dadas) >= necesarias);
		runtime.setTimeout(() => {
			setVuelos((actuales) => actuales.filter((item) => item.id !== vuelo.id));
			setComiendo(true);
			runtime.clearTimeout(masticarTimer.current);
			masticarTimer.current = runtime.setTimeout(() => setComiendo(false), MASTICAR_MS);
			const audio = quedaLleno ? audios.lleno : audios.comer;
			audio.currentTime = 0;
			audio.play().catch(() => {});
		}, VUELO_MS);
	}

	function copiarCodigo() {
		copiarTexto(codigo, codigoRef.current)
			.then(() => {
				setCopiado(true);
				runtime.setTimeout(() => setCopiado(false), 1800);
			})
			.catch(() => {});
	}

	async function aceptarCodigo(event) {
		event.preventDefault();
		setBuscando(true);
		const error = await usarCodigo(borrador);
		setBuscando(false);
		setErrorCodigo(error || "");
		if (!error) {
			setCambiando(false);
			setBorrador("");
		}
	}

	return (
		<div className="page activity-page page-monstruo">
			<BackButton />
			<FullscreenButton toggle />

			<main className="monstruo-escena">
				<section className="monstruo-panel monstruo-juntadas" aria-label="Comidas que juntaste">
					<h2>Tus comidas</h2>
					<div className="monstruo-grilla">
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
					<p className="monstruo-ayuda">Tocá una comida para dársela</p>
				</section>

				<section className="monstruo-centro" aria-live="polite">
					<h1>{lleno ? "¡Estoy lleno!" : `Monstruo de la ${letra.toUpperCase()}`}</h1>
					<div ref={monstruoRef} className="monstruo-lugar">
						<Monstruo letra={letra} comiendo={comiendo} lleno={lleno} />
					</div>
				</section>

				<section className="monstruo-panel monstruo-necesita" aria-label="Lo que necesita el monstruo">
					<h2>Necesita</h2>
					<ul>
						{comidas.map(({ clave, emoji, nombre, dadas, necesarias }) => (
							<li key={clave} className={dadas >= necesarias ? "completa" : undefined} aria-label={`${nombre}: ${dadas} de ${necesarias}`}>
								<span className="monstruo-emoji">{emoji}</span>
								<span className="monstruo-barra">
									<span style={{ width: `${(100 * dadas) / necesarias}%` }} />
								</span>
								<span className="monstruo-cuenta">
									{dadas}/{necesarias}
								</span>
							</li>
						))}
					</ul>
				</section>
			</main>

			{vuelos.map((vuelo) => (
				<span key={vuelo.id} className="monstruo-vuelo" style={vuelo.style} aria-hidden="true">
					{vuelo.emoji}
				</span>
			))}

			<footer className="monstruo-codigo">
				{cambiando ? (
					<form onSubmit={aceptarCodigo}>
						<input
							type="text"
							value={borrador}
							maxLength={12}
							placeholder="Pegá tu código"
							autoCapitalize="characters"
							autoComplete="off"
							spellCheck={false}
							autoFocus
							onChange={(event) => setBorrador(event.target.value)}
						/>
						<button type="submit" disabled={buscando}>
							{buscando ? "Buscando..." : "Usar"}
						</button>
						<button type="button" onClick={() => { setCambiando(false); setErrorCodigo(""); }}>
							Cancelar
						</button>
						{errorCodigo && <span className="monstruo-codigo-error">{errorCodigo}</span>}
					</form>
				) : (
					<>
						<span>Tu código:</span>
						<input ref={codigoRef} className="monstruo-codigo-valor" readOnly value={codigo || "sin conexión"} onFocus={(event) => event.target.select()} />
						<button type="button" disabled={!codigo} onClick={copiarCodigo}>
							{copiado ? "¡Copiado!" : "Copiar"}
						</button>
						<button type="button" onClick={() => setCambiando(true)}>
							Usar otro
						</button>
					</>
				)}
			</footer>
		</div>
	);
}
