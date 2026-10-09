import { readStorage, STORAGE_KEYS } from "./storage";

export const img = (name) => `/assets/imagenes/${name}`;
export const sound = (name) => {
	const savedCharacter = readStorage(STORAGE_KEYS.character);
	const character = savedCharacter === "supernene" ? "supernene" : "supernena";
	return `/assets/sonido/${character}/${name}`;
};

// Descarga imágenes por adelantado (quedan en la caché del navegador) para que
// la próxima pantalla aparezca completa. Se guardan las referencias para que
// no se descarten a mitad de la descarga; pedir dos veces la misma no repite nada.
const preloadedImages = new Map();

export function preloadImages(urls) {
	for (const url of urls) {
		if (preloadedImages.has(url)) {
			continue;
		}
		const image = new Image();
		image.decoding = "async";
		image.src = url;
		preloadedImages.set(url, image);
	}
}

export const MOUTH_IMAGES = [img("bocasuper.png"), img("bocasuper1.png"), img("bocasuper2.png")];
export const MUNDO1_MOUTH_IMAGES = [1, 2, 3].map((index) => img(`PERSONAJES/superbocaDulce${index}.png`));
export const MUNDO1_CHARACTERS = {
	supernena: { image: img("PERSONAJES/supernenaDulce.png"), alt: "Supernena" },
	supernene: { image: img("PERSONAJES/superneneDulce.png"), alt: "Supernene" }
};
export const MUNDO2_MOUTH_IMAGES = [1, 2, 3].map((index) => img(`PERSONAJES/superbocaMariposa${index}.png`));
export const MUNDO2_CHARACTERS = {
	supernena: { image: img("PERSONAJES/supernenaMariposa.png"), alt: "Supernena" },
	supernene: { image: img("PERSONAJES/superneneMariposa.png"), alt: "Supernene" }
};

export const CHARACTERS = {
	supernena: { image: img("supernena.png"), alt: "Supernena" },
	supernene: { image: img("supernene.png"), alt: "Supernene" }
};
