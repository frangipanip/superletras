# Reglas para agentes

## Versionado

Cada vez que se haga un cambio, actualizar `version` en `package.json` con el formato `MAYOR.MINOR.PATCH` (semver):

- **MAYOR**: cambios incompatibles o rediseños grandes (por ejemplo, rehacer la app o romper rutas/datos guardados).
- **MINOR**: funcionalidad nueva compatible (una actividad, pantalla o botón nuevo).
- **PATCH**: correcciones y ajustes chicos (bugs, estilos, textos, assets).

Al subir un número, los de la derecha vuelven a 0 (por ejemplo `2.3.4` → `2.4.0`).

La versión se muestra abajo a la derecha en la app (`src/components/AppVersion.jsx`), así que sirve para confirmar qué versión está desplegada.
