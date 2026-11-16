import { useRef, useState } from "react";
import { sound } from "../lib/assets";

// Ayuda después de equivocarse, igual en todas las actividades:
// 1.er error de la ronda: "Casi. Escuchá otra vez:" + lo pedido.
// 2.º error en adelante: "Mirá, es esta:" + lo pedido + "Tocala." y pista=true, para que la pantalla
// le ponga la clase "pista-correcta" (brillo, en actividad.css) a la respuesta.
// trasError(pedido) cuenta el error y devuelve los pasos para crearSecuencia().reproducir();
// reiniciar() se llama al empezar cada ronda.
export function useAyudaError(runtime) {
	const [audios] = useState(() => ({
		casi: runtime.audio(sound("casi.mp3")),
		mira: runtime.audio(sound("miraEsEsta.mp3")),
		tocala: runtime.audio(sound("tocala.mp3"))
	}));
	const errores = useRef(0);
	const [pista, setPista] = useState(false);

	function trasError(pedido) {
		errores.current += 1;
		if (errores.current >= 2) {
			setPista(true);
			return [audios.mira, pedido, audios.tocala];
		}
		return [audios.casi, pedido];
	}

	function reiniciar() {
		errores.current = 0;
		setPista(false);
	}

	return { pista, trasError, reiniciar };
}
