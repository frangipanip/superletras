// Tapa toda la app cuando el dispositivo está vertical; se muestra/oculta solo por CSS
// (media query de orientación) para que las pantallas sigan montadas y no pierdan su estado.
export default function RotateDevice() {
	return (
		<div className="rotate-device" role="alert">
			<div className="rotate-device__phone" aria-hidden="true" />
			<p className="rotate-device__text">Girá el dispositivo para jugar</p>
		</div>
	);
}
