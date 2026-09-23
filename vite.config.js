import { spawn } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "./package.json";

// Publica /version.json con la versión del build: la app instalada lo consulta
// para saber si quedó desactualizada (ver src/lib/appUpdate.js).
function versionFile() {
	return {
		name: "superletras-version-file",
		apply: "build",
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "version.json",
				source: JSON.stringify({ version })
			});
		}
	};
}

// La API de recompensas (server/index.js) se levanta junto con "npm run dev" y "npm run preview",
// y Vite le pasa /api. En producción corre en su propio contenedor y la une nginx.
const API_PORT = 3001;
const apiProxy = { "/api": `http://localhost:${API_PORT}` };

function rewardsApi() {
	let child = null;
	function start() {
		if (child) {
			return;
		}
		child = spawn(process.execPath, ["server/index.js"], {
			env: { ...process.env, PORT: String(API_PORT) },
			stdio: ["ignore", "inherit", "pipe"]
		});
		child.stderr.on("data", (data) => {
			// Si ya hay una API corriendo ("npm run api"), se usa esa.
			if (String(data).includes("EADDRINUSE")) {
				console.log(`API de superletras: ya hay una corriendo en el puerto ${API_PORT}`);
				return;
			}
			process.stderr.write(data);
		});
		child.on("exit", () => {
			child = null;
		});
		const stop = () => child?.kill();
		process.once("exit", stop);
		process.once("SIGINT", () => {
			stop();
			process.exit();
		});
	}
	return {
		name: "superletras-rewards-api",
		configureServer(server) {
			start();
			server.httpServer?.once("close", () => child?.kill());
		},
		configurePreviewServer(server) {
			start();
			server.httpServer?.once("close", () => child?.kill());
		}
	};
}

export default defineConfig({
	plugins: [react(), versionFile(), rewardsApi()],
	server: { proxy: apiProxy },
	preview: { proxy: apiProxy },
	build: {
		// "assets" ya lo usa public/assets (imagenes y sonidos).
		assetsDir: "bundle",
		// Tablets/celulares viejos: CSS sin anidado ni media queries con rangos.
		target: ["es2020", "chrome87", "safari14", "firefox78", "edge88"]
	}
});
