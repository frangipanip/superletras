import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { abrirLaboratorio } from "../lib/laboratorio";
import { estrellasTotales, getRecompensas, subscribeRecompensas } from "../lib/recompensas";

// Contador del saldo global de estrellas, a la izquierda del monstruo del camino (Mundos 1 a 6).
// Es un botón propio (no va dentro del del monstruo): abre el Laboratorio de Luces compartido, por
// eso se ve también con 0. `x` es la posición horizontal del centro del monstruo (la misma que usa
// su botón fijo).
export default function ContadorEstrellas({ mundo, x = "50%", disabled = false }) {
	const navigate = useNavigate();
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const cantidad = estrellasTotales(letras);

	function abrir() {
		if (!disabled) abrirLaboratorio(navigate, mundo);
	}

	return (
		<button
			className="monstruo-estrellas"
			type="button"
			style={{ "--monstruo-x": x }}
			aria-disabled={disabled || undefined}
			aria-label={`Laboratorio de luces: ${cantidad} ${cantidad === 1 ? "estrella" : "estrellas"}`}
			onClick={abrir}
		>
			<span aria-hidden="true">⭐</span>
			{cantidad}
		</button>
	);
}
