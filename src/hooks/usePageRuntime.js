import { useEffect, useState } from "react";

// Antes cada pantalla era un .html y al navegar el navegador cortaba audios y timers.
// En la SPA eso hay que hacerlo a mano: todo audio/timer creado con este runtime
// se detiene al desmontar la pantalla, y lo que llegue tarde (promesas de play,
// timeouts) se ignora.
function createRuntime() {
	let disposed = false;
	const playing = new Set();
	const timers = new Set();

	function audio(src, { preload = false } = {}) {
		const element = new Audio(src);
		if (preload) {
			element.preload = "auto";
		}
		const nativePlay = element.play.bind(element);
		element.play = () => {
			if (disposed) {
				return new Promise(() => {});
			}
			playing.add(element);
			return nativePlay();
		};
		const forget = () => {
			if (element.paused || element.ended) {
				playing.delete(element);
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
