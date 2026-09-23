import { useState } from "react";
import { otorgarPremio } from "../lib/recompensas";
import "./PremioComida.css";

// Premio de comida al completar una actividad: `otorgar(errores)` lo suma a la letra y
// `premio` se le pasa a <PremioComida> para mostrarlo.
export function useRecompensa(actividad, letra) {
	const [premio, setPremio] = useState(null);

	function otorgar(errores = 0) {
		const resultado = otorgarPremio(letra, actividad, errores);
		if (resultado && resultado.cantidad > 0) {
			setPremio(resultado);
		}
	}

	return [premio, otorgar];
}

// Las comidas ganadas aparecen saltando en el centro y se van; no bloquea los toques.
export default function PremioComida({ premio }) {
	if (!premio) {
		return null;
	}
	const { comida, cantidad } = premio;
	return (
		<div key={premio.id} className="premio-comida" role="status" aria-label={`Ganaste ${cantidad} ${comida.nombre}`}>
			<div className="premio-comida-caja">
				{Array.from({ length: cantidad }, (_, index) => (
					<span key={index} className="premio-comida-emoji" style={{ animationDelay: `${index * 180}ms` }}>
						{comida.emoji}
					</span>
				))}
				<span className="premio-comida-texto">+{cantidad}</span>
			</div>
		</div>
	);
}
