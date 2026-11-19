import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Navigate, useLocation } from "react-router";
import { LETRAS_POR_MUNDO } from "../../shared/comidas.js";
import BackButton from "../components/BackButton";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { ALTO, ANCHO, BOTONES, ESPERA_ENTRE_TOQUES, IMAGENES, MAQUINA, NOMBRES_LABORATORIO } from "../lib/laboratorio";
import { actualizar, cargarImagenes, crearEscena, dibujar, EFECTOS, hayMovimiento } from "../lib/laboratorioEfectos";
import { estrellasDelMundo, gastarEstrellas, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import "./Laboratorio.css";

// Laboratorio de Luces (/laboratorio, con state.world del mundo de origen). Se entra tocando el
// contador de estrellas de un mundo. Un solo componente para los seis laboratorios: cada uno muestra
// y gasta el saldo de su mundo. Arriba el paisaje (escenario 1920×1080 escalado) y abajo, aparte, la
// franja con los seis controles. Precios, tiempos, límites y el mapa del arte: src/lib/laboratorio.js;
// los efectos: src/lib/laboratorioEfectos.js. La escena es efímera: al salir se borra todo.
export default function Laboratorio() {
	const location = useLocation();
	const mundo = Number(location.state?.world);
	if (!LETRAS_POR_MUNDO[mundo]) {
		return <Navigate to="/mundos" replace />;
	}
	// key: cambiar de mundo arranca una escena limpia.
	return <LaboratorioDelMundo key={mundo} mundo={mundo} />;
}

// Escala del escenario 1920×1080 para que entre entero en el área del paisaje (lo que queda arriba
// de la franja de controles).
function escalaPara(ancho, alto) {
	return Math.max(0.05, Math.min(ancho / ANCHO, alto / ALTO));
}

function LaboratorioDelMundo({ mundo }) {
	const runtime = usePageRuntime();
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const saldo = estrellasDelMundo(letras, mundo);
	const areaRef = useRef(null);
	const paisajeRef = useRef(null);
	const lucesRef = useRef(null);
	const motor = useRef(null);
	const ultimoToque = useRef({});
	const temporizadores = useRef({});
	// Hasta medir el área, una estimación (la franja ocupa unos 120 px).
	const [escala, setEscala] = useState(() => escalaPara(window.innerWidth, window.innerHeight - 120));
	const [mensaje, setMensaje] = useState(null);
	const [preparando, setPreparando] = useState({});
	const [sacudido, setSacudido] = useState(null);

	useEffect(() => {
		const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		const escena = crearEscena({ reducido });
		cargarImagenes(escena);
		const area = areaRef.current;
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

		// El escenario lógico entra entero en el área del paisaje; los lienzos tienen la resolución que
		// se ve (como mucho 1920×1080) y dibujan con escena.k. Los dos lienzos y la imagen de la máquina
		// están dentro del mismo escenario escalado, así la capa de los instrumentos sigue calzada sobre
		// la máquina en cualquier tamaño.
		function ajustar() {
			if (!vivo) return;
			const nuevaEscala = escalaPara(area.clientWidth, area.clientHeight);
			const k = Math.min(1, nuevaEscala * (window.devicePixelRatio || 1));
			const ancho = Math.round(ANCHO * k);
			const alto = Math.round(ALTO * k);
			if (lienzos[0].width !== ancho || lienzos[0].height !== alto) {
				for (const lienzo of lienzos) {
					lienzo.width = ancho;
					lienzo.height = alto;
				}
				escena.k = k;
				if (!corriendo) dibujar(escena, paisaje, luces);
			}
			setEscala(nuevaEscala);
		}

		ajustar();
		const observador = typeof ResizeObserver === "function" ? new ResizeObserver(ajustar) : null;
		observador?.observe(area);
		window.addEventListener("resize", ajustar);
		document.addEventListener("visibilitychange", despertar);
		motor.current = { escena, despertar };
		return () => {
			vivo = false;
			motor.current = null;
			observador?.disconnect();
			window.removeEventListener("resize", ajustar);
			document.removeEventListener("visibilitychange", despertar);
			// Se descartan también las preparaciones y emisiones pendientes (viven en las instancias).
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

	// Orden: ¿hay lugar y está listo el efecto? → ¿alcanza el saldo? → cobrar una vez → preparar en la
	// máquina y emitir. Todo es síncrono: un segundo toque ya ve el saldo descontado y nunca queda
	// negativo. La preparación y la emisión son la misma activación (un solo cobro).
	function activar(boton) {
		const actual = motor.current;
		if (!actual) return;
		const ahora = performance.now();
		if (ahora - (ultimoToque.current[boton.id] ?? -Infinity) < ESPERA_ENTRE_TOQUES) return;
		const efecto = EFECTOS[boton.id];
		const estado = efecto.puedeAgregar(actual.escena);
		if (estado !== "ok") {
			avisar(estado === "cargando" ? "Un momentito, se está preparando…" : "¡Ya hay un montón! Probá con otro.", boton.id);
			return;
		}
		const disponible = estrellasDelMundo(getRecompensas().letras, mundo);
		if (disponible < boton.precio || !gastarEstrellas(mundo, boton.precio, boton.id)) {
			const falta = Math.max(1, boton.precio - disponible);
			avisar(`Te ${falta === 1 ? "falta 1 estrella" : `faltan ${falta} estrellas`}`, boton.id, true);
			return;
		}
		ultimoToque.current[boton.id] = ahora;
		efecto.agregar(actual.escena, boton.preparacionMs / 1000);
		actual.despertar();
		setPreparando((previos) => ({ ...previos, [boton.id]: true }));
		esperar(`preparando-${boton.id}`, boton.preparacionMs, () => setPreparando((previos) => ({ ...previos, [boton.id]: false })));
	}

	function claseTarjeta(boton) {
		let clase = "luces-tarjeta";
		if (preparando[boton.id]) clase += " luces-tarjeta--preparando";
		if (saldo < boton.precio) clase += " luces-tarjeta--sin-saldo";
		if (sacudido === boton.id) clase += " luces-tarjeta--sacudida";
		return clase;
	}

	return (
		<div className="page-laboratorio">
			<div className="lab-paisaje" ref={areaRef}>
				<div className="lab-escenario" style={{ width: ANCHO, height: ALTO, transform: `translateX(-50%) scale(${escala})` }}>
					{/* Pantallas más anchas que 16:9: a cada costado, el mismo fondo espejado (el borde
					    coincide píxel a píxel, así el horizonte y el pasto siguen sin corte). */}
					<img className="lab-fondo lab-fondo-izquierda" src={IMAGENES.fondo} alt="" draggable={false} />
					<img className="lab-fondo lab-fondo-derecha" src={IMAGENES.fondo} alt="" draggable={false} />
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
				</div>
			</div>

			<div className="luces-franja" role="group" aria-label={`Efectos de luz del laboratorio ${NOMBRES_LABORATORIO[mundo]}`}>
				<div className="luces-franja__grilla">
					{BOTONES.map((boton) => (
						<button
							key={boton.id}
							className={claseTarjeta(boton)}
							type="button"
							aria-label={`${boton.nombre}, ${boton.precio} estrellas`}
							onClick={() => activar(boton)}
						>
							<img className="luces-tarjeta__icono" src={boton.icono} alt="" draggable={false} />
							<span className="luces-tarjeta__texto">{boton.rotulo}</span>
							<span className="luces-tarjeta__precio" aria-hidden="true">
								<span className="luces-tarjeta__estrella">⭐</span>
								{boton.precio}
							</span>
						</button>
					))}
				</div>
			</div>

			<nav className="top-nav" aria-label="Navegación">
				<BackButton className="corner-button back-button" />
			</nav>
			<div className="lab-saldo" aria-label={`Laboratorio ${NOMBRES_LABORATORIO[mundo]}: ${saldo} ${saldo === 1 ? "estrella" : "estrellas"}`}>
				<span aria-hidden="true">⭐</span>
				<span aria-hidden="true">{saldo}</span>
			</div>
			<div className="lab-mensaje" aria-live="polite">
				{mensaje && <span key={mensaje.id}>{mensaje.texto}</span>}
			</div>
		</div>
	);
}
