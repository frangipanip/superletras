import { lazy } from "react";

// Cada pantalla (salvo la portada) es un archivo aparte que se baja recién cuando hace falta: así
// la primera carga trae solo lo de la portada. Cuando la portada ya se ve, el resto se baja de a
// uno en segundo plano (precargarPantallas) para que entrar después a cualquier pantalla sea
// inmediato.
const CARGAS = [];
const RECARGA_KEY = "superletras-recarga-pantalla";

// Si el archivo de una pantalla ya no está en el servidor (hubo un deploy con la app abierta),
// se recarga la página una sola vez para traer la versión nueva.
function cargarConRecarga(cargar) {
	return cargar().then(
		(modulo) => {
			try {
				window.sessionStorage.removeItem(RECARGA_KEY);
			} catch {
				// Modo privado: sin sessionStorage no se marca nada.
			}
			return modulo;
		},
		(error) => {
			let yaRecargo = false;
			try {
				yaRecargo = window.sessionStorage.getItem(RECARGA_KEY) === "1";
				window.sessionStorage.setItem(RECARGA_KEY, "1");
			} catch {
				yaRecargo = true;
			}
			if (!yaRecargo) {
				window.location.reload();
				return new Promise(() => {});
			}
			throw error;
		}
	);
}

export function pantalla(cargar) {
	CARGAS.push(cargar);
	return lazy(() => cargarConRecarga(cargar));
}

let precargaIniciada = false;

export function precargarPantallas() {
	if (precargaIniciada) {
		return;
	}
	precargaIniciada = true;
	const pendientes = [...CARGAS];
	const siguiente = () => {
		const cargar = pendientes.shift();
		if (!cargar) {
			return;
		}
		cargar().catch(() => {}).finally(() => window.setTimeout(siguiente, 30));
	};
	// Un rato después de arrancar, para no competir con las imágenes de la primera pantalla.
	window.setTimeout(siguiente, 1500);
}
