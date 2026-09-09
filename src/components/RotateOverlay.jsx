import { useMediaQuery } from "../hooks/useMediaQuery.js";

// iOS (y algunos Android) no permiten screen.orientation.lock, asi que en
// vertical tapamos la app y pedimos girar el dispositivo.
export function RotateOverlay() {
	const isPortrait = useMediaQuery("(orientation: portrait)");
	const isTouch = useMediaQuery("(pointer: coarse)");

	if (!isPortrait || !isTouch) {
		return null;
	}

	return (
		<div className="rotate-overlay" role="alert">
			<svg viewBox="0 0 100 140" aria-hidden="true" focusable="false">
				<rect
					x="8"
					y="8"
					width="84"
					height="124"
					rx="12"
					fill="none"
					stroke="currentColor"
					strokeWidth="6"
				/>
				<circle cx="50" cy="118" r="5" fill="currentColor" />
			</svg>
			<p>Gira el dispositivo</p>
		</div>
	);
}
