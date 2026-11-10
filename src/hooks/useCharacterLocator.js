import { useEffect, useState } from "react";

export function useCharacterLocator(pageRef, characterSpotRef, character, position) {
	const [offscreen, setOffscreen] = useState(false);
	const [direction, setDirection] = useState("left");

	useEffect(() => {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot || !character) {
			setOffscreen(false);
			return undefined;
		}

		function updateVisibility() {
			const viewport = page.getBoundingClientRect();
			const bounds = characterSpot.getBoundingClientRect();
			const visible = bounds.right > viewport.left && bounds.left < viewport.right &&
				bounds.bottom > viewport.top && bounds.top < viewport.bottom;
			setOffscreen(!visible);
			setDirection(bounds.left + bounds.width / 2 >= viewport.left + viewport.width / 2 ? "right" : "left");
		}

		updateVisibility();
		page.addEventListener("scroll", updateVisibility, { passive: true });
		window.addEventListener("resize", updateVisibility);
		const resizeObserver = new ResizeObserver(updateVisibility);
		resizeObserver.observe(characterSpot);

		return () => {
			page.removeEventListener("scroll", updateVisibility);
			window.removeEventListener("resize", updateVisibility);
			resizeObserver.disconnect();
		};
	}, [pageRef, characterSpotRef, character, position]);

	// Al entrar al mundo, la vista arranca centrada en el personaje. Los fondos cambian el ancho
	// del camino al cargar, así que se vuelve a centrar con cada imagen que termina, hasta que
	// el chico toca o arrastra la pantalla.
	useEffect(() => {
		const page = pageRef.current;
		if (!page || !character) return undefined;
		let userMoved = false;
		const center = () => {
			if (!userMoved) scrollToCharacter(false);
		};
		const stop = () => {
			userMoved = true;
		};
		center();
		page.addEventListener("load", center, true);
		page.addEventListener("pointerdown", stop);
		page.addEventListener("touchstart", stop, { passive: true });
		page.addEventListener("wheel", stop, { passive: true });
		return () => {
			page.removeEventListener("load", center, true);
			page.removeEventListener("pointerdown", stop);
			page.removeEventListener("touchstart", stop);
			page.removeEventListener("wheel", stop);
		};
	}, [pageRef, characterSpotRef, character]);

	// `smooth` en false salta directo (al entrar); desde el botón llega el evento y se desliza.
	function scrollToCharacter(smooth = true) {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot) return;
		const viewport = page.getBoundingClientRect();
		const bounds = characterSpot.getBoundingClientRect();
		const destination = page.scrollLeft + bounds.left + bounds.width / 2 - viewport.width / 2;
		const left = Math.max(0, Math.min(page.scrollWidth - page.clientWidth, destination));
		if (smooth === false) {
			page.scrollLeft = left;
		} else {
			page.scrollTo({ left, behavior: "smooth" });
		}
	}

	return { offscreen, direction, scrollToCharacter };
}
