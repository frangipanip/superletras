// Reproduce audios uno después del otro, sin que se pisen. Pedir otra secuencia (o cancelar())
// corta la anterior y su alTerminar ya no se llama.
// Cada paso es un Audio de runtime.audio(), o mudo(audio) para que suene sin mover la boca
// (efectos como error.mp3). Los pasos vacíos (null, undefined) se saltean.
export const mudo = (audio) => (audio ? { audio, boca: false } : null);

export function crearSecuencia({ startTalking, stopTalking } = {}) {
	let token = 0;
	let actual = null;

	function cancelar() {
		token += 1;
		if (actual) {
			actual.onended = null;
			actual.pause();
			actual.currentTime = 0;
			actual = null;
		}
		stopTalking?.();
	}

	function reproducir(pasos, alTerminar) {
		cancelar();
		const propio = token;
		const lista = pasos.filter(Boolean).map((paso) => (paso.audio ? { audio: paso.audio, boca: paso.boca !== false } : { audio: paso, boca: true }));

		function seguir(index) {
			if (propio !== token) {
				return;
			}
			actual = null;
			if (index >= lista.length) {
				stopTalking?.();
				alTerminar?.();
				return;
			}
			const { audio, boca } = lista[index];
			let avanzado = false;
			const avanzar = () => {
				// Una secuencia ya cancelada no toca el audio: puede estar sonando en la nueva (el
				// play() cortado falla tarde y le borraba el onended).
				if (avanzado || propio !== token) {
					return;
				}
				avanzado = true;
				audio.onended = null;
				seguir(index + 1);
			};
			actual = audio;
			if (boca) {
				startTalking?.();
			} else {
				stopTalking?.();
			}
			audio.currentTime = 0;
			audio.onended = avanzar;
			audio.play().catch(avanzar);
		}

		seguir(0);
	}

	return { reproducir, cancelar };
}
