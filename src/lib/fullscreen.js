export function isFullscreen() {
	return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

// Las pantallas de menu solo entran a pantalla completa; las actividades alternan.
export function requestFullscreen({ toggle = false } = {}) {
	const root = document.documentElement;
	const enterFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
	const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;

	if (isFullscreen()) {
		if (toggle && exitFullscreen) {
			Promise.resolve(exitFullscreen.call(document)).catch(() => {});
		}
		return;
	}

	if (enterFullscreen) {
		Promise.resolve(enterFullscreen.call(root)).catch(() => {});
	}
}
