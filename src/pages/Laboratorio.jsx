import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LETRAS_POR_MUNDO } from "../../shared/comidas.js";
import BackButton from "../components/BackButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { ALTO, ANCHO, BOTONES, DIAMETRO_BOTON, ESPERA_ENTRE_TOQUES, IMAGENES, MAQUINA, NOMBRES_LABORATORIO } from "../lib/laboratorio";
import { actualizar, cargarImagenes, crearEscena, dibujar, EFECTOS, hayMovimiento } from "../lib/laboratorioEfectos";
import { estrellasDelMundo, gastarEstrellas, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import "./Laboratorio.css";

// Laboratorio de Luces (/laboratorio, con state.world del mundo de origen). Se entra tocando el
// contador de estrellas de un mundo. Un solo componente para los seis laboratorios: cada uno muestra
// y gasta el saldo de su mundo. Precios, límites y el mapa del arte: src/lib/laboratorio.js; los
// efectos: src/lib/laboratorioEfectos.js. La escena es efímera: al salir se borra todo.
export default function Laboratorio() {
	const location = useLocation();
	const mundo = Number(location.state?.world);
	if (!LETRAS_POR_MUNDO[mundo]) {
		return <Navigate to="/mundos" replace />;
	}
	// key: cambiar de mundo arranca una escena limpia.
	return <LaboratorioDelMundo key={mundo} mundo={mundo} />;
}

// Debajo de este tamaño en pantalla los botones de la máquina quedan chicos para un dedo: se ofrece
// además la cuadrícula táctil con los mismos seis controles.
const BOTON_MINIMO = 46;

function LaboratorioDelMundo({ mundo }) {
	const navigate = useNavigate();
	const runtime = usePageRuntime();
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const saldo = estrellasDelMundo(letras, mundo);
	const paisajeRef = useRef(null);
	const lucesRef = useRef(null);
	const motor = useRef(null);
	const ultimoToque = useRef({});
	const temporizadores = useRef({});
	const [escala, setEscala] = useState(() => Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO));
	const [mensaje, setMensaje] = useState(null);
	const [encendidos, setEncendidos] = useState({});
	const [sacudido, setSacudido] = useState(null);
	const [panelAbierto, setPanelAbierto] = useState(false);
	const compacto = escala * DIAMETRO_BOTON < BOTON_MINIMO;

	useEffect(() => {
		const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		const escena = crearEscena({ reducido });
		cargarImagenes(escena);
		const lienzos = [paisajeRef.current, lucesRef.current];
		const [paisaje, luces] = lienzos.map((lienzo) => lienzo.getContext("2d"));
		let vivo = true;
		let corriendo = false;
		let ultimo = 0;

		// Un solo ciclo de dibujo para toda la escena. Se detiene cuando no queda nada que mover y
		// mientras la pestaña no se ve (al volver sigue desde donde estaba).
		function cuadro() {
			if (!vivo) return;
			if (document.hidden) {
				corriendo = false;
				return;
			}
			const ahora = performance.now();
			const dt = Math.min(0.05, (ahora - ultimo) / 1000);
			ultimo = ahora;
			actualizar(escena, dt);
			dibujar(escena, paisaje, luces);
			if (hayMovimiento(escena)) {
				runtime.requestAnimationFrame(cuadro);
			} else {
				corriendo = false;
			}
		}

		function despertar() {
			if (vivo && !corriendo && !document.hidden) {
				corriendo = true;
				ultimo = performance.now();
				runtime.requestAnimationFrame(cuadro);
			}
		}

		// El escenario lógico (1920×1080) entra entero en la pantalla; los lienzos tienen la resolución
		// que se ve (como mucho 1920×1080) y dibujan con escena.k.
		function ajustar() {
			const nuevaEscala = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO);
			const k = Math.min(1, nuevaEscala * (window.devicePixelRatio || 1));
			for (const lienzo of lienzos) {
				lienzo.width = Math.round(ANCHO * k);
				lienzo.height = Math.round(ALTO * k);
			}
			escena.k = k;
			setEscala(nuevaEscala);
			if (!corriendo) dibujar(escena, paisaje, luces);
		}

		ajustar();
		window.addEventListener("resize", ajustar);
		document.addEventListener("visibilitychange", despertar);
		motor.current = { escena, despertar };
		return () => {
			vivo = false;
			motor.current = null;
			window.removeEventListener("resize", ajustar);
			document.removeEventListener("visibilitychange", despertar);
			escena.instancias = [];
			escena.plantas = [];
			escena.burbujas = [];
			// Libera la memoria de los lienzos.
			for (const lienzo of lienzos) {
				lienzo.width = 0;
				lienzo.height = 0;
			}
		};
	}, [runtime]);

	function esperar(clave, demora, accion) {
		runtime.clearTimeout(temporizadores.current[clave]);
		temporizadores.current[clave] = runtime.setTimeout(accion, demora);
	}

	function avisar(texto, botonId, sacudir = false) {
		setMensaje({ texto, id: Date.now() });
		esperar("mensaje", 2600, () => setMensaje(null));
		if (sacudir) {
			setSacudido(botonId);
			esperar("sacudido", 500, () => setSacudido(null));
		}
	}

	// Orden: ¿hay lugar y está listo el efecto? → ¿alcanza el saldo? → cobrar una vez → disparar.
	// Todo es síncrono: un segundo toque ya ve el saldo descontado y nunca queda negativo.
	function activar(boton) {
		const actual = motor.current;
		if (!actual) return;
		const ahora = performance.now();
		if (ahora - (ultimoToque.current[boton.id] ?? -Infinity) < ESPERA_ENTRE_TOQUES) return;
		const efecto = EFECTOS[boton.id];
		const estado = efecto.puedeAgregar(actual.escena);
		if (estado !== "ok") {
			avisar(estado === "cargando" ? "Un momentito, se está preparando…" : "¡Ya hay muchas! Esperá un poquito.", boton.id);
			return;
		}
		const disponible = estrellasDelMundo(getRecompensas().letras, mundo);
		if (disponible < boton.precio || !gastarEstrellas(mundo, boton.precio, boton.id)) {
			const falta = Math.max(1, boton.precio - disponible);
			avisar(`Te ${falta === 1 ? "falta 1 estrella" : `faltan ${falta} estrellas`}`, boton.id, true);
			return;
		}
		ultimoToque.current[boton.id] = ahora;
		efecto.agregar(actual.escena);
		actual.despertar();
		setPanelAbierto(false);
		setEncendidos((previos) => ({ ...previos, [boton.id]: true }));
		esperar(`encendido-${boton.id}`, 700, () => setEncendidos((previos) => ({ ...previos, [boton.id]: false })));
	}

	function claseBoton(boton) {
		return `lab-boton${encendidos[boton.id] ? " lab-boton-encendido" : ""}${saldo < boton.precio ? " lab-boton-sin-saldo" : ""}${sacudido === boton.id ? " lab-boton-sacudido" : ""}`;
	}

	function contenidoBoton(boton) {
		return (
			<>
				<img src={boton.imagen} alt="" draggable={false} />
				<span className="lab-precio" aria-hidden="true">
					{boton.precio}
					<span>⭐</span>
				</span>
			</>
		);
	}

	const etiqueta = (boton) => `${boton.nombre}, ${boton.precio} estrellas`;

	return (
		<div className="page-laboratorio">
			<div className="lab-escenario" style={{ width: ANCHO, height: ALTO, transform: `translate(-50%, -50%) scale(${escala})` }}>
				<img className="lab-fondo" src={IMAGENES.fondo} alt="" draggable={false} />
				<canvas ref={paisajeRef} className="lab-lienzo" aria-hidden="true" />
				<img
					className="lab-maquina"
					src={IMAGENES.maquina}
					alt=""
					draggable={false}
					style={{ left: MAQUINA.x, top: MAQUINA.y, width: MAQUINA.ancho, height: MAQUINA.alto }}
				/>
				<canvas ref={lucesRef} className="lab-lienzo" aria-hidden="true" />
				<div className="lab-botones" role="group" aria-label="Efectos de luz" aria-hidden={compacto && panelAbierto ? true : undefined}>
					{BOTONES.map((boton) => (
						<button
							key={boton.id}
							className={claseBoton(boton)}
							type="button"
							aria-label={etiqueta(boton)}
							style={{ left: boton.centro[0], top: boton.centro[1], width: DIAMETRO_BOTON, height: DIAMETRO_BOTON }}
							onClick={() => activar(boton)}
						>
							{contenidoBoton(boton)}
						</button>
					))}
				</div>
			</div>

			<nav className="top-nav" aria-label="Navegación">
				<BackButton className="corner-button back-button" onClick={() => navigate(`/mundo${mundo}`)} />
			</nav>
			<div className="lab-saldo" aria-label={`Laboratorio ${NOMBRES_LABORATORIO[mundo]}: ${saldo} ${saldo === 1 ? "estrella" : "estrellas"}`}>
				<span aria-hidden="true">⭐</span>
				<span aria-hidden="true">{saldo}</span>
			</div>
			<div className="lab-mensaje" aria-live="polite">
				{mensaje && <span key={mensaje.id}>{mensaje.texto}</span>}
			</div>

			{compacto && (
				<button className="lab-abrir-panel" type="button" aria-expanded={panelAbierto} onClick={() => setPanelAbierto((abierto) => !abierto)}>
					{panelAbierto ? "Cerrar" : "✨ Botones"}
				</button>
			)}
			{compacto && panelAbierto && (
				<div className="lab-panel" role="group" aria-label="Efectos de luz">
					{BOTONES.map((boton) => (
						<button key={boton.id} className={claseBoton(boton)} type="button" aria-label={etiqueta(boton)} onClick={() => activar(boton)}>
							{contenidoBoton(boton)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
