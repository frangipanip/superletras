# Estado de la auditoría pedagógica

Plan completo: [PLAN.md](PLAN.md). Rama de trabajo: `auditoria-pedagogica` (se mergea a `develop` para verlo en dev-superletras.leviatas.com; nada pasó a `master`).

Última actualización: 18/11/2026.

## Punto de retoma

- **Monstruos en Mundos 2 a 5 (18/11/2026)**: pedido planificado como fases 16 a 20 en [PLAN.md](PLAN.md#monstruos-en-mundos-2-a-5-fases-16-a-20). Fase 16 (sistema, imagen quieta de la lámina) hecha en 3.93.0. Memotest sacado de todos los mundos en 4.0.0 (fase 20): cada monstruo pide 18 comidas. Dibujar con sílabas en los seis mundos en 4.1.0 (fase 19). Cuadros de comer de los 40 monstruos en 4.1.0 a 4.1.3 (fase 17) y fondos propios de la pantalla de alimentar en 4.1.4 (fase 18): pedido completo.
- **Pedidos nuevos (17/11/2026)**: diez mensajes del usuario después de probar 3.85.1 en dev, más tres sobre las escenas de Peluches. Están planificados como fases 10 a 15 en [PLAN.md](PLAN.md#ajustes-de-la-prueba-del-17112026-fases-10-a-15). Plan registrado en 3.85.2 (solo documentación); implementadas en 3.86.0 a 3.91.0.
- **Avance**: cada fase cerrada se mergea a `develop` y se sube para verla en dev (pedido del 17/11/2026). Fases 10 (3.86.0), 11 (3.87.0), 12 (3.87.1), 13 (3.88.0), 14 (3.89.0) y 15 (Mundo 2 en 3.90.0; Mundos 3 a 6 en 3.91.0) hechas. Los tres audios nuevos de las fases 10, 12 y 14 ya están en las dos voces.
- **Próximo paso**: las fases 10 a 15 están hechas y en dev. Falta la prueba del usuario en dispositivos reales y confirmar las decisiones 2 a 6 (siguen la propuesta mientras no se diga otra cosa).
- **Imágenes nuevas**: desde el 17/11/2026 se hacen con ChatGPT en el Chrome del usuario y se guardan sin diálogos ni descargas (pasos en `PROCESS.md`, "Imágenes nuevas").
- **Entrega funcional publicada en dev**: 3.85.0, commit `b4cb081`, mergeado y subido a `develop`; despliegue de GitHub Actions `44131620057` completado correctamente y `/version.json` confirmado en 3.85.0. Incluye Tren en todos los mundos, Mundo 5 completo, Q/ARA y Oraciones. Producción (`master`) no se modificó.
- **Versión de cierre documental**: 3.85.1, actualización de este estado y de la versión visible. Los commits funcionales por fase son `a7f79eb` (Tren, 3.82.0), `ac28392` (Mundo 5, 3.83.0), `d814ec2` (Q/ARA, 3.84.0) y `b4cb081` (Oraciones, 3.85.0); la documentación previa está en `0115e10`.
- **Pendiente de antes**: revisión con personas de pronunciación, ritmo, tacto y encuadres en dispositivos reales; recuperar el arte de trenes elegido anteriormente. Las implementaciones pendientes de fases 4, 7 y 9 y la ampliación del Tren están completas. Las pruebas humanas y los recorridos de fase 5 señalados abajo siguen pendientes.
- **Arte de trenes elegido**: está en la conversación de ChatGPT indicada por el usuario. No se pudo acceder desde esta sesión; se integró arte nuevo identificado en `docs/arte/trenes-prompts.json`. Queda recuperar los recursos elegidos para compararlos y acordar si reemplazan los actuales.

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
| 4 | Consigna oral en todas las pantallas e íconos | 3.75.0 y 3.84.0 | ✅ Hecha, incluidos Q en dos partes y cartel ARA |
| 5 | Palabras: segunda vuelta sin modelo y cierre | 3.76.0 | ✅ Hecha |
| 6 | Peluches en Mundo 4 | 3.77.0 | ✅ Hecha |
| 7 | Mundo 5: G, GE, GUE, J, GÜE | 3.78.0 – 3.83.0 | ✅ Implementado: Inicio con repaso, Tren, Peluches, "¿J o G?", Mariposas y Flores |
| 8 | Mundo 6: B, V, Ñ, K, X | 3.80.0 | ✅ Hecha: Inicio, Peluches y "¿B o V?"; Mariposas, Flores y monstruos en 4.4.0 |
| 9 | Tramo de oraciones | 3.85.0 | ✅ Implementado y recorrido hasta el premio con ambas voces |
| Ampliación | Tren en todos los mundos | 3.82.0 | ✅ Implementado y recorrido en los seis mundos; pendiente recuperar arte elegido anteriormente |
| 10 | Peluches: consigna primero, sin nombrar, parlante y 6 rondas | 3.86.0 | ✅ Hecha y recorrida en los seis mundos con las dos voces |
| 11 | Tilde solo con las 3 comidas o estrellas sumadas | 3.87.0 | ✅ Hecha |
| 12 | Ositos en una ronda, Dibujar sigue a la vocal siguiente, parlante de Flores M2 | 3.87.1 | ✅ Hecha |
| 13 | Monstruo que brilla con comida para dar | 3.88.0 | ✅ Hecha |
| 14 | Memotest de letra y dibujo | 3.89.0 | ✅ Hecha |
| 15 | Peluches de Mundos 2 a 6 con tres dibujos: soportes separados del fondo | 3.90.0 y 3.91.0 | ✅ Hecha: Mundo 2 (3.90.0), hamacas de Mundos 3, 5 y 6 y cofres de Mundo 4 (3.91.0) |
| 16 | Monstruos y comida en Mundos 2 a 5 | 3.93.0 | ✅ Hecha (con la imagen quieta de la lámina) |
| 17 | Cuadros de comer de los 40 monstruos (ChatGPT) | 4.1.3 | Hecha |
| 18 | Fondo de alimentar por mundo (ChatGPT) | 4.1.4 | Hecha |
| 19 | Dibujar con sílabas en los seis mundos | 4.1.0 | ✅ Hecha |
| 20 | Sacar Memotest de todos los mundos | 4.0.0 | ✅ Hecha |
| 21 | Carga inicial rápida | 4.1.6 | ✅ Hecha |

## Pedidos del 17/11/2026

Origen: diez mensajes del usuario del 17/11/2026, después de probar 3.85.1 en dev, y tres más sobre las escenas de Peluches como respuesta a la decisión 1. El detalle por fase y los criterios están en `PLAN.md`.

**Cómo los interpreté**

- Los tres mensajes sobre nombrar los dibujos de Peluches se corrigen entre sí: vale el último (no nombrarlos y poner un parlante). De los dos primeros queda que los dibujos no respondan mientras suena la consigna.
- Hoy solo Peluches de Mundo 1 nombra los dibujos; el bloqueo durante la consigna y el parlante van en Peluches de los seis mundos.
- "Actividad 2" es Ositos de Mundo 1: es la única con rondas de sílaba agregadas (fase 4). En Mundos 2 a 5 ya tiene una sola ronda y Mundo 6 no la tiene.
- Dibujar: solo la A pasa a la siguiente (a la E); el resto se repite. Es un error del código.
- Tilde: en Mundo 1 cuentan las comidas ganadas (sincronizadas con la API), estén dadas o no; en las actividades con estrellas, la suma de estrellas de todas las partidas. En todas, el tope es 3.
- Escenas de Peluches: las "libélulas" de Mundo 2 son las luciérnagas de `PeluchesMundo2.jsx`. En Mundo 2 los soportes ya están separados del fondo (luciérnaga, brizna y haz de luz en CSS), así que alcanza con mover las luces. En Mundos 3 a 6 las hamacas están pintadas en `fondo.jpg`, por eso hacen falta fondos nuevos.

**Decidido**

- **1. Peluches de Mundos 2 a 6** (17/11/2026): también 2 rondas de dos dibujos y 4 de tres, como Mundo 1. Los soportes se separan del fondo y se repiten dos o tres veces según la ronda; las hamacas se balancean al aparecer (fase 15). Mientras tanto, la fase 10 deja esos mundos en 6 rondas de dos dibujos.

**Decisiones a confirmar** (el plan sigue la propuesta si no se dice otra cosa)

| # | Tema | Propuesta | Alternativa |
|---|---|---|---|
| 2 | Ositos con vocales | Sigue pidiendo cada vocal, como antes de la fase 4 | Una sola ronda también para las vocales |
| 3 | Monstruo de la nube | Brilla si el monstruo de la letra elegida tiene comida para dar | Brillar también si la tiene otra letra |
| 4 | Tilde en datos viejos | Lo guardado (mejor puntaje) cuenta como suma inicial: con 1 o 2 se pierde la tilde hasta completar | Conservar la tilde que ya se veía |
| 5 | Memotest, A | ANILLO, ÁRBOL, AUTO o AVIÓN (ya existen) | Generar dibujo y audio de ABEJA |
| 6 | Peluches mientras habla | Dibujos apenas atenuados hasta que termina la consigna | Sin cambio visual |
| 7 | Soporte de Peluches en Mundo 4 | Cofres abiertos en la arena, como se había pedido; fondo sin viga y cartel de la consigna aparte | Hamaca de nácar suelta, igual que en Mundos 3, 5 y 6 |

**Audios nuevos** (ElevenLabs, Malena → `supernena/`, Dante → `supernene/`)

| Archivo | Texto | Fase |
|---|---|---|
| `tocaParlante.mp3` | Si no sabés qué dibujo es, tocá el parlante. | 10 |
| `dibujarAhora.mp3` | Ahora dibujá la letra: | 12 |
| `memotestDibujos.mp3` | Buscá la carta escrita y el dibujo que empieza igual. Tocá una y después otra. | 14 |

**Dibujos nuevos** (fase 15, hechos con ChatGPT editando los fondos actuales para conservar el estilo; prompts en `docs/arte/peluches-soportes-prompts.json`). Todos integrados en 3.91.0; el cartel de la consigna de Mundo 4 quedó pintado en el fondo, colgado de algas, en lugar de ser una pieza aparte.

| Mundo | Fondo | Soporte suelto (PNG transparente) |
|---|---|---|
| 2 | — (no cambia) | — (las luces son CSS) |
| 3 | `MUNDO3/fondo.jpg` sin hamacas, con viga y cartel | Hamaca de sogas violetas y asiento de bloques |
| 4 | `MUNDO4/fondo.jpg` sin viga ni hamacas | Cofre abierto con placa y cartel de la consigna (o hamaca de nácar, según la decisión 7) |
| 5 | `MUNDO5/fondo.jpg` sin hamacas, con viga y cartel | Hamaca de cadenas y asiento robot |
| 6 | `MUNDO6/fondo.jpg` sin hamacas, con viga y cartel | Hamaca de cintas arcoíris y nube dorada |

ABEJA para Memotest solo si se elige la alternativa 5.

## Recursos

- **Audios**: los 143 de la lista (`descargas/lista-audios.tsv`) están generados con ElevenLabs e instalados en `public/assets/sonido/supernena` (Malena) y `supernene` (Dante), incluidos los de las fases 4 a 9. `acierto.mp3` es común a las dos voces y está en `sonido/`.
- **Dibujos y fondos**: la producción anterior usó ChatGPT y láminas de seis dibujos; la ampliación de los trenes, robots, ARA y Oraciones usó `imagegen` con referencias existentes y piezas transparentes. Desde la fase 15 se vuelve a ChatGPT (decisión del 17/11/2026, ver `PROCESS.md`). Ya están los recursos de Mundos 4, 5 y 6, los trenes de todos los mundos, los robots de sílabas, el cartel ARA y las seis escenas de Oraciones con su fondo. Prompts y rutas de los recursos nuevos en `docs/arte/`. Sigue pendiente recuperar el arte de trenes elegido en la conversación anterior para compararlo con el nuevo integrado.

## Hecho

### Mundo 6: Mariposas, Flores y monstruos (4.4.0)
- `RobotsSilabas.jsx` pasa a `CriaturasSilabas.jsx`: cada mundo pone en `MUNDOS` sus sílabas, distractores, consignas y dibujos. Mundo 5 sigue igual (robots).
- Mundo 6: mariposas unicornio ("B larga suena B" · "Pulsá todas las mariposas que tengan" · …: cinco de la letra y tres de otras) y jardín de flores unicornio ("Pulsá la sílaba" + la sílaba). B y V nunca se usan entre sí como distractor (`src/lib/mundo6.js`). Fondos propios (`fondoMariposasM6.jpg`, `fondoFloresM6.jpg`).
- Premios como en Mundos 2 a 5: B, V, Ñ, K y X tienen monstruo (`LETRAS_POR_MUNDO[6]`), Inicio da cerezas, Mariposas confites, Flores chocolate, Peluches frutillas, Tren cucuruchos y Dibujar galletitas; "¿B o V?" sigue con estrellas. El menú muestra `MonstruoDelMenu` y `/monstruo` tiene fondo propio (`fondoMonstruoM6.jpg`).
- Monstruos unicornio tomados de la lámina de `descargas/`: 6 cuadros por nivel (`monstruo-{b,v,enie,k,x}[-nivel2]-N.webp`; la Ñ se guarda como `enie`) y su boca en `BOCAS`. Prompts en `docs/arte/monstruos-prompts.json` y `docs/arte/mundo6-silabas-prompts.json`.
- Probado en el navegador: menú con el monstruo y los carteles nuevos, Mariposas de B hasta el premio (3 confites), "Siguiente" a Flores, `/monstruo` dando comida y evolucionando, sin errores en consola.

### Fase 15 (parte 2) — Peluches de Mundos 3 a 6 con hamacas y cofres sueltos (3.91.0)
- Arte con ChatGPT (primera vez con el método nuevo de `PROCESS.md`, "Imágenes nuevas"): fondos de Mundos 3, 5 y 6 sin hamacas (quedan la viga y el cartel), fondo de Mundo 4 sin viga ni hamacas (el cartel de la consigna sigue en el mismo lugar, colgado de algas), hamacas sueltas en PNG transparente (sogas violetas y asiento de bloques, cadenas y asiento robot, cintas arcoíris y nube dorada) y cofre abierto de nácar para Mundo 4. Prompts en `docs/arte/peluches-soportes-prompts.json`. Los fondos conservan la composición: el cartel de la consigna no se movió.
- `PeluchesPlataformas` recibe el `soporte` de cada mundo (imagen, proporción, caja del dibujo y del cartel) y pone uno por dibujo según la ronda: dos (41 y 71.5 % del escenario) o tres (37.5, 60 y 82.5 %). El tamaño sale del alto buscado, con un ancho máximo. `CON_TRES = true`: rondas 1 y 2 con dos dibujos y 3 a 6 con tres.
- Hamacas: bajan al aparecer y se balancean desde el enganche con un vaivén que se frena (2.4 s); el dibujo, la palabra y el parlante van adentro de la hamaca y se pueden tocar mientras se mueve. Al pasar a tres, las dos que estaban se corren y se achican, y baja la tercera. En cada ronda vuelven a balancearse con el dibujo nuevo.
- Cofres: aparecen con un salto y el dibujo sale de adentro (la pared de adelante del cofre se dibuja otra vez encima del dibujo). En pantallas bajas, donde el escenario es más alto que la pantalla, el cofre sube para que su cartel quede a la vista.
- Chromium (`descargas/probar-peluches.mjs`): RR, LL e Y (Mundo 3), CH y Z (Mundo 4), GÜ y G (Mundo 5), Ñ y B (Mundo 6), con las dos voces y en 1138 × 712, 1024 × 768, 844 × 390 y 667 × 375, hasta el premio y sin recursos faltantes. Rondas 2-2-3-3-3-3 donde el grupo alcanza; Z, G, Ñ y B tienen 5 rondas y GÜ 2, como antes, por las pocas palabras.
- Pendiente del usuario: ver el balanceo y el tacto en una tablet real.

### Fase 15 (parte 1) — Peluches de Mundo 2 con tres dibujos (3.90.0)
- Rondas 1 y 2 con dos dibujos y 3 a 6 con tres (`CON_TRES = true` en `PeluchesMundo2.jsx`).
- Los dibujos ya no van atados a cada luciérnaga: se ubican por `POSICIONES` (dos: debajo de cada luciérnaga; tres: 27, 51 y 75 % de la escena). En las rondas de tres las dos luciérnagas giran su haz hacia el centro (desde donde nace la luz) y se enciende una zona iluminada única en el pasto; el giro tiene transición y los dibujos nuevos aparecen recién cuando terminó (`GIRO_MS`). Al acertar brillan las dos luces.
- Con tres, los carteles son más chicos, sin hojitas, y el parlante va en la esquina de arriba: al costado se metía en el cartel vecino. `descargas/medir-nombres-m2.mjs` mide todas las palabras que pueden salir (hasta 3 sílabas): ningún par se pisa en 667 × 375, 844 × 390, 1024 × 768 ni 1138 × 712.
- Chromium (`descargas/probar-peluches.mjs`): P, N, D, F y H con las dos voces hasta el premio, rondas 2-2-3-3-3-3, sin recursos faltantes; las rondas de dos se ven como antes.

### Fase 14 — Memotest de letra y dibujo (3.89.0)
- Cada pareja es una carta con la vocal o sílaba escrita y otra con un dibujo del banco de Peluches de Mundo 1 que empieza con ese sonido, sorteado en cada partida (A: anillo, árbol, auto o avión; LA: lago, lana, lápiz o lata…). La pareja se reconoce por el sonido.
- Al dar vuelta, la carta escrita dice su sonido y la del dibujo dice la palabra (audios de `peluche/`). El dibujo va sin texto, con respaldo `.webp`. Consigna nueva `memotestDibujos.mp3` (dos voces) en lugar de `memotest.mp3`. Premio y tiempos sin cambios.
- `descargas/revisar-banco.mjs`: los 25 sonidos tienen al menos dos dibujos (LO: lobo y loro), todos con imagen y audio en las dos voces.
- Chromium (`descargas/probar-memotest.mjs`): A, L, M, S y T con las dos voces en 1138 × 712, 844 × 390 y 667 × 375: diez cartas (cinco escritas y cinco dibujos cargados, uno por sonido), el audio de cada carta, las que no son pareja se dan vuelta y las parejas quedan, premio al final, sin recursos faltantes. En juego el personaje no tapa cartas.

### Fase 13 — El monstruo brilla cuando tiene comida para dar (3.88.0)
- `tieneComidaParaDar(letras, letra)` en `recompensas.js`: alguna comida con `ganadas > dadas`.
- Mundo 1: el monstruo de la nube (letra elegida) late con un halo dorado (`drop-shadow`) mientras tenga comida para dar; se apaga al darle todo. `/monstruo`: en el selector, los monstruos de otras letras con comida sin dar tienen un aro dorado que late (sobre el círculo blanco el halo del dibujo no se veía). Con movimiento reducido, brillo fijo. Estilos compartidos en `global.css` (clase `monstruo-con-comida`).
- Chromium (`descargas/probar-brillo.mjs`, sin API): brilla con comida, se apaga al darla, en el selector solo brilla la letra con comida sin dar (no la que no tiene ni la que ya recibió todo), sin comida no brilla nada; en 1138 × 712, 844 × 390 y 667 × 375.

### Fase 12 — Ositos de una ronda, Dibujar que avanza y parlante de Flores M2 (3.87.1)
- Ositos (Mundo 1, L/M/S/T): se sacaron las dos rondas de una sílaba sola (`ositosDicen.mp3` no suena más); una ronda y premio. Vocales y Mundos 2 a 4 sin cambios.
- Dibujar (vocales): al terminar la felicitación pasa sola a la próxima vocal que falte, en orden A → E → I → O → U (después de la U, o si se eligió una a mano, la primera que quede), con "Ahora dibujá la letra:" (`dibujarAhora.mp3`, nuevo en las dos voces) y la vocal. Con las cinco, premio. Las consonantes repiten la misma letra como antes.
- Flores Mundo 2: el parlante va centrado abajo de la oruga; en la esquina tapaba la sílaba. Mundos 1, 3 y 4 no se tapaban.
- Chromium (`descargas/probar-fase12.mjs`, `capturas-flores.mjs`): A → E y U → E con las dos voces y la secuencia de audios exacta; las cinco vocales trazadas seguidas hasta el premio; L sin avanzar; Ositos L con premio tras una ronda en las dos voces; parlante de Flores M2 sin elegir la oruga; sílaba libre en 1138 × 712, 844 × 390 y 667 × 375 en los cuatro mundos.

### Fase 11 — Tilde solo con las 3 comidas o estrellas (3.87.0)
- `progreso.js` suma lo obtenido en cada partida (tope 3) en lugar de guardar el mejor puntaje; misma clave y formato, lo guardado antes cuenta como suma inicial. `actividadCompleta()` pide 3 estrellas o, en Mundo 1, 3 comidas ganadas (dadas al monstruo o no).
- Los menús de los seis mundos usan `actividadCompleta` para la tilde, el brillo de la que sigue y la letra sugerida.
- Chromium (`descargas/probar-tilde.mjs`, sin API para controlar las comidas): Mundo 1 con 2 cerezas sin tilde y con 1 más con tilde; 3 confites sin dar con tilde; dato viejo en 3 conserva la tilde; Peluches 1 → 2 sin tilde → 3 con tilde sin pasar de 3; el brillo de la que sigue se queda en Inicio hasta completarla. Mundo 2 con 2 estrellas sin tilde y con 3 con tilde; Mundo 5 con una actividad en 2 sin tilde.

### Fase 10 — Peluches: consigna primero, sin nombrar, parlante y 6 rondas (3.86.0)
- Peluches de Mundo 1 (`Iniciales.jsx`) pasa al motor compartido `usePeluchesJuego`, como los otros mundos. Ya no nombra los dibujos al aparecer.
- Mientras suena la consigna, los dibujos y los parlantes no responden y se ven apagados (`peluches-esperando`); se encienden al terminar. Entre rondas también quedan apagados hasta la consigna nueva (en Mundo 2, mientras aparecen).
- Parlante junto a cada palabra (`.palabra-parlante`, `IconoParlante`) en los seis mundos; en la primera ronda la consigna agrega `tocaParlante.mp3` (nuevo, dos voces) en lugar de `apetaeltexto.mp3`.
- Rondas (`src/lib/peluchesRondas.js`): 6 pedidos, cada sonido al menos una vez, nunca el mismo seguido, el correcto repartido entre los lugares. Mundo 1: 2 de dos dibujos + 4 de tres. Mundos 2 a 6: hasta 6 de dos dibujos (menos si el grupo tiene pocas palabras: GÜ tiene 2) hasta la fase 15; desde la fase 15 (3.90.0 y 3.91.0), también 2 de dos y el resto de tres. MOÑO sigue contra MONO.
- Banco y audios de Mundo 1 en `src/lib/peluchesMundo1.js` (para Memotest en la fase 14). En celulares de 667 px los tres dibujos se corren para que el personaje no tape el tercero.
- Chromium (`descargas/probar-peluches.mjs`): 18 recorridos hasta el premio (vocales, L, S, P, RR, LL, CH, GÜ y Ñ, con las dos voces), en 1138 × 712, 844 × 390 y 667 × 375. Toque y parlante durante la consigna sin efecto, ningún dibujo nombrado solo, `tocaParlante` solo en la primera ronda, parlante sin contar como respuesta, sin recursos faltantes ni audios superpuestos. Capturas en `descargas/pruebas-peluches/`.

### Fase 9 — Oraciones (3.85.0)
- Nueva ruta `/oraciones`, al final del camino de Mundo 1, después de Escribir; se abre junto al tramo de palabras. Reutiliza el cartel `oracionesM1.png`.
- Seis frases confirmadas por el usuario, con tres o cuatro palabras: primera vuelta con modelo tenue y segunda sin modelo, doce rondas en total. Admite toque en orden, arrastre a casilleros y teclado.
- Audios de oración y palabras en ambas voces; dos niveles de ayuda y halo. El error conserva lo ya armado. La escena se anima al completar, dice la frase y avanza al terminar el audio; premio final de estrellas y progreso local.
- Seis ilustraciones nuevas y fondo propio en `public/assets/imagenes/oraciones/`; prompts en `docs/arte/oraciones-prompts.json`.
- Chromium: doce rondas completas con cada voz, dos errores y halo, arrastre, teclado y premio. Sin audios o imágenes faltantes ni superposición de voces. Comprobados tres tamaños horizontales, navegación del menú, bloqueo de palabras, siguiente desde Escribir y regreso. Evidencia local en `descargas/pruebas-oraciones/` y scripts `descargas/probar-oraciones.mjs`, `descargas/revisar-oraciones.mjs`.
- `npm.cmd run build` y `git diff --check` correctos en 3.85.0. También se comprobó el redirect `/tren.html`, conservando las bocas del personaje original cuando se entra sin contexto de mundo.

### Cierre de fase 4 — Q y ARA (3.84.0)
- La presentación de Q se detiene después de nombrarla. Un botón luminoso Q → QU y «Tocala» invitan a continuar; al tocarlo sigue la explicación de U y aparecen las sílabas. El botón de saltear conserva su función.
- El cartel y las etiquetas visibles de R suave muestran ARA; la clave interna AR y los datos guardados se conservan. Imagen `bloqueARA.png`, prompt en `docs/arte/ara-prompt.json`.
- Comprobadas las dos partes de Q y el toque intermedio con ambas voces en 1138 × 712 y 667 × 375. Build y revisión del diff correctos. Capturas locales en `descargas/pruebas-fase4/`.

### Fase 7 — Robots voladores, jardín y repaso (3.83.0)
- Mariposas y Flores de Mundo 5 usan `RobotsSilabas.jsx` (desde 4.4.0 `CriaturasSilabas.jsx`, compartido con Mundo 6), compartiendo consignas, ayuda, audios en secuencia y premio. Robots voladores: cinco sílabas del grupo; jardín: una ronda por sílaba, con botón para escuchar cada opción sin elegirla.
- Dos fondos propios y cuatro robots transparentes. Prompts y rutas en `docs/arte/robots-prompts.json`.
- `src/lib/mundo5.js` comparte sílabas y distractores: GE/GI nunca se enfrentan a JE/JI como respuestas equivocadas. Tren usa la misma lista.
- Inicio generaliza el repaso de Q para GE, GUE y GÜE: muestra el grupo anterior y después mezcla las sílabas en las dos vueltas de pedidos.
- `mundo5Perches` guarda la posición del personaje por letra sin modificar los datos previos; los nuevos carteles se agregan al final del camino.
- Chromium: 20 recorridos de las dos actividades hasta el premio (cinco opciones × dos actividades × dos voces), con dos errores, halo, progreso y sin superposición de audios ni recursos faltantes. Ocho recorridos completos de Inicio Q/GE/GUE/GÜE con ambas voces. Verificados seis encuadres en celular y tablet y navegación desde el menú con posición guardada. Scripts y evidencia locales en `descargas/pruebas-robots/` y `descargas/*robots.mjs`, `descargas/probar-repasos.mjs`.
- `npm.cmd run build` y `git diff --check` correctos.

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
- Mariposas y Flores se completaron en 3.83.0 (ver arriba).

### Fase 6 — Peluches en Mundo 4 (3.77.0)
- `PeluchesMundo4.jsx` usa el mismo escenario de dos plataformas que Mundo 3 (`PeluchesPlataformas`, exportado desde `PeluchesMundo3.jsx`) con fondo submarino propio.
- Consigna "contiene" y sílaba resaltada en la palabra: C (CA, CO, CU), CE (CE, CI), Q (QUE, QUI), Z (ZA, ZO, ZU) y CH (CHA, CHE, CHO, CHU). El dibujo equivocado es de otro sonido de la misma letra, nunca uno que suene igual.
- 25 palabras con dibujo y audio. ZU, CHA y CHE tienen una sola palabra: se piden una vez.
- Cartel de Peluches habilitado en el camino de Mundo 4 y marcado en el progreso; "siguiente actividad" llega hasta Peluches.
- Probado en el navegador: CH completo hasta el premio, sin audios ni dibujos faltantes; Peluches de Mundo 3 sigue igual.

**Los dos pendientes de fase 4 se completaron en 3.84.0:** explicación de Q con toque intermedio y cartel ARA.

## Pendientes del lado de ustedes

- Escuchar `sonidoL.mp3`, `sonidoM.mp3` y `sonidoS.mp3` (fonemas sueltos suelen salir mal en texto a voz). Si no sirven, las teclas y el Puzzle usan `nombreX.mp3`.
- Confirmar si `letraL.mp3` dice "ele" o el sonido.
- Probar con chicos (la última página de la auditoría).

## Notas

- **Nuevo alcance (17/11/2026)**: Tren implementado en todos los mundos (ver ampliación en `PLAN.md`).

- Las marcas de completado viven en el navegador (no viajan con el código de jugador). En Mundo 1 también cuenta como completada toda actividad con comida ganada.
