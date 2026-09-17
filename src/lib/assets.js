export const img = (name) => `/assets/imagenes/${name}`;
export const sound = (name) => `/assets/sonidos/${name}`;

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

export const CHARACTERS = {
	supernena: { image: img("supernena.png"), alt: "Supernena" },
	supernene: { image: img("supernene.png"), alt: "Supernene" }
};
