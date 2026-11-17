# Estado de la auditoría pedagógica

Plan completo: [PLAN.md](PLAN.md). Rama de trabajo: `auditoria-pedagogica` (se mergea a `develop` para verlo en dev-superletras.leviatas.com; nada pasó a `master`).

Última actualización: 17/11/2026.

## Punto de retoma

- **Publicado en dev**: 3.81.0, commit `5fb710c`, mergeado y subido a `develop`; despliegue de GitHub Actions completado correctamente. Incluye el Tren de Mundo 5.
- **Trabajo posterior en la rama de auditoría**: documentación de proceso y estilo guardada en `0115e10` (3.81.4); ampliación del Tren implementada como 3.82.0. Todavía no está publicada.
- **Próximo trabajo**: Mariposas y Flores de Mundo 5 con arte de robots; luego oraciones y los dos pendientes de fase 4.
- **Arte de trenes elegido**: está en la conversación de ChatGPT indicada por el usuario. No se pudo acceder desde esta sesión; el fondo y la locomotora de Mundo 5 publicados son imágenes nuevas generadas aquí. Queda recuperar e integrar los recursos elegidos.

## Verificación del Tren (3.82.0)

- Chromium con Playwright: 22 recorridos completos (11 casos con ambas voces), incluyendo todos los mundos, dos errores, halo, ambas vueltas, premio y progreso. Casos: vocales, H, RR, R suave, LL, Q, CH, GUE, GÜE, Ñ y X. Sin errores de carga ni superposición de audios detectados. Los recorridos automáticos aceleran audios y esperas; no sustituyen la escucha humana de pronunciación y ritmo.
- Comprobación de las 25 configuraciones de Mundos 2 a 6: fichas que forman la secuencia exacta y todos sus audios presentes en ambas voces.
- Capturas de los seis mundos en 1138 × 712, 844 × 390 y 667 × 375; modelo y fichas dentro de pantalla. Ajustados el personaje de Mundo 3 y las fichas de varias letras.
- Prueba adicional de Mundo 1: vocales y L completos con ambas voces.
- Entrada al Tren desde los menús de Mundos 2 a 6, arrastre real de ficha, reinicio durante la salida del convoy y regreso al mundo comprobados con Chromium.
- `npm.cmd run build` y `git diff --check` correctos en 3.82.0.
- Evidencia y scripts de comprobación locales en `descargas/pruebas-tren/`, `descargas/probar-trenes.mjs`, `descargas/revisar-trenes.mjs` y `descargas/navegar-trenes.mjs` (ignorados por Git).
- Pendiente del usuario: escuchar consignas y pronunciaciones y probar el tacto en dispositivos reales.

## Resumen

| Fase | Qué | Versión | Estado |
|---|---|---|---|
| 1 | Distractores que suenan igual y contraste R/RR | 3.72.10 | ✅ Hecha (commit `6d023f7`) |
| 2 | Devolución que ayuda y audios que no se pisan | 3.73.0 | ✅ Hecha (commit `d15342b`) |
| 3 | Camino a palabras visible y corto | 3.74.0 | ✅ Hecha (commit `aae8b42`), en dev; 3.74.1 saca el bloqueo de Q y CE |
| 4 | Consigna oral en todas las pantallas e íconos | 3.75.0 | ✅ Hecha, salvo dos puntos (ver abajo) |
| 5 | Palabras: segunda vuelta sin modelo y cierre | 3.76.0 | ✅ Hecha |
| 6 | Peluches en Mundo 4 | 3.77.0 | ✅ Hecha |
| 7 | Mundo 5: G, GE, GUE, J, GÜE | 3.78.0 – 3.81.0 | 🟡 En curso: Inicio, Peluches, "¿J o G?" y Tren hechos; faltan Mariposas y Flores |
| 8 | Mundo 6: B, V, Ñ, K, X | 3.80.0 | ✅ Hecha: Inicio, Peluches y "¿B o V?" |
| 9 | Tramo de oraciones | Por definir | ⏳ Pendiente: faltan los dibujos |
| Ampliación | Tren en todos los mundos | 3.82.0 | ✅ Implementado y recorrido en los seis mundos; pendiente recuperar arte elegido anteriormente |

## Recursos

