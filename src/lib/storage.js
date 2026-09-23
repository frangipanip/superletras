export const STORAGE_KEYS = {
	character: "superletras-character",
	guestName: "superletras-guest-name",
	mundo1MenuOption: "superletras-mundo1-menu-option",
	selectedWorld: "superletras-selected-world",
	installPromptDismissedAt: "superletras-install-dismissed-at",
	// Recompensas (ver src/lib/recompensas.js).
	codigo: "superletras-codigo",
	dispositivo: "superletras-dispositivo",
	comidas: "superletras-comidas",
	comidasPendientes: "superletras-comidas-pendientes"
};

export function readStorage(key) {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function writeStorage(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Sin almacenamiento (modo privado): la app sigue funcionando sin recordar.
	}
}

export function removeStorage(key) {
	try {
		localStorage.removeItem(key);
	} catch {
		// Idem writeStorage.
	}
}

export function readMenuOption() {
	const val = readStorage(STORAGE_KEYS.mundo1MenuOption);
	return val ? val.toLowerCase() : null;
}

export function readSelectedWorld() {
	return readStorage(STORAGE_KEYS.selectedWorld);
}
