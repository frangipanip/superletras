# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

App infantil para aprender a leer (React 19 + Vite + React Router, servida con nginx en Docker). Código, comentarios y textos en español; indentación con tabs.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
docker compose up -d --build   # imagen de producción (build Node + nginx)
```

No hay tests ni linter configurados; `npm run build` es la verificación disponible.

## Regla obligatoria: versionado (de AGENTS.md)

En **cada cambio** subir `version` en `package.json` (semver):
- **MAYOR**: rediseños o cambios incompatibles (romper rutas o datos guardados en localStorage).
- **MINOR**: funcionalidad nueva (actividad, pantalla, botón).
- **PATCH**: bugs, estilos, textos, assets.

Al subir un número, los de la derecha vuelven a 0. `src/components/AppVersion.jsx` importa la versión desde `package.json` y la muestra abajo a la derecha, para confirmar qué está desplegado.

## Arquitectura

- **Migración desde HTML plano**: `legacy/` es la versión original (un `.html` por pantalla), solo como referencia para comparar comportamiento; no entra en la imagen Docker. `src/App.jsx` mapea cada `*.html` viejo a su ruta nueva con redirects — si se agrega o renombra una ruta, mantener esos redirects. `/globos`, `/iniciales` y `/peluches` todavía usan `PlaceholderActivity`.
- **`usePageRuntime`** (`src/hooks/usePageRuntime.js`): en la SPA, al navegar el navegador ya no corta audios ni timers. Toda pantalla debe crear sus `Audio` y sus `setTimeout`/`setInterval`/`requestAnimationFrame` a través de `runtime.*`; al desmontar se pausan/limpian y los callbacks tardíos se ignoran. Usar `window.setTimeout` o `new Audio` directo deja sonidos sonando en otras pantallas.
- **Patrón de las actividades** (ver `Silabas.jsx`, `Mariposas.jsx`, `Tren.jsx`): los audios se crean una vez con `useState(() => runtime.audio(...))`; el estado que leen callbacks de audio/timers vive en un objeto `useRef(...).current` (`game`) sincronizado a mano con el `useState` visible, para evitar closures con valores viejos.
- **Personaje que habla**: `useTalkingMouth(runtime)` anima la boca (3 imágenes, `MOUTH_IMAGES`) sobre el componente `Character`; `useSelectedCharacter` lee/escribe el personaje elegido (supernena/supernene) en localStorage.
- **localStorage**: siempre vía `src/lib/storage.js` (`STORAGE_KEYS`, wrappers con try/catch para modo privado). Cambiar claves o formatos rompe datos guardados → MAYOR.
- **Assets**: `public/assets/imagenes` y `public/assets/sonidos` se sirven tal cual en `/assets/...`; referenciarlos con `img(name)` / `sound(name)` de `src/lib/assets.js`. Por eso Vite emite el bundle en `bundle/` (`assetsDir` en `vite.config.js`) en lugar de `assets/`.
- **App instalable (PWA)**: `public/manifest.json` (fullscreen + landscape) y `public/sw.js` (no cachea: las navegaciones van a la red con `no-store`). `src/lib/pwa.js` captura `beforeinstallprompt`, registra el SW y compara la versión del bundle con `/version.json` (lo emite un plugin en `vite.config.js`) al abrir, al volver a la app y cada 10 min; `AppBanners` muestra el cartel de instalar y, si hay versión nueva, recarga al estar en un menú (`?actualizar=<versión>` evita bucles).
- **CSS**: cada pantalla importa su `.css` con todo anidado bajo su clase raíz (`.page-silabas`, `.page-tren`, ...) para no pisar a otras; `src/pages/actividad.css` es el estilo compartido de actividades y `src/styles/global.css` el global. El target de build apunta a tablets/celulares viejos (chrome87, safari14): evitar CSS nesting nativo y media queries con sintaxis de rango.

## Deploy

- `Dockerfile`: build con `node:24-alpine` y sirve `dist/` con `nginx:alpine`. `nginx.conf` resuelve el fallback de la SPA, no cachea `index.html`, cachea `/bundle/` como inmutable y declara los MIME de wav/m4a/mp3 (Safari no reproduce sin ellos).
- `docker-compose.yml`: servicio `web` + `cloudflared` (túnel con `CLOUDFLARED_TUNNEL_TOKEN` desde `.env`).
- Push a `master` dispara `.github/workflows/deploy.yml` en un runner self-hosted, que corre `deploy.sh` dentro del clon existente (`vars.DEPLOY_DIR`): hace `git pull --ff-only` de `master`, elige un puerto libre, lo escribe como `WEB_PORT` en `.env` y levanta `docker compose up -d --build --remove-orphans`.
