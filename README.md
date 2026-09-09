# Superletras

Juego de lectura. React + Vite, servido como PWA instalable en mobile.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173 (tambien accesible desde la red local)
```

`npm run dev` levanta con `--host`, asi que se puede abrir desde el celular
usando la IP que imprime la consola.

## Build

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ para probar el build
npm run icons      # regenera public/icons/* desde public/assets/imagenes/supernena.png
npm run optimize:imagenes # reescala las imagenes que vienen del diseño (ver scripts/optimize-images.mjs)
```

## Estructura

```
index.html            entry de Vite
src/
  main.jsx            monta React y registra el service worker
  App.jsx             rutas + pantalla completa + aviso de girar el dispositivo
  screens/            Home (/), Mundos (/mundos), Mundo1 (/mundo1)
  components/         BackButton, GuestProfile, RotateOverlay
  lib/immersive.js    fullscreen + bloqueo de orientacion
  lib/storage.js      personaje y nombre en localStorage
  styles/             CSS por pantalla + shared.css
public/assets/        imagenes y sonidos (se sirven desde /assets/...)
public/icons/         iconos del manifest
legacy/               las paginas HTML originales, como referencia
design/               fuentes de diseño (.psd), no se publican
```

## Pantalla completa y orientacion

- Los navegadores solo conceden pantalla completa dentro de un gesto del usuario,
  asi que `src/lib/immersive.js` la pide en el primer toque y la vuelve a pedir en
  cada gesto mientras no este activa. Si el usuario sale con Esc se respeta un
  segundo antes de reintentar.
- La orientacion se fija con `screen.orientation.lock("landscape")`, que solo
  funciona en Android/Chrome estando en fullscreen.
- Donde el lock no existe (iOS), en vertical se muestra el aviso "Gira el
  dispositivo" (`RotateOverlay`). Solo aparece en dispositivos tactiles.
- Instalada como PWA arranca en fullscreen horizontal por el manifest, sin
  necesidad de pedir nada.

## Instalar en el celular

Abrir la app en Chrome (Android) y usar "Agregar a la pantalla de inicio". En iOS,
Safari > Compartir > "Agregar a inicio". Requiere HTTPS (o localhost); el tunel de
Cloudflare del `docker-compose.yml` ya sirve por HTTPS.

## Deploy

`docker compose up -d --build` construye la imagen (Dockerfile multi-stage: build
de Vite + servidor Node/Express que sirve `dist/`) y levanta el tunel de
Cloudflare. El contenedor escucha en el puerto 80 (`PORT`), asi que `deploy.sh` y
el workflow de GitHub Actions siguen funcionando igual.

Para probar el server de produccion sin Docker: `npm run build && npm start`
(usa `PORT=3000 npm start` para no pedir el puerto 80).
