import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");

const port = Number(process.env.PORT ?? 80);
const host = process.env.HOST ?? "0.0.0.0";

const app = express();

app.disable("x-powered-by");

// El service worker y el manifest no se cachean: si no, la app queda vieja.
app.get(["/sw.js", "/registerSW.js"], (req, res, next) => {
	res.set("Cache-Control", "no-cache, no-store, must-revalidate");
	next();
});

app.get("/manifest.webmanifest", (req, res, next) => {
	res.set("Cache-Control", "no-cache");
	res.type("application/manifest+json");
	next();
});

app.get("/salud", (req, res) => {
	res.json({ ok: true });
});

app.use(
	express.static(distDir, {
		index: false,
		setHeaders(res, filePath) {
			// Los archivos de /assets/ llevan hash en el nombre: se cachean fuerte.
			if (filePath.includes(`${path.sep}assets${path.sep}`)) {
				res.set("Cache-Control", "public, max-age=2592000");
			}
		}
	})
);

// SPA: cualquier ruta desconocida cae en index.html.
app.use((req, res) => {
	res.set("Cache-Control", "no-cache");
	res.sendFile(indexFile);
});

app.listen(port, host, () => {
	console.log(`Superletras escuchando en http://${host}:${port}`);
});
