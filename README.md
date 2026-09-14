# superletras

App para aprender a leer, hecha con React + Vite y servida con nginx en Docker.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
```

## Estructura

- `public/assets/` — imagenes y sonidos (se sirven tal cual en `/assets/...`).
- `src/pages/` — una pantalla por ruta. El CSS de cada pantalla esta anidado bajo su clase (`.page-mundos`, `.page-tren`, ...) para que no se mezcle con las demas; `actividad.css` es el estilo compartido de las actividades.
- `src/components/` — barra de usuario, boton volver, pantalla completa, personaje.
- `src/hooks/usePageRuntime.js` — crea audios y timers que se cortan solos al salir de la pantalla.
- `legacy/` — version original en HTML plano, para comparar. No entra en la imagen Docker.

## Rutas

| Ruta | Antes |
| --- | --- |
| `/` | `index.html` |
| `/mundos` | `mundos.html` |
| `/mundo1` | `mundo1.html` |
| `/silabas` | `SILABASAM1.html` |
| `/mariposas`, `/tren`, `/flores` | `mariposas.html`, `tren.html`, `flores.html` |
| `/globos`, `/iniciales`, `/peluches` | `globos.html`, `iniciales.html`, `peluches.html` |

Las URLs viejas `*.html` redirigen a las nuevas.

## Deploy

```bash
docker compose up -d --build
```

El `Dockerfile` compila con Node y sirve `dist/` con nginx (`nginx.conf` resuelve las rutas de la SPA). `deploy.sh` y el workflow de GitHub Actions no cambiaron.
