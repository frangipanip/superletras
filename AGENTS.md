# Reglas para agentes

## Versionado

Cada vez que se haga un cambio, actualizar `version` en `package.json` con el formato `MAYOR.MINOR.PATCH` (semver):

- **MAYOR**: cambios incompatibles o rediseños grandes (por ejemplo, rehacer la app o romper rutas/datos guardados).
- **MINOR**: funcionalidad nueva compatible (una actividad, pantalla o botón nuevo).
- **PATCH**: correcciones y ajustes chicos (bugs, estilos, textos, assets).

Al subir un número, los de la derecha vuelven a 0 (por ejemplo `2.3.4` → `2.4.0`).

La versión se muestra abajo a la derecha en la app (`src/components/AppVersion.jsx`), así que sirve para confirmar qué versión está desplegada.

## Orientación y diseño responsive

La app se usa siempre en orientación horizontal; la orientación vertical está bloqueada. Diseñar y ajustar todas las pantallas, menús y actividades pensando en horizontal y considerando el rango completo de tamaños de celulares y tablets. En celulares horizontales, la altura puede ser reducida aunque el ancho supere los breakpoints típicos de móvil: no depender solo de `max-width`; considerar también `max-height` y probar las resoluciones afectadas. Al corregir un tamaño de pantalla, conservar los encuadres que ya funcionan en otros dispositivos (por ejemplo, Galaxy Tab S4 de 1138 × 712).
