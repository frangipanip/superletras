import { useState } from "react";
import { useNavigate } from "react-router";
import { otorgarPremio } from "../lib/recompensas";
import "./PremioComida.css";

// Premio de comida al completar una actividad: `otorgar(errores)` lo suma a la letra y
// `premio` se le pasa a <PremioComida> para mostrarlo.
export function useRecompensa(actividad, letra) {
	const [premio, setPremio] = useState(null);

	function otorgar(errores = 0) {
		const resultado = otorgarPremio(letra, actividad, errores);
		if (resultado) {
			setPremio(resultado);
		}
	}

	return [premio, otorgar];
}

// Modal de fin de actividad que muestra las recompensas obtenidas y botones
export default function PremioComida({ premio }) {
	const navigate = useNavigate();

	if (!premio) {
		return null;
	}

	const { comida, score, cantidad } = premio;
	
	// Usamos score (rendimiento en la actividad) para mostrar la pantalla
	// de forma consistente, sin importar si llegaron al límite del monstruo.
	const estrellas = score || cantidad; 

	let titulo = "¡Seguí intentando!";
	if (estrellas === 2) {
		titulo = "¡¡Lo hiciste genial!!";
	} else if (estrellas >= 3) {
		titulo = "¡¡¡Exito total!!!";
	}

	const handleVolver = () => {
		window.location.reload();
	};

	const handleSalir = () => {
		navigate(-1);
	};

	const items = [];
	for (let i = 0; i < 3; i++) {
		if (i < estrellas) {
			items.push(
				<div key={i} className="premio-icono-wrapper">
					<span className="premio-icono">{comida.emoji}</span>
				</div>
			);
		} else {
			items.push(
				<div key={i} className="premio-icono-wrapper">
					<span className="premio-icono premio-icono-hueco">{comida.emoji}</span>
				</div>
			);
		}
	}

	return (
		<div className="premio-modal-overlay">
			<div className="game-window" role="dialog" aria-label={titulo}>
				<Almohadon tipo="marco" />
				<div className="game-window-inner">
					<Almohadon tipo="panel" />
					<TituloCurvo texto={titulo} />

					<div className="items-area">
						<Rayos lado="izq" />
						{items}
						<Rayos lado="der" />
					</div>

					<div className="game-buttons-area">
						<button className="game-button game-button--green" onClick={handleVolver} type="button">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"></path><path d="M19.6 3.6v4.6h-4.6"></path></svg>
							<span className="btn-text">VOLVER<br/>A JUGAR</span>
						</button>
						<button className="game-button game-button--blue" onClick={handleSalir} type="button">
							<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="btn-icon"><path d="M12 2.5 1.5 11.5h3.2V21h5.3v-6h4v6h5.3v-9.5h3.2z" /></svg>
							<span className="btn-text">SALIR</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// Contorno de almohadón en un cuadro de 100x100: esquinas grandes y los cuatro lados apenas
// inflados. El SVG se estira al tamaño de la ventana (preserveAspectRatio="none").
const FORMA_ALMOHADON =
	"M14 2 Q50 -2 86 2 C94 2.8 98.9 7 99.3 20 Q100.4 50 99.3 80 C98.9 93 94 97.2 86 98 " +
	"Q50 102 14 98 C6 97.2 1.1 93 0.7 80 Q-0.4 50 0.7 20 C1.1 7 6 2.8 14 2 Z";

// Fondo del marco amarillo o del panel crema, con brillos y sombras.
function Almohadon({ tipo }) {
	return (
		<svg className={`almohadon almohadon--${tipo}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
			{tipo === "marco" ? (
				<>
					<defs>
						<linearGradient id="premio-marco-degrade" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#fff27a" />
							<stop offset="0.3" stopColor="#ffd625" />
							<stop offset="0.75" stopColor="#ffc400" />
							<stop offset="1" stopColor="#ffae00" />
						</linearGradient>
					</defs>
					<path className="forma-sombra" d={FORMA_ALMOHADON} transform="translate(0 2)" />
					<path className="forma" d={FORMA_ALMOHADON} />
					<path className="brillo" d="M18 3.2 Q50 0 82 3.2" />
					<path className="brillo-chico" d="M2.3 26 Q1.7 36 1.9 46" />
					<path className="sombra-abajo" d="M18 96.8 Q50 100 82 96.8" />
				</>
			) : (
				<>
					<defs>
						<radialGradient id="premio-panel-degrade" cx="0.5" cy="0.45" r="0.6">
							<stop offset="0" stopColor="#fffcf3" />
							<stop offset="0.7" stopColor="#fdf3dd" />
							<stop offset="1" stopColor="#f6e4bd" />
						</radialGradient>
						<clipPath id="premio-panel-recorte">
							<path d={FORMA_ALMOHADON} />
						</clipPath>
					</defs>
					<path className="forma" d={FORMA_ALMOHADON} />
					<path className="sombra-arriba" d={FORMA_ALMOHADON} clipPath="url(#premio-panel-recorte)" />
					<path className="forma forma-borde" d={FORMA_ALMOHADON} fill="none" />
				</>
			)}
		</svg>
	);
}

// Cartel naranja arqueado con el título escrito sobre la curva (SVG textPath).
function TituloCurvo({ texto }) {
	const banda = "M70 98 Q300 38 530 98";
	const renglon = "M50 116 Q300 54 550 116";

	return (
		<div className="title-banner" aria-hidden="true">
			<svg viewBox="0 0 600 170" className="title-banner-svg">
				<defs>
					<path id="premio-titulo-renglon" d={renglon} />
				</defs>
				<path d={banda} className="banda banda-sombra" transform="translate(0 9)" />
				<path d={banda} className="banda banda-borde" />
				<path d={banda} className="banda banda-cuerpo" />
				<path d={banda} className="banda banda-luz" transform="translate(0 -14)" />
				<path d={banda} className="banda banda-brillo" transform="translate(0 -30)" />
				<text className="titulo-texto">
					<textPath href="#premio-titulo-renglon" startOffset="50%">{texto}</textPath>
				</text>
			</svg>
		</div>
	);
}

// Rayitos amarillos a los costados de los premios.
function Rayos({ lado }) {
	return (
		<div className={`premio-rayos premio-rayos--${lado}`} aria-hidden="true">
			<span />
			<span />
			<span />
			<span />
		</div>
	);
}
