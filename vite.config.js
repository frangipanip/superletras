import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	build: {
		// "assets" ya lo usa public/assets (imagenes y sonidos).
		assetsDir: "bundle",
		// Tablets/celulares viejos: CSS sin anidado ni media queries con rangos.
		target: ["es2020", "chrome87", "safari14", "firefox78", "edge88"]
	}
});
