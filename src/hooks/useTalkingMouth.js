import { useRef, useState } from "react";
import { MOUTH_IMAGES } from "../lib/assets";

const HIDDEN_MOUTH = { visible: false, src: MOUTH_IMAGES[0], shifted: false };

// Boca del personaje: alterna las 3 imagenes cada 220 ms mientras habla.
export function useTalkingMouth(runtime) {
	const [mouth, setMouth] = useState(HIDDEN_MOUTH);
	const timerRef = useRef(0);

	function patchMouth(changes) {
		setMouth((current) => ({ ...current, ...changes }));
	}

	function clearMouthTimer() {
		runtime.clearInterval(timerRef.current);
	}

	function startTalking() {
		clearMouthTimer();
		let index = 0;
		setMouth({ visible: true, src: MOUTH_IMAGES[0], shifted: false });
		timerRef.current = runtime.setInterval(() => {
			index = (index + 1) % MOUTH_IMAGES.length;
			patchMouth({ src: MOUTH_IMAGES[index], shifted: index > 0 });
		}, 220);
	}

	function stopTalking() {
		clearMouthTimer();
		patchMouth({ visible: false, shifted: false });
	}

	return { mouth, patchMouth, clearMouthTimer, startTalking, stopTalking };
}
