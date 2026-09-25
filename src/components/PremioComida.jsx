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
				<div className="game-window-inner">
					<div className="title-banner">
						<h2>{titulo}</h2>
					</div>
					
					<div className="items-area">
						{items}
					</div>

					<div className="game-buttons-area">
						<button className="game-button game-button--green" onClick={handleVolver} type="button">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
							<span className="btn-text">VOLVER<br/>A JUGAR</span>
						</button>
						<button className="game-button game-button--blue" onClick={handleSalir} type="button">
							<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="btn-icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
							<span className="btn-text">SALIR</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
