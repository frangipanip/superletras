export const CHARACTER_KEY = "superletras-character";
export const GUEST_NAME_KEY = "superletras-guest-name";

export const CHARACTERS = {
	supernena: { label: "Supernena", image: "/assets/imagenes/supernena.png" },
	supernene: { label: "Supernene", image: "/assets/imagenes/supernene.png" }
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
		if (value === null) {
			localStorage.removeItem(key);
		} else {
			localStorage.setItem(key, value);
		}
	} catch {
		// Modo privado o storage bloqueado: la app sigue funcionando sin persistir.
	}
}
