export const STORAGE_KEYS = {
	character: "superletras-character",
	guestName: "superletras-guest-name",
	mundo1MenuOption: "superletras-mundo1-menu-option",
	installPromptDismissedAt: "superletras-install-dismissed-at"
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
	return (readStorage(STORAGE_KEYS.mundo1MenuOption) || "a").toLowerCase();
}
