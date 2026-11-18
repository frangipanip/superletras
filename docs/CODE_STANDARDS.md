# Estándares de código de Superletras

## Tecnologías y organización

- Usar JavaScript con módulos ES y JSX para la interfaz React; el proyecto se compila con Vite. Mantener el estilo existente: tabulaciones, comillas dobles y punto y coma.
- Ubicar las pantallas en `src/pages/`, los componentes compartidos en `src/components/`, los hooks en `src/hooks/` y la lógica reutilizable en `src/lib/`.
- Mantener las rutas en `src/App.jsx`. Al cambiar una ruta, preservar las redirecciones de URLs antiguas y los accesos guardados que correspondan.
- Colocar imágenes y sonidos estáticos en `public/assets/` y referenciarlos desde `/assets/...`. Reutilizar las utilidades existentes para recursos, audio, progreso y almacenamiento antes de duplicar lógica.

## Interfaz y actividades

- La app se usa en orientación horizontal. Ajustar pantallas, menús y actividades para celulares y tablets horizontales; considerar tanto el ancho como la altura disponible. Probar los tamaños afectados y conservar los encuadres que ya funcionan, incluido Galaxy Tab S4 (1138 × 712).
- Mantener el CSS de cada pantalla junto a su componente y limitar los selectores a la clase de esa página. Usar `src/styles/global.css` y `src/pages/actividad.css` solo para estilos compartidos.
- Mantener las interacciones aptas para controles táctiles. Limpiar audios, temporizadores y efectos al salir de una pantalla; usar `usePageRuntime` cuando corresponda.
- Conservar el progreso y las preferencias existentes. Centralizar las claves de almacenamiento en `src/lib/storage.js` y usar sus funciones para acceder a `localStorage`.

## Cambios y verificación

- Preferir cambios simples y acotados. Añadir comentarios cuando aclaren una decisión o un comportamiento poco evidente.
- Con cada cambio, actualizar `version` en `package.json` y `package-lock.json` con SemVer: MAYOR para cambios incompatibles o rediseños grandes, MINOR para funciones nuevas compatibles y PATCH para correcciones o ajustes pequeños. La app muestra esa versión abajo a la derecha.
- Ejecutar `npm run build` después de modificar código de la app. Revisar manualmente las rutas e interacciones afectadas y sus tamaños de pantalla relevantes; el repositorio no define actualmente un comando de tests o lint.
