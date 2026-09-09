import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Superletras",
				short_name: "Superletras",
				description: "Juego de lectura Superletras",
				start_url: "/",
				scope: "/",
				display: "fullscreen",
				display_override: ["fullscreen", "standalone"],
				orientation: "landscape",
				background_color: "#000000",
				theme_color: "#000000",
				lang: "es",
				icons: [
					{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
					{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
					{ src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
				]
			},
			workbox: {
				// Solo precacheamos el shell de la app: las imagenes y los audios pesan
				// ~30 MB y se cachean al vuelo la primera vez que se usan.
				globPatterns: ["**/*.{js,css,html,webmanifest}", "icons/*.png"],
				navigateFallback: "/index.html",
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === "image",
						handler: "CacheFirst",
						options: {
							cacheName: "superletras-imagenes",
							expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 },
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: ({ request }) => request.destination === "audio",
						handler: "CacheFirst",
						options: {
							cacheName: "superletras-sonidos",
							rangeRequests: true,
							expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 },
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	],
	server: {
		host: true
	}
});
