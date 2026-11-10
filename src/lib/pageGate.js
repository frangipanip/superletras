// Indica si la pantalla actual ya terminó de cargar. PageLoader la cierra en cada cambio de
// ruta y la abre cuando las imágenes están listas (o enseguida si ya estaban en la caché).
// Mientras está cerrada, los audios del runtime esperan en vez de sonar debajo del cartel.
// Arranca cerrada: la primera pantalla también pasa por PageLoader.
let ready = false;
const waiting = new Set();

export function isPageReady() {
	return ready;
}

export function holdPage() {
	ready = false;
}

export function releasePage() {
	if (ready) {
		return;
	}
	ready = true;
	const callbacks = [...waiting];
	waiting.clear();
	callbacks.forEach((callback) => callback());
}

// Corre `callback` cuando la pantalla esté lista (en el momento si ya lo está).
// Devuelve una función para cancelar la espera.
export function whenPageReady(callback) {
	if (ready) {
		callback();
		return () => {};
	}
	waiting.add(callback);
	return () => waiting.delete(callback);
}
