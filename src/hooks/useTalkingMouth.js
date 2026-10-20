import { useCallback, useRef, useState } from "react";
import { useLocation } from "react-router";
import { MOUTH_IMAGES, MUNDO1_MOUTH_IMAGES } from "../lib/assets";

const HIDDEN_MOUTH = { visible: false, src: MOUTH_IMAGES[0], shifted: false };

// Boca del personaje: alterna las 3 imagenes cada 220 ms mientras habla.
export function useTalkingMouth(runtime, mouthImages) {
	const location = useLocation();
	const selectedMouthImages = mouthImages || (location.state?.world === 1 ? MUNDO1_MOUTH_IMAGES : MOUTH_IMAGES);
	const [mouth, setMouth] = useState(() => ({ ...HIDDEN_MOUTH, src: selectedMouthImages[0] }));
	const timerRef = useRef(0);

	function patchMouth(changes) {
		setMouth((current) => ({ ...current, ...changes }));
	}

	const clearMouthTimer = useCallback(() => {
		runtime.clearInterval(timerRef.current);
	}, [runtime]);

	const startTalking = useCallback(() => {
		clearMouthTimer();
		let index = 0;
		setMouth({ visible: true, src: selectedMouthImages[0], shifted: false });
		timerRef.current = runtime.setInterval(() => {
			index = (index + 1) % selectedMouthImages.length;
			setMouth((current) => ({
				...current,
				src: selectedMouthImages[index],
				shifted: index > 0
			}));
		}, 220);
	}, [clearMouthTimer, runtime, selectedMouthImages]);

	const stopTalking = useCallback(() => {
		clearMouthTimer();
		setMouth((current) => ({ ...current, visible: false, shifted: false }));
	}, [clearMouthTimer]);

	return { mouth, patchMouth, clearMouthTimer, startTalking, stopTalking };
}
