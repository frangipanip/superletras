// Manejo de pantalla completa + bloqueo de orientacion.
// El navegador solo concede fullscreen dentro de un gesto del usuario, asi que
// en vez de pedirlo una sola vez al cargar lo reintentamos en cada interaccion
// mientras no estemos en fullscreen.

function isFullscreen() {
	return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

// Instalada como PWA en modo fullscreen/standalone ya no hace falta pedir nada.
export function isStandaloneDisplay() {
	return (
		window.matchMedia("(display-mode: fullscreen)").matches ||
		window.matchMedia("(display-mode: standalone)").matches ||
		window.navigator.standalone === true
	);
}

export function lockLandscape() {
	const orientation = window.screen?.orientation;
	if (!orientation?.lock) {
		return Promise.resolve(false);
	}

	// Chrome en Android solo permite el lock estando en fullscreen; iOS no lo soporta.
	return orientation
		.lock("landscape")
		.then(() => true)
		.catch(() => false);
}

export function requestFullscreen() {
	if (isFullscreen() || isStandaloneDisplay()) {
		return lockLandscape();
	}

	const element = document.documentElement;
	const request =
		element.requestFullscreen?.bind(element) ||
		element.webkitRequestFullscreen?.bind(element);

	if (!request) {
		return lockLandscape();
	}

	return Promise.resolve()
		.then(() => request({ navigationUI: "hide" }))
		.then(() => lockLandscape())
		.catch(() => lockLandscape());
}

// Reintenta en cada gesto del usuario y vuelve a entrar si salio con Esc o con
// el gesto del sistema. Devuelve la funcion de limpieza.
export function keepImmersive() {
	let disposed = false;
	// Tras una salida explicita esperamos un momento antes de volver a pedirlo:
	let blockedUntil = 0;

	const tryEnter = (event) => {
		// Escape es justamente la tecla con la que se sale: pedir fullscreen ahi
		// deja al navegador y a la pagina peleando.
		if (event?.type === "keydown" && event.key === "Escape") {
			return;
		}

		if (disposed || Date.now() < blockedUntil || isFullscreen() || isStandaloneDisplay()) {
			return;
		}

		requestFullscreen();
	};

	const onFullscreenChange = () => {
		if (isFullscreen()) {
			lockLandscape();
			return;
		}
		blockedUntil = Date.now() + 1000;
	};

	const onVisibility = () => {
		if (document.visibilityState === "visible" && isFullscreen()) {
			lockLandscape();
		}
	};

	const gestures = ["pointerdown", "touchend", "keydown"];
	gestures.forEach((event) => {
		document.addEventListener(event, tryEnter, { capture: true, passive: true });
	});
	document.addEventListener("fullscreenchange", onFullscreenChange);
	document.addEventListener("webkitfullscreenchange", onFullscreenChange);
	document.addEventListener("visibilitychange", onVisibility);

	lockLandscape();

	return () => {
		disposed = true;
		gestures.forEach((event) => {
			document.removeEventListener(event, tryEnter, { capture: true });
		});
		document.removeEventListener("fullscreenchange", onFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
		document.removeEventListener("visibilitychange", onVisibility);
	};
}
