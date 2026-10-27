import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { crearAnimacion, LIENZO } from "./rioChocolateAnimacion";
import "./RioChocolate.css";

// Río y cascada de chocolate animados sobre fondopalabras.png (1933x1080).
// - Capas CSS: la pintura del propio río (sin burbujas) corriendo sin costura,
//   brillos de dibujo animado y la sombra fija de las orillas; los assets los
//   genera scripts/generar-rio-chocolate.py.
// - Canvas (rioChocolateAnimacion.js): burbujas, chispas, la cascada (baja del
//   glaseado y se vuelca desde el labio), la corona que borbotea, gotas y ondas del pozo.
// .rio-plano usa píxeles de la imagen y se escala igual que el fondo (center / cover).

const ANCHO = 1933;
const ALTO = 1080;
// El canvas no gana nada por encima de 1.5 píxeles por píxel de la imagen.
const RESOLUCION_MAXIMA = 1.5;

function calcularEncuadre(elemento) {
	const ancho = elemento.clientWidth;
	const alto = elemento.clientHeight;
	const escala = Math.max(ancho / ANCHO, alto / ALTO);
	return {
		escala,
		x: (ancho - ANCHO * escala) / 2,
		y: (alto - ALTO * escala) / 2
	};
}

function prefiereMenosMovimiento() {
	return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function RioChocolate({ runtime }) {
	const contenedor = useRef(null);
	const lienzo = useRef(null);
	const resolucion = useRef(1);
	const [encuadre, setEncuadre] = useState({ escala: 1, x: 0, y: 0 });

	useLayoutEffect(() => {
		const elemento = contenedor.current;
		const medir = () => {
			const nuevo = calcularEncuadre(elemento);
			resolucion.current = Math.min(nuevo.escala * (window.devicePixelRatio || 1), RESOLUCION_MAXIMA);
			setEncuadre(nuevo);
		};
		medir();
		if (typeof ResizeObserver === "function") {
			const observador = new ResizeObserver(medir);
			observador.observe(elemento);
			return () => observador.disconnect();
		}
		window.addEventListener("resize", medir);
		return () => window.removeEventListener("resize", medir);
	}, []);

	useEffect(() => {
		const canvas = lienzo.current;
		if (!canvas.getContext || typeof Path2D !== "function" || prefiereMenosMovimiento()) {
			return undefined;
		}
		const animacion = crearAnimacion(canvas);
		let activa = true;
		const cuadro = () => {
			if (!activa) return;
			animacion.pintar(performance.now() / 1000, resolucion.current);
			runtime.requestAnimationFrame(cuadro);
		};
		runtime.requestAnimationFrame(cuadro);
		return () => {
			activa = false;
		};
	}, [runtime]);

	return (
		<div className="rio-chocolate" ref={contenedor} aria-hidden="true">
			<div
				className="rio-plano"
				style={{ transform: `translate(${encuadre.x}px, ${encuadre.y}px) scale(${encuadre.escala})` }}
			>
				<div className="rio-parche" />
				<div className="rio-superficie">
					<div className="rio-capa rio-capa-base" />
					<div className="rio-vaiven">
						<div className="rio-capa rio-capa-brillos" />
					</div>
					<div className="rio-orillas" />
				</div>
				<canvas
					ref={lienzo}
					className="rio-lienzo"
					style={{ left: LIENZO.x, top: LIENZO.y, width: LIENZO.ancho, height: LIENZO.alto }}
				/>
			</div>
		</div>
	);
}