- **Audios**: los 143 de la lista (`descargas/lista-audios.tsv`) están generados con ElevenLabs e instalados en `public/assets/sonido/supernena` (Malena) y `supernene` (Dante), incluidos los de las fases 4 a 9. `acierto.mp3` es común a las dos voces y está en `sonido/`.
- **Dibujos y fondos**: se generan en chatgpt.com en láminas de 6 (3x2, fondo blanco), se copian con el botón "Copiar imagen" (sin descargas) y se recortan con un script (fondo transparente, 300 px). Los fondos se piden subiendo uno existente como modelo de composición. Ya están los de Mundos 4, 5 y 6 (`imagenes/peluches/MUNDO4|5|6/`, cada uno con su `fondo.jpg`) y los fondos propios de Inicio y "¿J o G?" / "¿B o V?" de Mundos 5 y 6 (`fondoInicioM5/M6.jpg`, `fondoElegirM5/M6.jpg`): cada actividad nueva lleva un fondo acorde al mundo y a la actividad, no el del menú. Faltan el cartel "ARA" de Mundo 3 (fase 4) y:
  - Mundo 5: las criaturas robot y los fondos de Mariposas y Flores.
  - `imagenes/oraciones/`: un dibujo por oración (6).

## Hecho

### Ampliación — Tren en todos los mundos (3.82.0)
- Tren agregado al final de los caminos de Mundos 2, 3, 4 y 6, conservando los índices previos de actividades y posiciones guardadas. Mundo 5 conserva su orden existente.
- Configuración por mundo y letra en `src/lib/tren.js`, con fichas de varias letras y distractor G para GU, GU para GÜ y Q para QU. Los audios usan los archivos existentes de ambas voces.
- Trece imágenes nuevas: cuatro fondos, cuatro locomotoras y cinco vagones, con transparencia en las piezas. Rutas, referencias y prompts en `docs/arte/trenes-prompts.json`.
- Unificada la secuencia de voz del Tren. Reiniciar invalida las transiciones anteriores; repetir la voz al completar ya no corta la partida; cancelación de arrastres y protección frente a toques duplicados.
- Las letras sin monstruo reciben estrellas y guardan su progreso local, evitando enviar grupos como RR o GÜ a la API de comidas. Mundo 1 conserva su comida.

### Fase 7 (Tren de Mundo 5) — 3.81.0
- Tren habilitado en el camino de Mundo 5 para G, GE, GUE, J y GÜE. Las fichas GU + E/I y GÜ + E/I se arman en dos casilleros; todos los audios de sílabas están en las dos voces.
- Fondo y locomotora robot propios. `npm run build` pasó; falta recorrerlo en navegador en tamaños de celular y tablet.
- Mergeado a `develop` y desplegado en dev como 3.81.0 (commit `5fb710c`).

### Fase 1 — Distractores (3.72.10)
- Z y CE ya no ofrecen SA…SU como equivocadas (Peces y Caballitos de Mundo 4).
- Caballitos CE y Q: 5 rondas mezclando CE/CI o QUE/QUI con CA/CO/CU.
- Bloques de Mundo 3: RR contra ARA/ERE… y AR contra RRA/RRE…
- YI fuera de Mariposas y Flores de Mundo 3.
- Inicio de Q: las cinco sílabas mezcladas. Peluches de Mundo 3: LLU se pide una sola vez.

### Fase 2 — Devolución (3.73.0)
- Piezas nuevas: `secuenciaAudio.js` (audios en fila sin pisarse) y `useAyudaError` (1.er error "casi" + lo pedido; 2.º error "mirá, es esta" + halo en la correcta).
- Flores, Mariposas, Peluches (todos los mundos), Inicio y Tren: sílaba → correcto/error → ayuda, y la ronda siguiente espera al audio.
- Inicio: pedidos mezclados, botón ⏭ para saltear la presentación, `acierto.mp3` entre pedidos.
- Tren: modelo solo en 2 rondas de la vuelta 1, dice la sílaba al completar, se puede tocar ficha y después casillero; sin botón "A / a".
- Pastel y Puzzle: la ficha mal soltada rebota y suena. Escribir: solo se borran las letras equivocadas. Memotest: 1,5 s para ver las cartas.

### Fase 3 — Camino a palabras (3.74.0)
- El monstruo pide 3 comidas por actividad (21 por letra); app y API comparten el tope.
- Monstruo: consigna oral, botón "darle todo" y marcas en lugar de números.
- `progreso.js` + `caminos.js`: tilde en las actividades completadas, brillo en la que sigue y letra que titila en los menús de Mundos 1 a 4.
- Mundo 1: explicación la primera vez y las palabras se abren solas al evolucionar el monstruo.
- Premio con botón "siguiente actividad". Mundo 2: se toca toda la flor. Sin prerrequisitos entre letras: la letra que titila es solo una sugerencia (el bloqueo de Q y CE se sacó el 17/11 a pedido).

