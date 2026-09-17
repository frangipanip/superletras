import { version } from "../../package.json";

// Estado compartido de la app instalable (aviso de instalación y versión nueva),
// leído por AppBanners con useSyncExternalStore.
let state = { canInstall: false, latestVersion: null };
const listeners = new Set();
let installEvent = null;

// Parámetro que se agrega al recargar por una versión nueva: rompe cachés intermedias
// y sirve para no entrar en un bucle de recargas si igual llega la versión vieja.
const UPDATE_PARAM = "actualizar";
let attemptedVersion = null;

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

function setState(changes) {
	state = { ...state, ...changes };
	listeners.forEach((listener) => listener());
}

export function subscribePwa(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getPwaState() {
	return state;
}

export function isInstalledApp() {
	return (
		window.matchMedia("(display-mode: fullscreen)").matches ||
		window.matchMedia("(display-mode: standalone)").matches
	);
}

// Se llama antes de montar React: Chrome dispara beforeinstallprompt muy temprano.
export function startPwa() {
	const url = new URL(window.location.href);
	if (url.searchParams.has(UPDATE_PARAM)) {
		attemptedVersion = url.searchParams.get(UPDATE_PARAM);
		url.searchParams.delete(UPDATE_PARAM);
		window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
	}

	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		installEvent = event;
		setState({ canInstall: true });
	});
	window.addEventListener("appinstalled", () => {
		installEvent = null;
		setState({ canInstall: false });
	});

	if (!import.meta.env.PROD) {
		return;
	}

	if ("serviceWorker" in navigator) {
		const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
		if (document.readyState === "complete") {
			register();
		} else {
			window.addEventListener("load", register);
		}
	}

	// La app instalada queda abierta en segundo plano por días: se revisa al volver a ella.
	checkForUpdate();
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") {
			checkForUpdate();
		}
	});
	window.addEventListener("online", checkForUpdate);
	window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
}

async function checkForUpdate() {
	try {
		const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
		if (!response.ok) {
			return;
		}
		const data = await response.json();
		if (data.version && data.version !== version && data.version !== state.latestVersion) {
			setState({ latestVersion: data.version });
		}
	} catch {
		// Sin conexión: se vuelve a intentar en el próximo chequeo.
	}
}

export async function promptInstall() {
	const event = installEvent;
	if (!event) {
		return;
	}
	installEvent = null;
	setState({ canInstall: false });
	event.prompt();
	try {
		await event.userChoice;
	} catch {
		// El usuario cerró el diálogo.
	}
}

// Recarga automática solo si todavía no se intentó con esta versión (evita bucles).
export function canAutoUpdate() {
	return Boolean(state.latestVersion) && state.latestVersion !== attemptedVersion;
}

export async function reloadToLatest() {
	try {
		const registration = await navigator.serviceWorker?.getRegistration();
		await registration?.update();
	} catch {
		// Sin service worker: alcanza con recargar.
	}
	const url = new URL(window.location.href);
	url.searchParams.set(UPDATE_PARAM, state.latestVersion || String(Date.now()));
	window.location.replace(url.toString());
}
