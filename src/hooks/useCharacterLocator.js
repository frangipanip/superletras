import { useEffect, useState } from "react";

export function useCharacterLocator(pageRef, characterSpotRef, character) {
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
	}, [pageRef, characterSpotRef, character]);

	function scrollToCharacter() {
		const page = pageRef.current;
		const characterSpot = characterSpotRef.current;
		if (!page || !characterSpot) return;
		const viewport = page.getBoundingClientRect();
		const bounds = characterSpot.getBoundingClientRect();
		const destination = page.scrollLeft + bounds.left + bounds.width / 2 - viewport.width / 2;
		const left = Math.max(0, Math.min(page.scrollWidth - page.clientWidth, destination));
		page.scrollTo({ left, behavior: "smooth" });
	}

	return { offscreen, direction, scrollToCharacter };
}
