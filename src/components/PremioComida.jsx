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
					<div className="premio-icono-hueco"></div>
				</div>
			);
		}
	}

	return (
		<div className="premio-modal-overlay">
			<div className="premio-modal" role="dialog" aria-label={titulo}>
				<h2 className="premio-titulo">{titulo}</h2>
				
				<div className="premio-iconos-contenedor">
					{items}
				</div>

				<div className="premio-botones">
					<button className="btn-volver" onClick={handleVolver} type="button">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
						VOLVER<br/>A JUGAR
					</button>
					<button className="btn-salir" onClick={handleSalir} type="button">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
						SALIR
					</button>
				</div>
			</div>
		</div>
	);
}
