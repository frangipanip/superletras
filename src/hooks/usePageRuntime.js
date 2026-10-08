import { useEffect, useState } from "react";

// Antes cada pantalla era un .html y al navegar el navegador cortaba audios y timers.
// En la SPA eso hay que hacerlo a mano: todo audio/timer creado con este runtime
// se detiene al desmontar la pantalla, y lo que llegue tarde (promesas de play,
// timeouts) se ignora.
function createRuntime() {
	let disposed = false;
	const playing = new Set();
	const timers = new Set();
	const fallbackUtterances = new Map();

	function stopMissingAudioSpeech(element) {
		const utterance = fallbackUtterances.get(element);
		if (!utterance) {
			return;
		}
		utterance.onend = null;
		utterance.onerror = null;
		fallbackUtterances.delete(element);
		window.speechSynthesis?.cancel();
	}

	function speakMissingAudio(element) {
		if (disposed || fallbackUtterances.has(element)) {
			return;
		}
		const SpeechUtterance = window.SpeechSynthesisUtterance;
		const finish = () => {
			if (!disposed) {
				element.dispatchEvent(new Event("ended"));
			}
		};
		if (!window.speechSynthesis || typeof SpeechUtterance !== "function") {
			finish();
			return;
		}
		const utterance = new SpeechUtterance("AUDIO FALTANTE");
		utterance.lang = "es-AR";
		const complete = () => {
			if (fallbackUtterances.get(element) !== utterance) {
				return;
			}
			fallbackUtterances.delete(element);
			finish();
		};
		utterance.onend = complete;
		utterance.onerror = complete;
		fallbackUtterances.set(element, utterance);
		try {
			window.speechSynthesis.speak(utterance);
		} catch {
			complete();
		}
	}

	function audio(src, { preload = false } = {}) {
		const element = new Audio(src);
		let playbackRequested = false;
		let loadFailed = false;
		if (preload) {
			element.preload = "auto";
		}
		const nativePlay = element.play.bind(element);
		const nativePause = element.pause.bind(element);
		element.addEventListener("error", () => {
			loadFailed = true;
			if (playbackRequested) {
				speakMissingAudio(element);
			}
		});
		element.play = () => {
			if (disposed) {
				return new Promise(() => {});
			}
			playbackRequested = true;
			playing.add(element);
			if (loadFailed || element.error) {
				speakMissingAudio(element);
				return Promise.resolve();
			}
			return nativePlay().catch((error) => {
				if (element.error) {
					loadFailed = true;
					speakMissingAudio(element);
					return;
				}
				throw error;
			});
		};
		element.pause = () => {
			playbackRequested = false;
			stopMissingAudioSpeech(element);
			return nativePause();
		};
		const forget = () => {
			if (element.paused || element.ended) {
				playing.delete(element);
				if (element.ended) {
					playbackRequested = false;
				}
			}
		};
		element.addEventListener("pause", forget);
		element.addEventListener("ended", forget);
		return element;
	}

	function setTimeout(callback, delay) {
		if (disposed) {
			return 0;
		}
		const id = window.setTimeout(() => {
			timers.delete(id);
			callback();
		}, delay);
		timers.add(id);
		return id;
	}

	function setInterval(callback, delay) {
		if (disposed) {
			return 0;
		}
		const id = window.setInterval(callback, delay);
		timers.add(id);
		return id;
	}

	function clearTimer(id) {
		window.clearTimeout(id);
		window.clearInterval(id);
		timers.delete(id);
	}

	function requestAnimationFrame(callback) {
		window.requestAnimationFrame(() => {
			if (!disposed) {
				callback();
			}
		});
	}

	function activate() {
		disposed = false;
	}

	function dispose() {
		disposed = true;
		fallbackUtterances.forEach((utterance) => {
			utterance.onend = null;
			utterance.onerror = null;
		});
		if (fallbackUtterances.size > 0) {
			window.speechSynthesis?.cancel();
		}
		fallbackUtterances.clear();
		timers.forEach((id) => {
			window.clearTimeout(id);
			window.clearInterval(id);
		});
		timers.clear();
		playing.forEach((element) => {
			element.onended = null;
			element.ontimeupdate = null;
			element.pause();
		});
		playing.clear();
	}

	return {
		audio,
		setTimeout,
		setInterval,
		clearTimeout: clearTimer,
		clearInterval: clearTimer,
		requestAnimationFrame,
		activate,
		dispose
	};
}

export function usePageRuntime() {
	const [runtime] = useState(createRuntime);
	useEffect(() => {
		runtime.activate();
		return runtime.dispose;
	}, [runtime]);
	return runtime;
}
