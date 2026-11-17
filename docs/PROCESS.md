# Process

Superletras es una app infantil para aprender a leer, con React, JavaScript/JSX, Vite y React Router. La API de recompensas usa Node.js y SQLite; en el servidor, Docker y nginx sirven la app y conectan la API. Las reglas generales están en `AGENTS.md` y la arquitectura en `CLAUDE.md`.

## Entorno y comandos

Desde la raíz del repositorio, usar Node.js 24 (como el contenedor) y `npm install` para instalar las dependencias.

| Comando | Uso |
|---|---|
| `npm run dev` | Inicia Vite en `http://localhost:5173` y la API de recompensas en el puerto 3001, con proxy `/api`. |
| `npm run build` | Compila la app en `dist/` y genera `version.json`. |
| `npm run preview` | Sirve el build local y levanta la API de recompensas. |
| `npm run api` | Levanta solo la API; dev y preview ya la inician automáticamente. |
| `npm run trazados` | Ejecuta el generador de trazados de letras. |

En PowerShell, si la política de ejecución bloquea `npm.ps1`, usar `npm.cmd` con los mismos argumentos. Los scripts nuevos deben funcionar en Windows; preferir Node.js y archivos `.mjs` para tareas compartidas. Los scripts de despliegue se ejecutan en el servidor Linux.

Actualmente no hay `npm run check`, linter, suite de tests ni hook de precommit configurados. La verificación disponible es el build y la prueba de los recorridos afectados en el navegador.

## Planning

Cuando el pedido sea planificar, escribir o ajustar `docs/PLAN.md` sin implementar la funcionalidad. Mantener las fases existentes y agregar el alcance nuevo donde corresponda.

- Dividir el trabajo en fases que puedan implementarse y verificarse por separado.
- Escribir criterios de aceptación como casillas: pantallas y letras afectadas, recursos necesarios, comportamiento esperado y verificaciones concretas.
- Incluir audios para supernena y supernene, imágenes, navegación, progreso y premio cuando la fase los necesite.
- Registrar decisiones, dependencias y pendientes en `docs/STATUS.md`. La versión y el estado reales de cada fase se consultan allí.

## Implementing

Al retomar trabajo, leer `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` y `docs/STATUS.md`, y revisar la rama y los cambios locales. Conservar los cambios ajenos al pedido.

Implementar las fases autorizadas en orden. Para cada fase:

1. Completar el código y sus recursos, siguiendo los componentes y utilidades existentes. Habilitar la actividad en el menú cuando tenga todos los audios e imágenes necesarios.
2. Actualizar `version` en `package.json` según semver y `AGENTS.md`. Mantener la misma versión para el conjunto de cambios de la fase.
3. Ejecutar `npm run build` y `git diff --check`; corregir los errores antes de cerrar la fase. Para cambios solo de documentación, revisar contenido, enlaces y diff; no hace falta recompilar.
4. Probar los recorridos afectados en el navegador: entrada, consigna, aciertos, errores, ayuda, cierre, premio, siguiente actividad y regreso al mundo. Verificar ambas voces y ausencia de recursos faltantes o errores de consola. Si se toca la API, verificar también recompensas, persistencia y compatibilidad con datos existentes.
5. Comprobar el diseño en horizontal, incluyendo celular de poca altura y tablet de 1138 × 712. Si cambia una pantalla compartida, revisar también los mundos que ya la usaban.
6. Actualizar los criterios de `docs/PLAN.md` y el punto de retoma de `docs/STATUS.md` con lo implementado, lo probado y lo pendiente. Actualizar `CLAUDE.md` si cambia la arquitectura.
7. Crear un commit por fase verificada. Si una comprobación no pudo realizarse, dejarla explícitamente pendiente y explicar la limitación al entregar; un build correcto no demuestra que el recorrido funciona en el navegador.

Al entregar, indicar versión, cambios, verificaciones y pendientes. Distinguir los cambios locales, los commits y lo publicado.

## Imágenes nuevas