### Fase 4 — Consignas e íconos (3.75.0)
- Memotest: consigna al entrar y al tocar al personaje.
- Dibujar: consigna al entrar; un solo punto que titila con una línea-flecha hacia dónde ir (antes, números del 1 al 7); al terminar, acierto + "¡Muy bien! Dibujaste la letra:" + la letra; botón de borrar con ícono de 80 px y letras más grandes.
- Puzzle: 1.ª ronda "Poné las letras en orden para armar:" + palabra, después "Escuchá:" + palabra; cada letra suena al tocarla.
- Escribir: entra directo a la bebida; palabras de la letra elegida (antes siempre LULA, OLA, LALI); "Escribí:" + palabra (+ cómo usar las teclas en la 1.ª ronda); cada tecla dice su letra; "Otra bebida" pasa a ícono ↻.
- Decora: consigna por etapa ("Tocá la manga/el frasco/la frutilla/la vela que dice:" + palabra); las equivocadas empiezan lo más parecido posible a la pedida; cartel de cierre "¡Fabuloso!" con ↻.
- Ositos (Mundo 1, consonantes): dos rondas más con una sola sílaba ("tocá todos los ositos que dicen LA") entre las otras sílabas de la letra.
- Bloques de Mundo 3 (R suave, RR) y Peces de Mundo 4 (CE, Q): la consigna dice la regla.
- Inicio: presentaciones de H muda, RR fuerte, R suave y Z igual que S.
- Peluches de Mundo 1: la segunda vuelta muestra tres dibujos y los dibujos se nombran al aparecer.
- Flores: parlante chico en cada opción para escucharla sin elegirla.
- Peluches de Mundos 2 y 3: entrada de ~5 s a ~2 s y se prefieren palabras de hasta 3 sílabas (`src/lib/palabrasCortas.js`).
- "↻ Reiniciar" y "Repetir consigna" pasan a botones con ícono.
- Arreglo en `secuenciaAudio.js`: una secuencia cancelada ya no corta la nueva cuando comparten audio (en Dibujar quedaba muda después del acierto).

### Fase 5 — Palabras sin modelo (3.76.0)
- Barcos, Pastel, Puzzle y Escribir: 3 rondas con modelo + 3 sin modelo y cartel de premio con estrellas (las actividades de palabras no dan comida; `otorgarPremio` devuelve estrellas y anota el progreso). Decora suma el premio al terminar el pastel.
- Barcos: en la vuelta 2 la bandeja muestra "?"; palabras más grandes; al acertar dice la palabra y "Empieza con:" + la sílaba.
- Pastel: en la vuelta 2 los huecos quedan vacíos, hay una ficha de más y pregunta "¿Qué parte va primero?". Se saltean MIEL, LEE, LIO, ISLA, UAU, OIA y AIA (no se cortan bien en dos).
- Puzzle: en la vuelta 2 los casilleros no muestran la letra.
- Escribir: seis palabras; en la vuelta 2 la palabra se ve 3 s y después "Ahora sin mirar".
- Probado en el navegador: Barcos completo. Pastel, Puzzle, Escribir (vuelta 2) y Decora (premio) compilan pero no los recorrí hasta el final.

### Fase 8 — Mundo 6: B, V, Ñ, K, X (3.80.0)
- El menú de Mundo 6 ya habla (bienvenida y el sonido de cada letra al elegirla) y abre Inicio, Peluches y "¿B o V?", con marcas de completado, brillo en la siguiente y letra sugerida.
- Inicio con fondo propio de prado de unicornios y la letra escrita en un círculo (no hay imágenes de letra para Mundo 6). La K dice "recordá: suena como CA y QUE" (`recordaK.mp3`).
- `PeluchesMundo6.jsx` (consigna "contiene"): 22 palabras con dibujo y audio y fondo de arcoíris. En la Ñ, MOÑO siempre aparece contra MONO (`pares` en `PeluchesPlataformas`): la única diferencia es la virgulilla.
- "¿Va con B o con V?" en `ElegirLetra.jsx`: mitad de palabras con B y mitad con V (BARCO, BOTA, BURRO, BOXEO / VACA, VASO, VELA, VIOLÍN). BEBÉ no va: su segunda B delataba la respuesta.
- Fondos propios para Inicio y "¿J o G?" / "¿B o V?" en Mundos 5 y 6 (taller de robots, establo de unicornios), en lugar del fondo del menú.
- Probado en el navegador: menú, Inicio de K y X, Peluches de Ñ y "¿B o V?" completos hasta el premio, sin audios ni dibujos faltantes.
- El personaje de Mundo 6 en las actividades es el común: no hay bocas de unicornio (`superbocaUnicornio*`).

