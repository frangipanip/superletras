import { useEffect, useState } from "react";
import { isFullscreen, requestFullscreen } from "../lib/fullscreen";

export default function FullscreenButton({ toggle = false }) {
	const [active, setActive] = useState(isFullscreen);

	useEffect(() => {
		if (!toggle) {
			return undefined;
		}
		const update = () => setActive(isFullscreen());
		document.addEventListener("fullscreenchange", update);
		return () => document.removeEventListener("fullscreenchange", update);
	}, [toggle]);

	return (
		<button
			className="fullscreen-button"
			type="button"
			aria-label="Pantalla completa"
			aria-pressed={toggle ? active : undefined}
			onClick={() => requestFullscreen({ toggle })}
		>
			⛶
		</button>
	);
}
