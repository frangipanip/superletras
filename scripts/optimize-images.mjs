// Reescala las imagenes que vienen del diseño a un tamaño util para pantalla.
// Es idempotente: si un archivo ya esta dentro del ancho objetivo, se saltea.
// Los originales quedan en el historial de git. Uso: npm run optimize:imagenes
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGES_DIR = path.resolve("public/assets/imagenes");

const TARGETS = [
	// Fondos a pantalla completa.
	{ files: ["FONDOM1.jpg"], maxWidth: 1920, format: "jpeg" },
	// Personajes: se muestran a 250px como mucho, x3 por pantallas de alta densidad.
	{ files: ["supernena.png", "supernene.png"], maxWidth: 750, format: "png" }
];

const megabytes = (bytes) => (bytes / 1024 / 1024).toFixed(2);

async function encode(pipeline, format) {
	if (format === "jpeg") {
		return pipeline.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
	}
	// palette reduce el PNG a 8 bits conservando el alfa, que es lo que hace la
	// diferencia grande en ilustraciones planas.
	return pipeline.png({ palette: true, quality: 90, effort: 10 }).toBuffer();
}

for (const { files, maxWidth, format } of TARGETS) {
	for (const fileName of files) {
		const file = path.join(IMAGES_DIR, fileName);
		const source = await readFile(file);
		const { width, height } = await sharp(source).metadata();

		if (width <= maxWidth) {
			console.log(`${fileName}: ya mide ${width}px de ancho, se deja como esta`);
			continue;
		}

		const output = await encode(
			sharp(source).resize({ width: maxWidth, withoutEnlargement: true }),
			format
		);

		await writeFile(file, output);

		const after = await sharp(output).metadata();
		console.log(
			`${fileName}: ${width}x${height} ${megabytes(source.length)} MB -> ` +
				`${after.width}x${after.height} ${megabytes(output.length)} MB`
		);
	}
}
