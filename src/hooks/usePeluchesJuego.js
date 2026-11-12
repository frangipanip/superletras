import { useEffect, useRef, useState } from "react";
import { useRecompensa } from "../components/PremioComida";
import { sound } from "../lib/assets";

const CORRECT_ANIMATION_MS = 900;
const VIBRATE_MS = 350;

// Motor de Peluches de Mundo 2 en adelante (el de Mundo 1 vive en Iniciales.jsx): cada ronda pide un
// sonido y muestra dos dibujos; el personaje dice la consigna y lee las palabras moviendo la boca.
// rondas: [{ consigna, options: [{ id, correct }] }]
// consignaAudio(consigna) / palabraAudio(id): archivo para sound(); palabraAudio puede devolver null
// si esa palabra todavía no tiene audio grabado (se lee con la voz del navegador).
// rondaVisible (opcional): índice de la ronda cuyas opciones ya se ven en pantalla. Si se pasa, la
// consigna espera a que coincida con la ronda actual (para escenas con animación de entrada).
export function usePeluchesJuego({ runtime, letra, rondas, consignaAudio, palabraAudio, startTalking, stopTalking, rondaVisible }) {
	const [activityIndex, setActivityIndex] = useState(0);
	const [acertada, setAcertada] = useState(null);
	const [vibrating, setVibrating] = useState(() => new Set());
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
			.map((id) => [id, palabraAudio(id)])
			.filter(([, archivo]) => archivo)
			.map(([id, archivo]) => [id, runtime.audio(sound(archivo), { preload: true })])
	));
	const [instructionAudio] = useState(() => runtime.audio(sound("Pulsaeldibujo.mp3"), { preload: true }));
	const [helpAudio] = useState(() => runtime.audio(sound("apetaeltexto.mp3"), { preload: true }));
	const [premio, otorgarPremio] = useRecompensa("peluches", letra);
	const sequenceToken = useRef(0);
	// errors: imágenes equivocadas tocadas (definen cuántas comidas se ganan al terminar).
	// locked: ya se acertó la ronda y se está animando antes de pasar a la siguiente.
	const game = useRef({ errors: 0, rewarded: false, locked: false }).current;
	const activity = rondas[activityIndex];

	function silenciarTodo() {
		sequenceToken.current += 1;
		[...Object.values(consignaAudios), ...Object.values(wordAudios), instructionAudio, helpAudio].forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
			audio.onended = null;
		});
		window.speechSynthesis?.cancel();
		stopTalking();
	}

	// Consigna: sonido + "pulsá el dibujo…" + sonido + "apretá el texto…", con la boca moviéndose.
	function playInstruction() {
		silenciarTodo();
		const token = sequenceToken.current;
		const targetAudio = consignaAudios[activity.consigna];
		const sequence = [targetAudio, instructionAudio, targetAudio, helpAudio];
		startTalking();

		function playNext(index) {
			if (token !== sequenceToken.current) {
				return;
			}
			if (index === sequence.length) {
				stopTalking();
				return;
			}
			const audio = sequence[index];
			let advanced = false;
			const advance = () => {
				if (advanced) {
					return;
				}
				advanced = true;
				audio.onended = null;
				playNext(index + 1);
			};
			audio.currentTime = 0;
			audio.onended = advance;
			audio.play().catch(advance);
		}

		playNext(0);
	}

	// El personaje lee la palabra (moviendo la boca) y después sigue onEnd.
	function playWord(id, onEnd) {
		silenciarTodo();
		const token = sequenceToken.current;
		const audio = wordAudios[id];
		let completed = false;
		const finish = () => {
			if (completed || token !== sequenceToken.current) {
				return;
			}
			completed = true;
			if (audio) audio.onended = null;
			stopTalking();
			onEnd?.();
		};
		startTalking();
		if (audio) {
			audio.currentTime = 0;
			audio.onended = finish;
			audio.play().catch(finish);
			return;
		}
		if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
			finish();
			return;
		}
		const utterance = new SpeechSynthesisUtterance(id);
		utterance.lang = "es-AR";
		utterance.onend = finish;
		utterance.onerror = finish;
		window.speechSynthesis.speak(utterance);
	}

	function playFeedback(audio) {
		audio.pause();
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	const consignaLista = rondaVisible === undefined || rondaVisible === activityIndex;

	useEffect(() => {
		if (!consignaLista) {
			return undefined;
		}
		playInstruction();
		return silenciarTodo;
	}, [activityIndex, consignaLista]);

	function elegir(option) {
		if (game.locked) {
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
			playWord(option.id, () => {
				playFeedback(correctAudio);
				if (!esUltima) {
					runtime.setTimeout(() => {
						setActivityIndex((current) => current + 1);
						setAcertada(null);
						setVibrating(new Set());
						game.locked = false;
					}, CORRECT_ANIMATION_MS);
				}
			});
			return;
		}

		game.errors += 1;
		playWord(option.id, () => playFeedback(errorAudio));
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
		elegir,
		// Tocar la palabra solo la lee: no cuenta como respuesta.
		escucharPalabra(id) {
			if (!game.locked) playWord(id);
		},
		// Durante el acierto no se corta la palabra: su final es el que pasa a la siguiente ronda.
		repetirConsigna() {
			if (!game.locked) playInstruction();
		}
	};
}
