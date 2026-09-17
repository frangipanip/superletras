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

export default defineConfig({
	plugins: [react(), versionFile()],
	build: {
		// "assets" ya lo usa public/assets (imagenes y sonidos).
		assetsDir: "bundle",
		// Tablets/celulares viejos: CSS sin anidado ni media queries con rangos.
		target: ["es2020", "chrome87", "safari14", "firefox78", "edge88"]
	}
});
