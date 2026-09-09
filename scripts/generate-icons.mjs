// Genera los iconos del manifest a partir de un asset del juego.
// Uso: npm run icons
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.resolve("public/assets/imagenes/supernena.png");
const OUTPUT_DIR = path.resolve("public/icons");
const BACKGROUND = { r: 6, g: 19, b: 28, alpha: 1 };

async function renderIcon({ size, padding, fileName }) {
	const inner = Math.round(size * (1 - padding * 2));
	const art = await sharp(SOURCE)
		.resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.toBuffer();

	const offset = Math.round((size - inner) / 2);

	await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
		.composite([{ input: art, top: offset, left: offset }])
		.png()
		.toFile(path.join(OUTPUT_DIR, fileName));

	console.log(`icons/${fileName} (${size}x${size})`);
}

await mkdir(OUTPUT_DIR, { recursive: true });
await renderIcon({ size: 192, padding: 0.08, fileName: "icon-192.png" });
await renderIcon({ size: 512, padding: 0.08, fileName: "icon-512.png" });
// Maskable: Android recorta hasta un 20% de cada borde.
await renderIcon({ size: 512, padding: 0.2, fileName: "icon-maskable-512.png" });