### Fase 7 (segunda parte) — "¿Va con J o con G?" (3.79.0)
- `ElegirLetra.jsx` (`/elegir`): dibujo, palabra con hueco (_IRAFA, ABE_A) y dos letras grandes. Dice la palabra, "¿Va con jota o con ge?" y la palabra otra vez. Error: ayuda en dos pasos con halo en la letra correcta. Al acertar se completa el hueco; 6 palabras y premio con estrellas.
- Siempre salen GENTE, GELATINA, GIRASOL y JIRAFA (las que confunden de verdad) y dos de JUGO, JAULA, JABÓN y ABEJA. GIGANTE no se usa: su segunda G delataba la respuesta.
- Tercer cartel del camino de Mundo 5 (`JoGbtn.png`, generado igual que los otros medallones). La pantalla ya acepta otro mundo con otro par de letras: en Mundo 6 se usa para B/V (`BoVbtn.png` ya está).
- Probado en el navegador: ronda completa con dos errores (casi → mirá, es esta + halo) y premio.

### Fase 7 (primera parte) — Mundo 5: Inicio y Peluches (3.78.0)
- El menú de Mundo 5 ya abre actividades: Inicio y Peluches, con marcas de completado, brillo en la siguiente y la letra sugerida titilando.
- Inicio presenta cada letra con su regla ("con la a, la o y la u suena suave", "la u no se escucha", "con los dos puntitos la u sí se escucha") y usa el robot de la letra, el personaje robot y el fondo del taller.
- `PeluchesMundo5.jsx` (consigna "contiene"): 22 palabras con dibujo y audio y fondo de fábrica de robots. El dibujo equivocado es siempre de otro sonido de la misma letra.
- Se corrigió el audio de GÜE de supernena (`suengaGÜE.mp3` → `suenaGÜE.mp3`): antes había un caso especial en el código.
- Probado en el navegador: menú, Inicio de GE (presentación y sílabas) y Peluches de GÜE.
- De esta fase siguen pendientes Mariposas y Flores de Mundo 5 (necesitan criaturas y fondos robot).

### Fase 6 — Peluches en Mundo 4 (3.77.0)
- `PeluchesMundo4.jsx` usa el mismo escenario de dos plataformas que Mundo 3 (`PeluchesPlataformas`, exportado desde `PeluchesMundo3.jsx`) con fondo submarino propio.
- Consigna "contiene" y sílaba resaltada en la palabra: C (CA, CO, CU), CE (CE, CI), Q (QUE, QUI), Z (ZA, ZO, ZU) y CH (CHA, CHE, CHO, CHU). El dibujo equivocado es de otro sonido de la misma letra, nunca uno que suene igual.
- 25 palabras con dibujo y audio. ZU, CHA y CHE tienen una sola palabra: se piden una vez.
- Cartel de Peluches habilitado en el camino de Mundo 4 y marcado en el progreso; "siguiente actividad" llega hasta Peluches.
- Probado en el navegador: CH completo hasta el premio, sin audios ni dibujos faltantes; Peluches de Mundo 3 sigue igual.

**Quedó pendiente de la fase 4:**
- Explicación de la Q "partida en dos con un toque en el medio" en Inicio (animación nueva).
- Cartel "ARA" del menú de Mundo 3 (falta la imagen).

## Pendientes del lado de ustedes

- Escuchar `sonidoL.mp3`, `sonidoM.mp3` y `sonidoS.mp3` (fonemas sueltos suelen salir mal en texto a voz). Si no sirven, las teclas y el Puzzle usan `nombreX.mp3`.
- Confirmar si `letraL.mp3` dice "ele" o el sonido.
- Probar con chicos (la última página de la auditoría).

## Notas

- **Nuevo alcance (17/11/2026)**: Tren implementado en todos los mundos (ver ampliación en `PLAN.md`).

- Si se pasa a la actividad siguiente con el botón del premio y se vuelve al mundo, el personaje aparece en la actividad anterior; el brillo de "la que sigue" sí marca la correcta.
- Las marcas de completado viven en el navegador (no viajan con el código de jugador). En Mundo 1 también cuenta como completada toda actividad con comida ganada.
