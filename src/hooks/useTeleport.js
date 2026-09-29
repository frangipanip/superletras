import { useState } from "react";
import { PUF_IN_MS, PUF_OUT_MS } from "../components/PufCrema";

// Teletransporte con "Puf de crema": el personaje no recorre el camino, desaparece en el origen
// y aparece en el destino. Las posiciones son opacas (un índice, coordenadas, lo que use la pantalla).
//
// teleport: null o { stage: "out" | "in", from, to, position }. Mientras no es null, la pantalla
// dibuja al personaje en teleport.position envuelto en PUF_CHARACTER_CLASS[stage] y pone ahí un
// <PufCrema mode={stage} />. Los timers van por el runtime: si la pantalla se desmonta, se cortan.
export function useTeleport(runtime) {
	const [teleport, setTeleport] = useState(null);

	// Resuelve con toPosition cuando el personaje ya llegó y el efecto terminó.
	function teleportCharacter(fromPosition, toPosition) {
		return new Promise((resolve) => {
			// 1-2. Desaparición en el origen (el personaje se oculta en el pico de la nube).
			setTeleport({ stage: "out", from: fromPosition, to: toPosition, position: fromPosition });
			runtime.setTimeout(() => {
				// 3-4. Cambio instantáneo de posición y aparición en el destino.
				setTeleport({ stage: "in", from: fromPosition, to: toPosition, position: toPosition });
				runtime.setTimeout(() => {
					// 5-6. Personaje visible y transición terminada.
					setTeleport(null);
					resolve(toPosition);
				}, PUF_IN_MS);
			}, PUF_OUT_MS);
		});
	}

	return { teleport, teleportCharacter };
}
