// La app no se puede agrandar: un pellizco o un doble toque de un chico desarmaba la pantalla.
// El meta viewport (user-scalable=no) y el touch-action de global.css alcanzan en Android, pero
// Safari de iOS los ignora para el pellizco, así que acá se cancelan sus gestos. En compu también
// se bloquea Ctrl + rueda y Ctrl + / - / 0.
const ZOOM_KEYS = ["+", "-", "=", "0"];

function cancel(event) {
	if (event.cancelable) {
		event.preventDefault();
	}
}

export function startSinZoom() {
	const options = { passive: false };
	// Eventos propios de Safari para el pellizco.
	document.addEventListener("gesturestart", cancel, options);
	document.addEventListener("gesturechange", cancel, options);
	document.addEventListener("gestureend", cancel, options);
	// Con dos dedos, iOS informa la escala en el touchmove.
	document.addEventListener(
		"touchmove",
		(event) => {
			if (event.touches.length > 1 || (typeof event.scale === "number" && event.scale !== 1)) {
				cancel(event);
			}
		},
		options
	);
	window.addEventListener(
		"wheel",
		(event) => {
			if (event.ctrlKey) {
				cancel(event);
			}
		},
		options
	);
	window.addEventListener("keydown", (event) => {
		if ((event.ctrlKey || event.metaKey) && ZOOM_KEYS.includes(event.key)) {
			cancel(event);
		}
	});
}
