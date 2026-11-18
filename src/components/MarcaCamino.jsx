import { useSyncExternalStore } from "react";
import { ACTIVIDADES_SOLO_ESTRELLAS, COMIDA_POR_ACTIVIDAD, LETRAS } from "../../shared/comidas.js";
import { cantidadComida, getRecompensas, subscribeRecompensas } from "../lib/recompensas";

const ESTRELLA = "⭐";

// Lo que daría la próxima partida (igual que otorgarPremio): la comida de la actividad mientras al
// monstruo de la letra le falte o, si ya se ganaron todas o la actividad no da comida, estrellas.
function premioQueDa(letras, letra, actividad) {
	const comida = COMIDA_POR_ACTIVIDAD[actividad];
	if (!comida || !LETRAS.includes(letra) || ACTIVIDADES_SOLO_ESTRELLAS.includes(actividad)) {
		return ESTRELLA;
	}
	return cantidadComida(letras, letra, comida.clave).ganadas < comida.necesarias ? comida.emoji : ESTRELLA;
}

// Marca en la esquina del cartel de cada actividad del camino: el tilde si está completa y, si no,
// el premio que da. `letra` es la clave en minúscula y `actividad` la clave de la actividad
// (sin actividad no se muestra nada). Va dentro de un contenedor con position relative o absolute.
export default function MarcaCamino({ letra, actividad, hecha }) {
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	if (hecha) {
		return <span className="camino-hecho" aria-hidden="true">✓</span>;
	}
	if (!letra || !actividad) {
		return null;
	}
	return <span className="camino-hecho camino-premio" aria-hidden="true">{premioQueDa(letras, letra, actividad)}</span>;
}
