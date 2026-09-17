// Service worker mínimo: Android lo pide para ofrecer instalar la app.
// No cachea nada a propósito: las páginas siempre se piden a la red sin caché HTTP,
// así la app instalada no se queda con un index.html (y un bundle) viejo.
self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	if (event.request.mode !== "navigate") {
		return;
	}
	event.respondWith(
		fetch(event.request, { cache: "no-store" }).catch(() => fetch(event.request))
	);
});