Decisión del 17/11/2026: las imágenes nuevas (fondos, piezas sueltas, dibujos) se generan con ChatGPT (https://chatgpt.com) en el Chrome del usuario, que ya tiene la sesión iniciada. Todo se hace sin que el usuario tenga que intervenir: nada de diálogos de guardado ni descargas del navegador.

1. Adjuntar como referencia el arte actual que corresponda (la herramienta de subir archivos del navegador acepta rutas del proyecto) y pedir la imagen. Para editar un fondo de otra proporción (los de Peluches son de 1600 × 883), completarlo antes a 3:2 con franjas grises arriba y abajo y pedir que las complete. ChatGPT entrega 1536 × 1024 y respeta la composición, así que después se recorta la franja del medio y se escala al tamaño original. Para piezas sueltas, pedir fondo transparente (PNG con canal alfa).
2. Guardar la imagen sin descargarla. Desde la página de ChatGPT, copiar al portapapeles el PNG original de la última imagen generada (no una captura). El script lo guarda en el proyecto con su transparencia:

   ```js
   const imgs = [...document.querySelectorAll('main img[alt^="Generated image"]')];
   const blob = await fetch(imgs.at(-1).src).then((r) => r.blob());
   await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
   ```

   ```powershell
   powershell -File scripts/guardar-imagen-portapapeles.ps1 -Ruta descargas/<tema>/<nombre>.png
   ```

   Si la imagen no viene en PNG, pasarla antes por un `OffscreenCanvas` y `convertToBlob({ type: "image/png" })`. No usar el token de sesión de ChatGPT ni su API para bajar archivos.
3. Revisar cada imagen antes de integrarla: recortar o escalar con Python y Pillow, y verla en la app. Los originales quedan en `descargas/` (no se versiona); al proyecto solo entra la versión final.
4. Registrar herramienta, referencias y prompts en `docs/arte/<tema>-prompts.json`.

## Rules

- **Versionado**: MAYOR para cambios incompatibles o rediseños grandes; MINOR para funcionalidad nueva compatible; PATCH para correcciones, estilos, textos, assets y documentación. Al incrementar un número, los de su derecha vuelven a cero. `AppVersion` muestra la versión de `package.json`.
- **Código**: español para código, comentarios y textos; indentación con tabs. Reutilizar los patrones del proyecto antes de agregar abstracciones o dependencias.
- **Audios y timers**: crearlos mediante `usePageRuntime`; usar `crearSecuencia` para evitar superposiciones y `useAyudaError` para la ayuda progresiva. Al cambiar de pantalla deben detenerse audios, animaciones y callbacks pendientes.
- **Recursos**: usar `img`, `sound` y `commonSound` desde `src/lib/assets.js`. Respetar nombres, tildes y mayúsculas exactas para el servidor Linux. Revisar las imágenes y comprobar los archivos de las dos voces antes de habilitar una actividad. Cada actividad nueva lleva arte acorde a su mundo y función; respetar los recursos elegidos por el usuario.
- **Navegación y progreso**: mantener sincronizados el camino de cada mundo y `CAMINOS`, conservar los redirects de `legacy/` y usar `useRecompensa`/`PremioComida` para registrar el cierre. Todas las letras se pueden elegir; el brillo es una sugerencia.
- **Datos guardados**: acceder a localStorage con los wrappers y `STORAGE_KEYS` de `src/lib/storage.js`. Conservar los datos existentes y los topes compartidos entre app y API en `shared/`. Las marcas de actividades completadas son locales y no se sincronizan con el código de jugador.
- **Diseño**: orientación horizontal, con ajustes por ancho y también por altura. Aislar los estilos bajo la clase de cada pantalla y respetar el target de navegadores de `vite.config.js`.
- **Verificación**: usar las comprobaciones que existen. Agregar tests automatizados cuando haya infraestructura y aporten cobertura al comportamiento; no inventar comandos, hooks ni umbrales. No desactivar comprobaciones ni usar `git commit --no-verify` para ocultar fallos.
- **Git y publicación**: trabajar las fases de la auditoría en `auditoria-pedagogica` y mergear a `develop` cuando corresponda al pedido. Respetar la autorización vigente del usuario para commits, merges y pushes. El push a `develop` despliega en `dev-superletras.leviatas.com`; el push a `master` despliega en producción (`superletras.leviatas.com`). Publicar en producción requiere un pedido explícito. Comprobar GitHub Actions y la versión servida antes de afirmar que un cambio está desplegado.
- **Documentación**: mantener `docs/STATUS.md` actualizado y registrar las decisiones nuevas en `docs/PLAN.md`. No marcar pruebas pendientes ni fases incompletas como terminadas.
