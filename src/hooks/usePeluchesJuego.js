import { useEffect, useRef, useState } from "react";
import { useRecompensa } from "../components/PremioComida";
import { sound } from "../lib/assets";
import { crearSecuencia, mudo } from "../lib/secuenciaAudio";
import { useAyudaError } from "./useAyudaError";

const CORRECT_ANIMATION_MS = 900;
const VIBRATE_MS = 350;

// Motor de Peluches de todos los mundos: cada ronda pide un sonido y muestra dos o tres dibujos; el
// personaje dice la consigna y lee las palabras moviendo la boca. Los dibujos no se nombran solos:
// cada palabra tiene un parlante para escucharla.
// rondas: [{ consigna, options: [{ id, correct }] }]
// consignaAudio(consigna) / palabraAudio(id): archivo para sound().
// Devuelve también `pista`: tras el segundo error de la ronda hay que resaltar el dibujo correcto
// (clase "pista-correcta"), y `esperandoConsigna`: mientras suena la consigna los dibujos y los
// parlantes no responden (si no, al oír el nombre de un dibujo el chico lo tocaba por instinto).
// rondaVisible (opcional): índice de la ronda cuyas opciones ya se ven en pantalla. Si se pasa, la
// consigna espera a que coincida con la ronda actual (para escenas con animación de entrada).
export function usePeluchesJuego({ runtime, letra, rondas, consignaAudio, palabraAudio, instructionAudioFile = "Pulsaeldibujo.mp3", startTalking, stopTalking, rondaVisible }) {
	const [activityIndex, setActivityIndex] = useState(0);
	const [acertada, setAcertada] = useState(null);
	const [vibrating, setVibrating] = useState(() => new Set());
	const [esperandoConsigna, setEsperandoConsigna] = useState(true);
	const [errorAudio] = useState(() => runtime.audio(sound("error.mp3")));
	const [correctAudio] = useState(() => runtime.audio(sound("correcto.mp3"), { preload: true }));
	const [consignaAudios] = useState(() => Object.fromEntries(
		[...new Set(rondas.map((ronda) => ronda.consigna))].map((consigna) => [
			consigna,
			runtime.audio(sound(consignaAudio(consigna)), { preload: true })
		])
	));
	const [wordAudios] = useState(() => Object.fromEntries(
		[...new Set(rondas.flatMap((ronda) => ronda.options.map((option) => option.id)))]
			.map((id) => [id, runtime.audio(sound(palabraAudio(id)), { preload: true })])
	));
	const [instructionAudio] = useState(() => runtime.audio(sound(instructionAudioFile), { preload: true }));
	const [helpAudio] = useState(() => runtime.audio(sound("tocaParlante.mp3"), { preload: true }));
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	// Todo lo que suena va en una sola secuencia: consigna, palabra, devolución y ayuda no se pisan.
	const [secuencia] = useState(() => crearSecuencia({ startTalking, stopTalking }));
	const ayuda = useAyudaError(runtime);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	// consigna: está sonando la consigna (los toques se ignoran).
	const game = useRef({ errors: 0, rewarded: false, locked: false, consigna: true }).current;
	const activity = rondas[activityIndex];

	function esperarConsigna(esperando) {
		game.consigna = esperando;
		setEsperandoConsigna(esperando);
	}

	// Consigna: sonido + "pulsá el dibujo…" + sonido. "Si no sabés qué dibujo es, tocá el parlante" se
	// dice solo en la primera ronda. Al terminar se habilitan los dibujos.
	function playInstruction() {
		const targetAudio = consignaAudios[activity.consigna];
		esperarConsigna(true);
		secuencia.reproducir(
			[targetAudio, instructionAudio, targetAudio, activityIndex === 0 ? helpAudio : null],
			() => esperarConsigna(false)
		);
	}

	const consignaLista = rondaVisible === undefined || rondaVisible === activityIndex;

	useEffect(() => {
		if (!consignaLista) {
			return undefined;
		}
		ayuda.reiniciar();
		playInstruction();
		return secuencia.cancelar;
	}, [activityIndex, consignaLista]);

	function elegir(option) {
		if (game.locked || game.consigna) {
			return;
		}

		if (option.correct) {
			game.locked = true;
			setAcertada(option.id);
			const esUltima = activityIndex === rondas.length - 1;
			if (esUltima && !game.rewarded) {
				game.rewarded = true;
				otorgarPremio(game.errors);
			}
			const startedAt = Date.now();
			// Palabra → felicitación; la ronda siguiente espera a que termine de sonar.
			secuencia.reproducir([wordAudios[option.id], mudo(correctAudio)], () => {
				if (esUltima) {
					return;
				}
				runtime.setTimeout(() => {
					// La ronda siguiente espera apagada hasta que termine su consigna (en Mundo 2, también
					// mientras aparecen sus dibujos).
					esperarConsigna(true);
					setActivityIndex((current) => current + 1);
					setAcertada(null);
					setVibrating(new Set());
					game.locked = false;
				}, Math.max(200, CORRECT_ANIMATION_MS - (Date.now() - startedAt)));
			});
			return;
		}

		game.errors += 1;
		// Palabra tocada → error → ayuda con el sonido pedido.
		secuencia.reproducir([
			wordAudios[option.id],
			mudo(errorAudio),
			...ayuda.trasError(consignaAudios[activity.consigna])
		]);
		setVibrating((current) => new Set(current).add(option.id));
		runtime.setTimeout(() => {
			setVibrating((current) => {
				const next = new Set(current);
				next.delete(option.id);
				return next;
			});
		}, VIBRATE_MS);
	}

	return {
		activity,
		activityIndex,
		acertada,
		vibrating,
		premio,
		pista: ayuda.pista && !acertada,
		esperandoConsigna,
		elegir,
		// Tocar la palabra (o su parlante) solo la lee: no cuenta como respuesta.
		escucharPalabra(id) {
			if (!game.locked && !game.consigna) secuencia.reproducir([wordAudios[id]]);
		},
		// Durante el acierto no se corta la palabra: su final es el que pasa a la siguiente ronda.
		repetirConsigna() {
			if (!game.locked) playInstruction();
		}
	};
}
