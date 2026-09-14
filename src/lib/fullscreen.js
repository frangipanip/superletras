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
		Promise.resolve(enterFullscreen.call(root)).then(lockLandscape).catch(() => {});
	}
}

// Solo funciona en pantalla completa y en navegadores que lo soportan (Android); en iOS
// falla y queda el cartel de "girá el dispositivo" como respaldo.
function lockLandscape() {
	const orientation = window.screen && window.screen.orientation;
	if (orientation && orientation.lock) {
		Promise.resolve(orientation.lock("landscape")).catch(() => {});
	}
}
