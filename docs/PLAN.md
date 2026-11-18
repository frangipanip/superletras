# Plan: aplicar la auditoría pedagógica a Superletras

## Contexto

La auditoría (13/11/2026, sobre la 3.72.9) concluye que el tramo de sílabas funciona, que el de palabras se resuelve copiando formas sin leer, que un chico solo puede no llegar nunca a palabras (60 comidas + pasos sin voz) y que hay rondas donde una respuesta correcta al oído se marca como error (Mundo 4) o donde lo difícil nunca se contrasta (R fuerte / suave).

Decisiones tuyas que este plan respeta:

- **Alcance: todo**, incluido contenido nuevo (Peluches Mundo 4, Mundos 5 y 6, oraciones).
- **Audios nuevos**: los genero en elevenlabs.io con **Malena** (→ `sonido/supernena/`) y **Dante** (→ `sonido/supernene/`).
- **Dibujos y fondos nuevos**: los genero en chatgpt.com.
- **Monstruo**: 3 comidas por actividad (21 por letra en vez de 60).
- **Palabras**: `src/lib/palabras.js` no se toca (siguen LOLE, SASO, etc.).
- **Tren en todos los mundos**: los Mundos 1 a 6 tendrán la actividad Tren en su camino, adaptada a las letras y sílabas de cada mundo (decisión del 17/11/2026).

Cada fase es un commit propio con su subida de versión (regla de CLAUDE.md), se verifica con `npm run build` y se prueba en el navegador antes de pasar a la siguiente. El orden sigue la prioridad de la auditoría.

## Piezas compartidas nuevas (se crean en la fase que las usa primero)

| Pieza | Qué hace | La usan |
|---|---|---|
| `src/lib/secuenciaAudio.js` | Reproduce una lista de audios uno tras otro con token de cancelación y boca (`startTalking/stopTalking`). Hoy cada pantalla lo reescribe (Barcos, Pastel, Iniciales, `usePeluchesJuego`). Solo para código nuevo o tocado, no refactor general. | Fases 2 a 9 |
| `src/hooks/useAyudaError.js` | Cuenta errores por ronda. 1.er error: `casi.mp3` + audio de lo pedido. 2.º error: `miraEsEsta.mp3` + lo pedido + `tocala.mp3` y devuelve `pista=true` para que la pantalla agregue la clase `pista-correcta` (brillo, en `actividad.css`). | Flores, Mariposas, Inicio, Tren, Peluches, Barcos, Decora |
| `src/lib/progreso.js` | Actividades completadas por letra: `{ l: { inicio: 3 }, rr: { mariposas: 2 } }` (mejor puntaje). Clave nueva `STORAGE_KEYS.actividadesCompletadas` (aditiva, no rompe datos). `otorgarPremio` (`src/lib/recompensas.js`) la escribe; en Mundo 1 también cuenta como completada toda actividad con `ganadas > 0`, así los jugadores actuales no arrancan de cero. | Menús, PremioComida, Mundo 4 |
| `src/lib/caminos.js` | Orden de actividades por mundo (Mundo 1 sale de `shared/actividades.js`). Da "la siguiente actividad". | PremioComida, menús |

## Fase 1 — Distractores que suenan igual y contraste R/RR (3.72.10)

Mejora 2 de la auditoría. Solo listas, sin audios nuevos.

- `src/lib/mundo4.js` → `createMundo4IncorrectSyllables`: **Z** y **CE** dejan de usar SA…SU (y Z deja de usar CE/CI); pasan a T, M, L, P. Arregla Peces (`Mariposas.jsx`) y Caballitos (`Flores.jsx`) a la vez porque comparten la función.
- `Flores.jsx` Mundo 4, modos `ce` y `q`: 5 rondas en lugar de 2, pidiendo mezclado CE, CI / QUE, QUI junto con CA, CO, CU (hoy `syllables[mode].length`).
- `Mariposas.jsx` Mundo 3: en `rr` los bloques equivocados salen de ARA, ERE, IRI…; en `ar` salen de RRA, RRE… (hoy `MUNDO3_INCORRECT_SYLLABLES` = L, M, S, T). `r` queda igual.
- **YI**: se saca de Mariposas y Flores de Mundo 3 (queda en Inicio). Ojo: `Flores.jsx` usa `TOTAL_ACTIVITIES = 5` fijo; pasa a usar el largo de la lista.
- `InicioActividad.jsx`, Q ronda mezclada: se piden las cinco (QUE, QUI, CA, CO, CU) en orden mezclado.
- `PeluchesMundo3.jsx`: LLU (una sola palabra) se pide una vez, no en las dos vueltas.

## Fase 2 — Devolución que ayuda y audios que no se pisan (3.73.0)

Mejora 4. Audios nuevos: `casi.mp3` ("Casi. Escuchá otra vez:"), `miraEsEsta.mp3` ("Mirá, es esta:"), `tocala.mp3` ("Tocala."), y un efecto corto `acierto.mp3` (ElevenLabs Sound Effects, común a las dos voces).

- **Chupetines / Orugas / Animalitos / Caballitos** (`Flores.jsx`, `handleFlowerClick`): hoy sílaba y `correcto/error` arrancan juntos. Pasa a sílaba → feedback → (si error) ayuda. La ronda siguiente espera el final de `correcto.mp3` (hoy timer fijo de 1400 ms).
- **Ositos / Mariposas / Bloques / Peces** (`Mariposas.jsx`, `handleButterflyClick`): sílaba primero, felicitación después.
- **Peluches** (`Iniciales.jsx` y `usePeluchesJuego.js`): esperar a que termine `correcto.mp3` antes de la consigna siguiente; `apetaeltexto.mp3` solo en la primera ronda; en `Iniciales.jsx` mezclar el orden de consignas en cada vuelta (hoy siempre A, E, I, O, U).
- **Inicio** (`InicioActividad.jsx`): orden mezclado en fases 2 y 3 (`requestedItemIndex` recorre una lista mezclada, no `mode.items`); tras el error se repite el pedido; `acierto.mp3` antes del pedido siguiente; el toque en el fondo deja de saltear la presentación (`skipIntroduction` pasa a un botón con ícono) y cada cartel se puede tocar apenas aparece.
- **Tren** (`Tren.jsx`): ayuda tras el error; al completar dice la sílaba antes de que parta; vuelta 1 de solo 2 sílabas como demostración y vuelta 2 con las 5; acepta tocar letra y después casillero (patrón de `Pastel.jsx`: `selectedOption` + `placeOption`); letras más grandes; se saca el botón "A / a" (`toggleCase`).
- **Pastel y Puzzle**: soltar mal hace rebotar la ficha y dice su sílaba o letra (hoy `placeOption/placeCookie` devuelven sin hacer nada).
- **Escribir**: al confirmar mal quedan las letras correctas y se sacuden solo las equivocadas (hoy `setEscrito([])`).
- **Memotest**: cartas distintas visibles 1,5 s o hasta que termine el audio (hoy 550 ms).
- Mayúsculas en los nombres de Peluches (CSS) y etiqueta de Ositos al doble (`Mariposas.css`).

## Fase 3 — Camino a palabras visible y corto (3.74.0)

Mejora 3. Audios nuevos: `monstruoHambre.mp3`, `monstruoQuiereMas.mp3`, `menuPrimeraVez.mp3` (textos de la auditoría).

- `shared/comidas.js`: `necesarias: 3` en las siete comidas. Lo leen app y API, así que los topes coinciden. Quien ya dio 3 o más de cada una queda evolucionado solo; `ganadas` por encima del tope ya está cubierto por el `Math.max(0, …)` de `recompensas.js` y `server/index.js`. Revisar el premio agrupado de `Dibujar.jsx` (`otorgarPremio(0, cantidad)`) contra el tope nuevo.
- `src/pages/Monstruo.jsx`: consigna oral al entrar y cuando no queda comida guardada; botón con ícono "darle todo" (recorre `darComida` con vuelos escalonados); la píldora `2/9` pasa a tres marcas sin números.
- `src/pages/Mundo1.jsx`: la secuencia de palabras (`startWordAudioSequence`) arranca sola al volver al mundo con el monstruo evolucionado y sin `unlockedWordPaths[letra]`; tocar al monstruo queda como repetición.
- Carteles del camino en Mundos 1 a 4: tilde/estrellas en las completadas y brillo en la siguiente (`progreso.js`). En el menú titila la primera letra sin completar y, la primera vez, suena `menuPrimeraVez.mp3`.
- `src/components/PremioComida.jsx`: tercer botón con ícono "siguiente actividad" (`caminos.js`; se omite si la siguiente es de palabras y está bloqueada).
- `Mundo2.jsx`: área de toque de cada letra a toda la flor y primera actividad centrada. `Mundo5.jsx`: mostrar solo los carteles que existan. Sin prerrequisitos entre letras: todas las letras de todos los mundos se pueden elegir siempre; la que titila es solo una sugerencia (decisión del 17/11/2026, reemplaza el bloqueo de Q y CE de Mundo 4).

## Fase 4 — Consigna oral en todas las pantallas e íconos (3.75.0)

Mejora 5 más los hallazgos por actividad. Las frases con parte variable se arman con un audio fijo + el audio de la sílaba/palabra que ya existe (`la.mp3`, `PLlula.mp3`), para no grabar una por combinación.

| Pantalla | Cambio | Audios nuevos |
|---|---|---|
| `Memotest.jsx` | Consigna al entrar y al tocar al personaje (hoy `Character` sin `onClick`) | `memotest.mp3` |
| `Dibujar.jsx` + `src/lib/trazados.js` | Consigna al entrar, decir la letra al terminar, un solo punto que titila con flecha en vez de números 1 a 7, botones de 80 px con ícono | `dibujarVamos.mp3`, `dibujarSeguiElCamino.mp3`, `dibujaste.mp3` |
| `Puzzle.jsx` | Consigna completa, cada letra suena al tocarla | `puzzleEscucha.mp3`, `puzzlePone.mp3`, `sonidoL/M/S/T.mp3` |
| `Decora.jsx` | Consigna por etapa ("Tocá la manga que dice…"), distractores que empiecen igual (`crearRonda`), cartel de cierre | `decoraManga.mp3` y uno por objeto de etapa |
| `Escribir.jsx` | Entra directo a la bebida (se saltea la fase `elegir`), consigna, teclas con sonido, palabras de la letra elegida (`GROUPS[letra]`, hoy `RONDAS` fijo en LULA/OLA/LALI) | `escribiCon.mp3`, `escribiTilde.mp3` |
| `Mariposas.jsx` Mundo 1 | Segunda vuelta: "tocá todos los ositos que dicen [LA]" | `ositosDicen.mp3` |
| `Iniciales.jsx` | Segunda vuelta con tres dibujos; nombra los dibujos al aparecer | — |
| `Flores.jsx` | Parlante chico en cada opción para oír sin elegir | — |
| `InicioActividad.jsx` | H muda, RR fuerte, R suave (reemplaza "Esta es la letra AR"), Z igual que S; explicación de la Q partida en dos con un toque en el medio | `HMuda.mp3`, `RRFuerte.mp3`, `RSuave.mp3`, `ZIgualS.mp3` |
| `Mariposas.jsx` Mundos 3 y 4 | La consigna dice la regla | `bloquesRSuave.mp3`, `bloquesRFuerte.mp3`, `pecesCE.mp3`, `pecesQ.mp3` |
| `PeluchesMundo2.jsx` / `PeluchesMundo3.jsx` | Entrada de 5 s a 2 s; preferir palabras de hasta 3 sílabas; audios de ratón, raqueta y rayo (se vacía `SIN_AUDIO`) | 3 palabras |

Además: "Reiniciar", "Limpiar", "Repetir consigna" y "Otra bebida" pasan a botón con ícono, y el cartel "AR" del menú de Mundo 3 se reemplaza por uno "ARA" (imagen nueva).

Cierre de los pendientes (3.84.0):

- [x] Explicación de Q dividida entre Q y QU con un botón luminoso para continuar al tocar.
- [x] Cartel ARA en Mundo 3 e Inicio, conservando la clave AR de los datos guardados.
- [x] Q comprobada con ambas voces en tablet y celular horizontal.

Revisado el 17/11/2026 a pedido: la segunda vuelta de Ositos con una sola sílaba y la lectura de los dibujos al aparecer en Peluches de Mundo 1 se sacan (fases 12 y 10).

## Fase 5 — Tramo de palabras: segunda vuelta sin modelo y cierre (3.76.0)

Mejora 1, con el patrón que ya tiene `Tren.jsx` (`isHintHidden` + `startPhaseTwo`). Las cinco actividades pasan a 3 rondas con modelo + 3 sin modelo, cartel de premio y botón a la siguiente. Como no tienen comida en `shared/comidas.js`, `otorgarPremio` devuelve un premio de estrellas y marca el progreso.

- **Barcos**: vuelta 2 con la bandeja sin texto (`barcos-tray-label`); palabras al doble de tamaño; al acertar dice la palabra y "Empieza con [LU]" (`empiezaCon.mp3`).
- **Pastel**: vuelta 2 con huecos vacíos (`pastel-slot-hint`) y una tercera ficha de más (`pastelQueParte.mp3`). Dentro de Pastel se saltean las palabras que no se cortan en sílabas (MIEL, LEE, LIO, ISLA, UAU, OIA, AIA): hoy enseñan un corte incorrecto y cuatro fichas quedan mudas. La lista de `palabras.js` no cambia.
- **Puzzle**: vuelta 2 sin letras tenues (`puzzle-slot-letter`).
- **Escribir**: vuelta 2, la palabra se oculta a los 3 s (`escribirSinMirar.mp3`).
- **Decora**: ya quedó con cierre en la fase 4; acá se suma al esquema de premio.

## Fase 6 — Peluches en Mundo 4 (3.77.0)

`PeluchesMundo4.jsx` sobre `usePeluchesJuego` con consigna "contiene" (`pulsacontiene.mp3` ya existe) y resaltado en el medio, como `PeluchesMundo3.jsx`. Se engancha en `PeluchesRuta` (`src/App.jsx`) y en `Mundo4.jsx` (hoy `disabled={index > 2}` y `readSavedPerches` limita a 3).

Unas 30 palabras con dibujo (`imagenes/peluches/MUNDO4/`) y audio (`sonido/<personaje>/peluche/MUNDO4/`): casa, cama, copa, conejo, cuna, cubo · queso, paquete, mosquito, máquina · cebra, cepillo, cine, cinta · zapato, taza, zorro, pozo, azul · chancho, leche, chocolate, ocho, chupete, lechuza. El otro dibujo de cada ronda nunca suena igual que el pedido.

## Fase 7 — Mundo 5: G, GE, GUE, J, GÜE (3.78.0)

Molde de la Q: presentar, contrastar, mezclar. Los audios de sílabas ya existen (`ga`, `ge`, `gue`, `güe`, `ja`…).

- `InicioActividad.jsx`: el repaso de la Q hoy está escrito a mano (`isMundo4Q`, `MUNDO4_Q_REVIEW_ITEMS`); se generaliza a una config `repaso` por modo para reutilizarlo en GE, GUE, GÜE.
- `Mariposas.jsx` y `Flores.jsx` con `world === 5`: consigna con la regla ("tocá donde la G suena suave") y nunca JE/JI como equivocadas de GE/GI ni al revés.
- `Tren.jsx`: la config por letra sale de las listas de sílabas y acepta fichas de grupo (GU + E, con G sola de distractor).
- `PeluchesMundo5.jsx` con "contiene": juguete, guitarra, águila, manguera, hormiguero · gato, goma, gusano · pingüino, cigüeña · gente, gigante, jirafa, jugo, ojo…
- `ElegirLetra.jsx` (nueva): dibujo y dos letras, "¿Jirafa va con J o con G?". Se reutiliza en Mundo 6 para B/V.
- `Mundo5.jsx`: navegación, personaje y posiciones guardadas como en `Mundo4.jsx` (hoy todo apagado). Clave nueva `mundo5Perches`.
- Arte nuevo: fondo y criaturas de cada actividad con tema robots (el menú ya usa `robotG.png`), fondo de Peluches.

Cierre de la fase (3.83.0):

- [x] Mariposas y Flores con fondos propios, robots, ayuda y premio; distractores sin equivalencias de sonido incorrectas.
- [x] Repaso configurable en Inicio para Q, GE, GUE y GÜE, con pedidos mezclados después de contrastar.
- [x] Posición del personaje por letra guardada en `mundo5Perches`.
- [x] Recorridos completos con ambas voces y encuadres de celular horizontal y tablet.

## Fase 8 — Mundo 6: B, V, Ñ, K, X (3.79.0)

- **B y V**: "dos letras, un sonido"; Chupetines de B solo con otras vocales de B; `ElegirLetra` para "¿Vaca va con B o con V?".
- **Ñ**: Peluches con pares casi iguales (moño/mono, uña/una, caña/cana).
- **K**: camino corto, Inicio con repaso ("suena igual que CA y QUE") y Peluches (kiwi, koala, karate, kilo).
- **X**: Peluches con "contiene" (taxi, saxo, boxeo, examen); sin xilófono.
- `Mundo6.jsx`: mismo cableado que Mundo 5 (hoy ni siquiera tiene audio). Clave nueva `mundo6Perches`.

## Ampliación — Tren en todos los mundos (3.82.0)

- **Estado actual**: Tren está implementado en los seis mundos. La configuración de Mundos 2 a 6 está en `src/lib/tren.js`; Mundo 1 conserva sus secuencias originales.
- `Tren.jsx`: reutilizar el motor con configuración por mundo y letra, sus sílabas y audios en ambas voces. Admitir fichas de varias letras cuando corresponda (por ejemplo, CH, RR, QU, GU y GÜ), respetando las reglas de cada grupo.
- Agregar el cartel de Tren al camino de cada mundo y mantener sincronizados los menús, `CAMINOS`, el progreso y el botón de siguiente actividad del premio.
- Cada mundo tendrá fondo, locomotora y vagones acordes a su temática: insectos, bloques, submarino, robots y unicornios. Integrar los fondos y trenes elegidos en la conversación de arte cuando estén disponibles.
- Conservar las dos vueltas (demostración breve con modelo y práctica sin modelo), selección por toque o arrastre, ayuda tras errores y premio final.
- Verificar cada mundo con las dos voces, sin recursos faltantes, en celular horizontal de poca altura y tablet de 1138 × 712.

Criterios verificados de la ampliación:

- [x] Tren accesible desde los caminos de los seis mundos, con progreso y cierre.
- [x] Fichas CH, LL, RR, QU, GU y GÜ; R suave con ARA/ERE/IRI/ORO/URU; YI fuera de la práctica.
- [x] Audios disponibles con nombres exactos para las 25 letras de Mundos 2 a 6, en ambas voces.
- [x] Fondos y locomotoras de Mundos 2, 3, 4 y 6; vagones propios de Mundos 2 a 6. Prompts registrados en `docs/arte/trenes-prompts.json`.
- [x] Recorridos completos de los seis mundos con ambas voces, ayuda tras errores, vuelta sin modelo y premio; comprobación automática de carga y superposición de audios.
- [x] Capturas y comprobación de encuadre en 1138 × 712, 844 × 390 y 667 × 375.
- [ ] Recuperar los recursos elegidos en la conversación de ChatGPT para compararlos con el arte nuevo integrado.

## Fase 9 — Tramo de oraciones (3.85.0)

`Oraciones.jsx` en `/oraciones`, tipo `oraciones` en `shared/actividades.js` y cartel `oracionesM1.png` en el camino de `Mundo1.jsx` (posición 13 de las 19 existentes). Se oye una oración de tres o cuatro palabras, se ordenan las fichas y el dibujo se anima al acertar. Vuelta 1 con las seis oraciones y modelo tenue; vuelta 2 con las mismas seis mezcladas y sin modelo. Se puede tocar en orden o arrastrar a los casilleros; termina con premio de estrellas y progreso por letra.

Como las palabras de las actividades no cambian, las oraciones usan su propia lista de palabras reales con las letras vistas (`src/lib/oraciones.js`). Las seis frases fueron confirmadas por el usuario el 17/11/2026: LA MULA SALTA · EL SOL SALE · LOLA TOMA TÉ · EL OSO SALE · TITO TOMA MATE · MAMI AMA A LOLA. Cada una tiene dibujo, audio de oración y audios de palabras en ambas voces.

- [x] Seis ilustraciones, fondo propio y todos los audios existentes comprobados en ambas voces.
- [x] Doce rondas, modelo solo en la primera vuelta, ayuda tras errores, animación y premio final.
- [x] Dos recorridos completos en Chromium, uno por voz, con toque, arrastre y teclado; sin recursos faltantes ni superposición de audios.
- [x] Encuadres en 1138 × 712, 844 × 390 y 667 × 375.
- [x] Entrada desde el camino de Mundo 1, bloqueo hasta abrir palabras, siguiente desde Escribir y regreso al mundo.

## Ajustes de la prueba del 17/11/2026 (fases 10 a 15)

Pedidos del usuario después de probar la 3.85.1 en dev (diez mensajes del 17/11/2026, más tres sobre las escenas de Peluches que responden la decisión 1 de `STATUS.md`). Los tres primeros sobre Peluches se van corrigiendo entre sí; vale el último: **los dibujos no se nombran solos**, se escuchan con un parlante junto a la palabra, y mientras suena la consigna los dibujos no responden.

| Pedido | Fase |
|---|---|
| Peluches: no poder tocar mientras habla; consigna primero; no nombrar los dibujos; parlante junto a la palabra | 10 |
| Peluches: 2 rondas de dos dibujos + 4 rondas de tres | 10 |
| Tilde solo cuando la suma de comidas o estrellas llega a 3, en todas las actividades y mundos | 11 |
| Actividad 2 (Ositos): una sola ronda, sin las rondas de sílaba | 12 |
| Dibujar: pasar sola a la vocal siguiente después de la felicitación | 12 |
| Flores de Mundo 2: parlante debajo de la oruga, sin tapar la sílaba | 12 |
| Monstruo de la nube (y los del selector de `/monstruo`) brilla si tiene comida para dar | 13 |
| Memotest: pareja de letra o sílaba escrita + dibujo que empieza igual | 14 |
| Peluches de Mundos 2 a 6 también con rondas de tres: soportes separados del fondo (luces en Mundo 2, hamacas sueltas en Mundos 3, 5 y 6, cofres en Mundo 4) | 15 |

Orden: primero lo que confunde al chico mientras juega (Peluches), después la marca de completado que usan todos los menús, los arreglos chicos y, al final, lo que suma contenido (Memotest). La fase 15 depende de dibujos nuevos: se hace apenas estén, aunque sea antes de las fases 11 a 14 (las versiones se asignan en el orden en que se implementan). Cada fase es un commit con su versión, `npm run build`, `git diff --check` y recorrido en el navegador con las dos voces. Las decisiones que tomé por defecto y las que faltan confirmar están en `STATUS.md`.

### Fase 10 — Peluches: consigna primero, sin nombrar y más corto (3.86.0)

Hoy, Peluches de Mundo 1 (`Iniciales.jsx`) dice los nombres de los dibujos antes de la consigna (`playInstruction(true)`) y se puede tocar mientras habla; tiene 10 rondas (cada sonido dos veces: 5 de dos dibujos y 5 de tres). Mundos 2 a 6 (`usePeluchesJuego.js`) no nombran los dibujos, pero también se tocan mientras habla y tienen dos vueltas por sonido (10 rondas en Mundo 2). En todos, la palabra debajo del dibujo ya suena al tocarla, pero nada indica que se puede.

- `Iniciales.jsx`: se saca la lectura de los nombres al aparecer (revierte ese punto de la fase 4). La consigna queda: sonido + "Pulsá el dibujo…" + sonido (+ explicación del parlante solo en la primera ronda).
- Dibujos bloqueados mientras suena la consigna, en `Iniciales.jsx` y en `usePeluchesJuego.js` (todos los mundos): tocar un dibujo o un parlante no hace nada, no suena ni suma error. Se habilitan al terminar la secuencia (`secuencia.reproducir(lista, alTerminar)`); repetir la consigna tocando al personaje vuelve a bloquear hasta que termina. La ayuda tras un error no bloquea. Mientras está bloqueado, los dibujos se ven apenas atenuados y se encienden al terminar la consigna, para que se note cuándo se puede tocar.
- Parlante junto a la palabra de cada dibujo (mismo ícono que `.opcion-parlante` de Flores, dentro del botón de la palabra para que el área de toque sea grande): dice la palabra sin elegir el dibujo. En Mundo 1 (`initials-name`), Mundo 2 (`pm2-name`) y `PeluchesPlataformas` (Mundos 3 a 6).
- Audio nuevo `tocaParlante.mp3` ("Si no sabés qué dibujo es, tocá el parlante."), dos voces, en lugar de `apetaeltexto.mp3` en la primera ronda.
- Mundo 1, `crearRondas`: 6 rondas, las 2 primeras con dos dibujos y las 4 siguientes con tres. Cada sonido de la letra se pide al menos una vez; el sexto pedido repite uno, nunca dos veces seguidas. Los distractores siguen sin repetirse dentro de la partida.
- Mundos 2 a 6: tope de 6 rondas con dos dibujos, como paso intermedio para que no sea tan larga; las rondas de tres llegan con las escenas nuevas de la fase 15.
- El premio no cambia (3 sin errores, 2 con 1 o 2, 1 con 3 o más).

Criterios:

- [x] Mundo 1, vocales y una consonante: ningún dibujo se nombra solo; la consigna arranca al aparecer la ronda.
- [x] Tocar un dibujo o un parlante durante la consigna no hace nada; al terminar, el primer toque responde.
- [x] El parlante dice la palabra sin contar como respuesta ni como error, en los seis mundos.
- [x] Mundo 1: 6 rondas (2 de dos dibujos + 4 de tres) y premio; cada sonido pedido al menos una vez.
- [x] Mundos 2 a 6: como máximo 6 rondas (de dos dibujos hasta la fase 15) y premio.
- [x] `tocaParlante.mp3` en `supernena/` y `supernene/`; recorridos con las dos voces sin recursos faltantes.
- [x] En 1138 × 712, 844 × 390 y 667 × 375 el parlante no tapa la palabra ni el dibujo.

### Fase 11 — Tilde solo con las 3 comidas o estrellas (3.87.0)

Hoy la tilde (`.camino-hecho`) aparece al terminar la actividad una vez: `progreso.js` guarda el mejor puntaje y los menús preguntan `puntajeDe(...) > 0`; en Mundo 1 alcanza también con una comida ganada. Pedido: la tilde aparece recién cuando la suma de lo obtenido llega a 3, en todas las actividades y mundos, aunque la comida esté sin dar al monstruo. Se puede seguir jugando igual.

- `src/lib/progreso.js`: `marcarCompletada(letra, actividad, puntaje)` suma en lugar de guardar el máximo, con tope 3. Misma clave (`actividadesCompletadas`) y mismo formato `{ letra: { actividad: n } }`: lo guardado hasta hoy se toma como suma inicial (quien tenía 3 conserva la tilde; quien tenía 1 o 2 la recupera al juntar lo que falta). No rompe datos: MINOR.
- Nueva `actividadCompleta(progreso, letra, clave)` (`n >= 3`). En Mundo 1 la actividad con comida también está completa si `cantidadComida(...).ganadas >= necesarias` (las comidas se sincronizan con la API, así la tilde se ve en otro dispositivo).
- Menús de Mundos 1 a 6: tilde, brillo de la que sigue (`.camino-siguiente-brillo`) y letra sugerida (`.menu-letra-siguiente`) usan `actividadCompleta` en lugar de `puntajeDe > 0` (`isActivityDone`/`isDone` de `Mundo1.jsx` a `Mundo6.jsx`).
- Actividades sin comida (palabras, oraciones, Mundos 2 a 6): suman las estrellas de cada partida (`otorgarPremio` → `marcarCompletada`, e `InicioActividad` en Mundos 2 a 4).
- El cartel de premio no cambia: muestra lo ganado en esa partida.

Criterios:

- [x] Mundo 1: Inicio con 1 o 2 errores (2 cerezas) → sin tilde; otra partida con 3 errores (1 cereza) → tilde, aunque las cerezas no se hayan dado al monstruo.
- [x] Mundo 1: una partida sin errores (3) → tilde de una vez.
- [x] Mundos 2 y 5 (estrellas): mismo recorrido 2 + 1 → tilde recién en la segunda partida.
- [x] La actividad completa se puede volver a jugar; la suma no pasa de 3.
- [x] Datos viejos: una actividad guardada con 3 conserva la tilde; con 1 o 2 la pierde hasta completar.
- [x] El brillo de la que sigue y la letra sugerida avanzan recién con la tilde.
- [x] `CLAUDE.md` actualizado (progreso: suma con tope 3, no mejor puntaje).

### Fase 12 — Ositos, Dibujar y parlantes de Flores (3.87.1)

Tres arreglos chicos, verificables por separado.

**Ositos (actividad 2) sin rondas de sílaba.** La fase 4 agregó a Ositos de Mundo 1, en las consonantes, dos rondas de una sola sílaba ("tocá todos los ositos que dicen LA"). Se sacan (`VUELTA2_RONDAS`, `silabasVuelta2` y `conVuelta2` en `Mariposas.jsx`): vuelve a una sola ronda, "tocá los ositos de la L", como antes. Las vocales siguen pidiendo cada vocal, como antes de la fase 4. Mundos 2 a 5 ya tienen una sola ronda (Mariposas, Bloques, Peces y Robots voladores) y Mundo 6 no tiene esta actividad.

- [x] L, M, S y T: una sola ronda y premio; `ositosDicen.mp3` no suena más.
- [x] Vocales y Mundos 2 a 5 sin cambios.

**Dibujar pasa sola a la vocal siguiente.** Hoy solo la A pasa a la E (escrito a mano en `completeSegment`); E, I, O y U se reinician en la misma letra. Al terminar el audio de felicitación ("¡Muy bien! Dibujaste la letra:" + letra) pasa a la siguiente de `letterOptions`: A → E → I → O → U. Después de la U, si falta alguna vocal va a la primera que falte; con las cinco queda el premio. Al pasar dice "Ahora dibujá la letra:" + la letra (audio nuevo `dibujarAhora.mp3`, dos voces). Las consonantes no cambian. Los cierres de cada letra (`celebrar(...)` de A/O/U, E, I y curvas) pasan a una sola función que avanza.

- [x] A → E → I → O → U sin tocar el selector, cada paso después de la felicitación y con "Ahora dibujá la letra:".
- [x] Elegir una vocal en el selector y terminarla sigue con la próxima; con las cinco, premio.
- [x] L, M, S y T sin cambios. `dibujarAhora.mp3` en las dos voces.

**Flores de Mundo 2: parlante debajo de la oruga.** El parlante (`.opcion-parlante` en `global.css`, abajo a la izquierda de la opción) tapa la sílaba de la oruga. En `FloresMundo2.css`, bajo `.page-flores.world-mundo2`, el parlante va centrado debajo de la oruga, fuera de la etiqueta. Revisar que en Mundos 1, 3 y 4 tampoco tape la etiqueta.

- [x] Mundo 2: la sílaba se lee entera en 1138 × 712, 844 × 390 y 667 × 375; el parlante se toca sin elegir la oruga.
- [x] Mundos 1, 3 y 4: la etiqueta tampoco queda tapada.

### Fase 13 — El monstruo brilla cuando tiene comida para dar (3.88.0)

Comida para dar: alguna comida de la letra con `ganadas > dadas` (`cantidadComida`, `src/lib/recompensas.js`).

- `Mundo1.jsx`: el monstruo de la nube (`.mundo1-monster-button`) brilla con un halo que late cuando el monstruo de la letra elegida tiene comida para dar; se apaga cuando no queda.
- `src/pages/Monstruo.jsx`: en el selector de monstruos (`.monstruo-selector__boton`) brillan los de otras letras que tengan comida para dar.
- Halo con `filter: drop-shadow` animado (compatible con chrome87 y safari14), en `Mundo1.css` y `Monstruo.css`. Se actualiza solo al ganar o dar comida (`subscribeRecompensas`).

Criterios:

- [x] Ganar comida en una actividad y volver al mundo → el monstruo de la nube brilla; darle todo → deja de brillar.
- [x] Con comida en otra letra, ese monstruo brilla en el selector de `/monstruo`; al darle todo, se apaga.
- [x] Sin comida guardada no brilla nada. Encuadres de celular y tablet.

### Fase 14 — Memotest de letra y dibujo (3.89.0)

Memotest solo existe en Mundo 1. Hoy cada pareja son dos cartas iguales (A con A). Pasa a una carta con la letra o sílaba escrita y otra con un dibujo de Peluches que empieza con ese sonido (A con ÁRBOL, E con ESCALERA, I con ISLA, LA con LANA, MO con MONO…).

- `BANCO` y `wordAudioFile` salen de `Iniciales.jsx` a `src/lib/peluchesBanco.js` (los usan Peluches de Mundo 1 y Memotest).
- `Memotest.jsx`, `buildDeck`: por cada sonido de la letra (A: las vocales; L, M, S y T: sus sílabas) una carta escrita y una carta con un dibujo del banco que empiece con ese sonido, elegido al azar en cada partida. La pareja se reconoce por el sonido, no por el contenido de la carta.
- Al dar vuelta: la carta escrita dice su sonido (como hoy) y la del dibujo dice la palabra (`sonido/<personaje>/peluche/`). El dibujo va sin texto (`peluches/<nombre>.png`, con respaldo `.webp`) y con su tamaño en `Memotest.css` para tablet y celular.
- Consigna nueva `memotestDibujos.mp3` ("Buscá la carta escrita y el dibujo que empieza igual. Tocá una y después otra."), dos voces, en lugar de `memotest.mp3`.
- No hay dibujo de ABEJA: la A usa ANILLO, ÁRBOL, AUTO o AVIÓN (ABEJA pediría dibujo y audio nuevos).
- Premio y tiempos sin cambios (1,5 s para ver dos cartas distintas; estrellas según movimientos).

Criterios:

- [x] Vocales y las cuatro consonantes: 5 parejas de carta escrita + dibujo; cada dibujo empieza con el sonido de su pareja.
- [x] Dos cartas escritas o dos dibujos nunca forman pareja.
- [x] Cada carta suena al darla vuelta; la consigna nueva suena al entrar y al tocar al personaje.
- [x] Peluches de Mundo 1 sigue igual con el banco compartido.
- [x] Las dos voces sin recursos faltantes; encuadres en 1138 × 712, 844 × 390 y 667 × 375.

### Fase 15 — Peluches de Mundos 2 a 6 con tres dibujos: soportes separados del fondo (3.90.0 y 3.91.0)

Decisión del 17/11/2026: Mundos 2 a 6 también tienen 2 rondas de dos dibujos y 4 de tres, como Mundo 1. Hoy no se puede sumar un tercer dibujo en Mundos 3 a 6 porque las dos hamacas donde se apoyan son parte de la imagen de fondo (`imagenes/peluches/MUNDO3` a `MUNDO6/fondo.jpg`, todas con la misma composición: viga arriba con el cartel de la consigna y dos hamacas colgando). El soporte pasa a ser un elemento aparte que se repite dos o tres veces según la ronda; al no ser parte del fondo, también se puede animar. Hasta que esta fase esté, Mundos 2 a 6 quedan con 6 rondas de dos dibujos (fase 10).

**Mundo 2 (luciérnagas, sin arte nuevo).** El fondo ya no tiene soportes: cada luciérnaga, posada en su brizna, proyecta un haz de luz hecho con CSS (`PeluchesMundo2.css`) con un dibujo adentro. En las rondas de tres, las dos luciérnagas giran la luz hacia el centro y los haces se juntan en una zona iluminada más grande donde aparecen los tres dibujos en fila, cada uno con su palabra y su parlante. En las rondas de dos queda como hoy. Al pasar de la ronda 2 a la 3 las luces se mueven con una transición, no de golpe.

**Mundos 3, 5 y 6 (hamacas).**

- Arte: el fondo de cada mundo sin las hamacas (queda la viga con el cartel de la consigna) y una hamaca suelta en PNG transparente (enganche con polea, sogas o cadenas y asiento con la placa del nombre), con el estilo de cada mundo: sogas violetas y asiento de bloques (Mundo 3), cadenas y asiento robot (Mundo 5), cintas arcoíris y nube dorada (Mundo 6). Se hacen editando el fondo actual y recortando su hamaca, para no cambiar el estilo. Prompts en `docs/arte/peluches-soportes-prompts.json`.
- `PeluchesPlataformas` (`PeluchesMundo3.jsx`): una hamaca por opción, colgada de la viga, que lleva adentro el dibujo y la placa con la palabra y el parlante, así se mueven juntos. Posiciones para dos y para tres hamacas en `PeluchesMundo3.css`, respetando el lugar del personaje a la izquierda.
- Al aparecer, cada hamaca baja y se balancea con un vaivén que se va frenando (giro desde el enganche). En la ronda 3 baja una tercera hamaca y las otras se reacomodan. El acierto, el error (vibrar) y el halo de la pista se ven sobre la hamaca.

**Mundo 4 (cofres).** Para Mundo 4 se había pedido que el soporte fueran cofres, pero quedó con la misma hamaca (de nácar) que los otros mundos. Pasa a fondo marino sin viga ni hamacas, cartel de la consigna como elemento aparte y dos o tres cofres abiertos apoyados en la arena: el dibujo sale del cofre y el nombre va en una placa del cofre (a confirmar en `STATUS.md`). Arte: fondo sin viga ni hamacas, cofre y cartel en PNG transparente.

**Rondas** (`crearRondas` de `PeluchesMundo2.jsx` y `PeluchesMundo3.jsx`): 2 de dos dibujos y 4 de tres; cada sonido se pide al menos una vez. Los dos dibujos equivocados de una ronda son de otro sonido del mismo grupo (nunca uno que suene igual) y distintos entre sí. En la Ñ, MOÑO sigue saliendo contra MONO.

Criterios:

- [x] Fondos sin soportes y soportes sueltos de Mundos 3 a 6 revisados antes de integrarlos; prompts registrados (ChatGPT, `docs/arte/peluches-soportes-prompts.json`).
- [x] Mundos 2 a 6: rondas 1 y 2 con dos dibujos, 3 a 6 con tres; premio al final. (Mundo 2 en 3.90.0; Mundos 3 a 6 en 3.91.0.)
- [x] Mundo 2: en las rondas de tres las luces se juntan en el centro y los tres dibujos se ven enteros dentro de la luz.
- [x] Mundos 3, 5 y 6: dos o tres hamacas según la ronda, con vaivén al aparecer; dibujo, palabra y parlante se mueven con la hamaca y se pueden tocar mientras se balancea.
- [x] Mundo 4: cofres en la arena; el dibujo sale de adentro del cofre (la pared de adelante lo tapa) y la palabra va en el cartel del cofre. El cartel de la consigna quedó pintado en el fondo, colgado de algas, en el mismo lugar que antes.
- [ ] Ningún grupo se queda sin distractores y ninguna ronda repite un dibujo.
- [ ] Las dos voces sin recursos faltantes; encuadres en 1138 × 712, 844 × 390 y 667 × 375 con tres soportes, sin tapar al personaje.

## Monstruos en Mundos 2 a 5 (fases 16 a 20)

Pedido del 18/11/2026: cada letra de los Mundos 2 a 5 tiene su monstruo, con su forma inicial y su primera evolución tomadas de la lámina `descargas/Superletras_inicial_y_primera_evolucion_transparente.png`. Los monstruos de Mundo 1 (A, L, M, S, T) y sus evoluciones ya están y no se tocan. El sistema es el mismo que en Mundo 1: cada actividad da la misma comida y en la misma cantidad, cada monstruo pide 3 de cada una (18 desde que no está Memotest) y, al terminar de comer, evoluciona con la nube. Las comidas de cada letra no se mezclan con las de otra (P, C fuerte y C suave son monstruos distintos). Mundo 6 queda como está, con estrellas.

| Mundo | Letras (clave del menú → monstruo de la lámina) |
|---|---|
| 2 · Insectos | p, n, d, f, h |
| 3 · Bloques | r, rr, ar, y, ll |
| 4 · Sirenas | ce, c, z, q, ch |
| 5 · Robots | g, ge, gu (GUE), gü (GÜE), j |

Decisiones del 18/11/2026: los monstruos van hasta Mundo 5; la pantalla de alimentar lleva un fondo propio por mundo. Más tarde, el mismo día: **Memotest se saca de todos los mundos** (página, botón, cartel y comida: los caramelos), así el tramo de sílabas tiene 6 actividades (Inicio, Mariposas, Flores, Peluches, Tren y Dibujar) y cada monstruo pide 18 comidas; **Dibujar se agrega a los seis mundos** y pasa a trazar sílabas (fase 19); "¿J o G?" y "¿B o V?" quedan en el camino pero dan estrellas.

Orden: primero el sistema (con la imagen de la lámina quieta en los seis cuadros), después el arte. Hasta la fase 19 los monstruos de Mundos 2 a 5 no pueden llegar a 18 (falta Dibujar).

### Fase 16 — Monstruos y comida en Mundos 2 a 5 (3.93.0)

- `shared/comidas.js`: `LETRAS_POR_MUNDO` (1 a 5) y `LETRAS` con todas; `MUNDO_DE_LETRA`. La API acepta las claves de varias letras (`rr`, `gü`). (En 3.93.0 "¿J o G?" daba galletitas; desde la fase 20 da estrellas.)
- `otorgarPremio`: las letras de Mundos 2 a 5 reciben comida como Mundo 1.
- Imágenes: los 40 recortes de la lámina en `imagenes/monstruos/` (`monstruo-<letra>-1.webp` y `monstruo-<letra>-nivel2-1.webp`; `gü` se guarda como `gdieresis`). Mientras no estén los cuadros de comer, el monstruo usa el cuadro 1 en todos los estados.
- `/monstruo` sirve a los cinco mundos: letras, título, fondo y letra guardada del mundo de `state.world`; el selector muestra los monstruos de ese mundo con su contador.
- Menús de Mundos 2 a 5: monstruo de la letra elegida arriba (`MonstruoDelMenu`, con la nube de Mundo 1), con brillo y contador; lleva a `/monstruo`. En Mundos 2 a 4 va a la derecha de la columna de letras (al centro la tapaba); en Mundo 5, al centro.
- Inicio de Mundos 2 a 5 da cerezas y muestra el cartel de premio (antes solo anotaba el progreso). Fondo provisorio de `/monstruo` en Mundos 2 a 5: el del menú de cada mundo.

Criterios:

- [x] Ganar una actividad en una letra de Mundos 2 a 5 da la comida de esa actividad y aparece en su monstruo, no en el de otra letra (P/flores → chocolate, GÜ/elegir → galletitas, CH/tren → cucuruchos; B de Mundo 6 → estrellas).
- [x] La API guarda y devuelve las comidas de `rr`, `p`, `gü` y rechaza `b`; app y API comparten el tope (probado con una base temporal).
- [x] `/monstruo` de cada mundo: selector con los otros cuatro, contador, darle comida y evolucionar con la nube (D de Mundo 2).
- [x] Mundo 1 sigue igual (monstruos, selector y contador).

### Fase 17 — Cuadros de comer de los 40 monstruos (ChatGPT)

Hecha en 4.1.0 a 4.1.3 (Mundo 2 y R/RR con la fase 19; Mundo 3 en 4.1.1, Mundo 4 en 4.1.2 y Mundo 5 en 4.1.3). Hojas originales en `descargas/monstruos/hojas/`, cortadas con `scripts/cortar-hoja-monstruo.py`; la boca de cada monstruo y nivel está en `BOCAS` de `src/components/Monstruo.jsx`, revisada sobre el cuadro de boca abierta. Con todos los cuadros hechos se sacó `CON_CUADROS`.

- Por monstruo y nivel, una hoja de 6 cuadros como los de Mundo 1 (normal, boca abierta, masticando, se relame, feliz, sexto cuadro), generada con ChatGPT a partir del recorte de la lámina y de los cuadros de un monstruo de Mundo 1 como guía. Se corta en 6 archivos `.webp`.
- Prompts en `docs/arte/monstruos-prompts.json`. Se integra de a un mundo.

Criterios:

- [x] Cada monstruo se reconoce igual al de la lámina en los 6 cuadros, sin cambiar de tamaño ni de lugar entre cuadros.
- [x] La comida vuela hasta la boca de cada monstruo.

### Fase 18 — Fondo de la pantalla de alimentar por mundo (ChatGPT)

- Cuatro fondos (insectos, bloques, mar, robots) con la composición del fondo actual de `/monstruo`.

Hecha en 4.1.4: `fondoMonstruoM2.jpg` a `fondoMonstruoM5.jpg` (loma despejada en el centro para el monstruo, decoración del mundo a los costados; en Mundo 4, arena bajo el agua), en `.monstruo-mundoN` de `src/pages/Monstruo.css`. Prompts en `docs/arte/monstruo-fondos-prompts.json`.

### Fase 19 — Dibujar con sílabas en los seis mundos

Pedido del 18/11/2026: Dibujar en todos los mundos con el mismo sistema de trazado de Mundo 1, y las consonantes con su vocal: en lugar de trazar la L sola, se trazan LA, LE, LI, LO y LU, como hoy las vocales: lista a la izquierda, al terminar una pasa a la siguiente y la nombra, y al trazarlas todas da 3 galletitas (estrellas en Mundo 6).

Hecho en 4.1.0:

- Sílabas de cada letra (`src/lib/dibujar.js`): las mismas que usan Flores y Mariposas: C → CA, CO, CU; CE → CE, CI; Q → QUE, QUI; G → GA, GO, GU; GE → GE, GI; GU → GUE, GUI; GÜ → GÜE, GÜI; AR → ARA, ERE, IRI, ORO, URU; Mundo 6: BA…BU, VA…VU, ÑA…ÑU, KA…KU, XA…XU. En Mundo 1 la A sigue siendo las vocales (con la i minúscula); L, M, S y T pasan a sílabas.
- `src/lib/trazados.js` define cada letra como una lista de trazos (recorridos por puntos o puntos para tocar, como la i y la Ü); una sílaba pone sus letras una al lado de la otra y el tablero toma el ancho de la más ancha de la lista. Todos los trazos se validan igual (el dedo sigue el camino sin volver atrás, como ya hacían U, S y M).
- La guía no se pide a ChatGPT ni se guarda en archivos: `GuiaTrazado.jsx` la dibuja con esos mismos trazos (contorno, línea punteada y flechas). Se borraron `trazado<Letra>.svg/.jpg` y `scripts/generar-trazados.mjs`.
- En las sílabas la I es mayúscula (un palo); al terminar una se dice su nombre (acierto + sílaba) y se pasa sola a la que falta; las hechas quedan en verde. Con todas, 3 galletitas (estrellas en Mundo 6); si se va antes, 2 con 3 o más hechas y 1 con alguna.
- Se agregó al final del camino de Mundos 2 a 6 y de `CAMINOS`; fondo propio por mundo (`fondoDibujarM2..M6.jpg`, ChatGPT).

### Fase 20 — Sacar Memotest de todos los mundos

- Se borran la página (`Memotest.jsx` y su CSS), la ruta `/memotest` (cae en la redirección general a `/`), el cartel `MEMOTESTbtn.png` de los menús, sus audios (`memotest.mp3`, `memotestDibujos.mp3`, `PLmemo.mp3`) y la comida que daba (caramelos) en `shared/comidas.js`, que usan app y API.
- Mundo 1: el camino pierde el lugar 7 (antes del cartel de PALABRAS), así el tramo de palabras sigue arrancando después del cartel.
- Los caramelos guardados (localStorage y API) quedan en la base pero ya no cuentan. Un monstruo al que solo le faltaban caramelos queda evolucionado.
- Cambio incompatible (se saca una ruta y cambia el índice del camino de Mundo 1 donde se guarda la posición del personaje): versión mayor.

## Fase 21 — Carga inicial rápida (4.1.6)

Pedido del 18/11/2026: la página tarda demasiado en cargar al abrirla. Medido en dev: la portada pedía unos 7,2 MB.

- `Escribir.jsx` precargaba sus imágenes al cargar el código (máquina de helados y vasos, unos 5 MB) y, como todo iba en un solo archivo, se bajaban en la portada. Ahora se piden al abrir Escribir.
- Cada pantalla, salvo la portada, va en un archivo aparte (`src/lib/pantallas.js`, `React.lazy`): el JS inicial pasa de 540 KB (164 KB comprimido) a 277 KB (88 KB). Cuando la portada ya se ve, el resto se baja de a uno en segundo plano, así entrar después a cualquier pantalla sigue siendo inmediato. Si el archivo de una pantalla ya no existe (deploy con la app abierta), la página se recarga una vez.
- `PageLoader` espera a que llegue el código de la pantalla (marca `data-ruta-cargando` del `Suspense` de `App.jsx`) y, si tarda más de 250 ms, muestra el cartel de carga.
- Un solo CSS para todo (`cssCodeSplit: false`), así el orden entre los estilos de las pantallas no cambia. `global.css` y los componentes de `main.jsx` ahora quedan antes que el CSS de las pantallas: se revisaron los choques y solo el aro amarillo del selector de `/monstruo` dependía del orden; ahora gana por especificidad.
- La fuente de Google del cartel de premio se pide desde `index.html` sin frenar el primer dibujo (antes era un `@import` dentro del CSS).

Resultado en el build de producción: la portada baja unos 1,6 MB en lugar de 7,2 MB.

## Mundo 6: Mariposas, Flores y monstruos (4.4.0)

Pedido del 18/11/2026: crear Mariposas y Flores para Mundo 6 y habilitar el sistema de premios como en los otros mundos, con los monstruos y sus evoluciones de la lámina de `descargas/`.

- Mariposas y Flores reutilizan la pantalla de los robots de Mundo 5, generalizada como `CriaturasSilabas.jsx`: mariposas y flores unicornio, consignas con los audios que ya existen (`suenaB.mp3`…, `Pulsa.mp3`, `Pulsasilaba.mp3`) y distractores sin mezclar B con V.
- Camino: Inicio, Mariposas, Flores, Peluches, "¿B o V?", Tren y Dibujar (Mundo 6 no guarda la posición del personaje, así que el orden nuevo no rompe datos).
- Premios: `LETRAS_POR_MUNDO[6]` con B, V, Ñ, K y X; cada actividad da su comida y "¿B o V?" estrellas. Cuadros de comer de los diez unicornios y fondo propio de `/monstruo`.

## Laboratorio de Luces en los seis mundos (4.6.0)

**Hecho en la 4.6.0.** Pedido del 18/11/2026: una pantalla opcional donde se gastan las estrellas del mundo en efectos de luz sobre un paisaje. Pedido completo en `descargas/prompt-para-claude.md`; arte y mapa en `descargas/laboratorio-de-luces.zip` (`descargas/` no se versiona: al implementar, las imágenes pasan a `public/assets/imagenes/laboratorio/`). No es una app aparte: usa el stack y las convenciones del proyecto.

### Lo que ya hay y cómo se adapta

- **Mundos**: los IDs reales son los números 1 a 6 (`state.world`, `LETRAS_POR_MUNDO`). Laboratorio N = Mundo N: 1 Dulces, 2 Insectos, 3 Bloques, 4 Sirenas, 5 Robots, 6 Unicornios.
- **Saldo**: las estrellas se guardan **por letra** (`letras[letra].estrellas = { ganadas, dadas }`, `CLAVE_ESTRELLAS`, en localStorage y en la tabla `comidas` de la API); `dadas` hoy vale siempre 0. El saldo del laboratorio es el **del mundo**: suma de `ganadas − dadas` de las letras de `LETRAS_POR_MUNDO[mundo]` (función nueva `estrellasDelMundo(letras, mundo)` en `src/lib/recompensas.js`). Gastar usa ese `dadas` (= estrellas gastadas): no hay clave ni formato nuevo, no rompe datos guardados → versión menor. No se toca cómo se ganan estrellas (`repartirPremio`), ni las comidas, ni la evolución, ni el camino.
- **Contador**: hoy `ContadorEstrellas` muestra las estrellas de la letra, se oculta con 0 y va dentro del botón del monstruo (`Mundo1.jsx` y `MonstruoDelMenu.jsx`, Mundos 2 a 6). Cambia a: muestra el saldo del mundo (el mismo en todas sus letras), se ve también con 0 y es un **botón propio** al lado del monstruo (no un botón dentro de otro), con nombre accesible "Laboratorio de luces: N estrellas". Tocar el monstruo sigue llevando a `/monstruo`.
- **Destino desacoplado**: el contador llama `abrirLaboratorio(navigate, mundo)` (`src/lib/laboratorio.js`), que navega a `/laboratorio` con `state: { world: mundo }`. Mover la entrada después es cambiar quién llama a esa función.
- **Vuelta**: los menús ya recuperan solos la letra (`mundoNMenuOption`) y la posición del personaje (`mundoNPerches`) desde localStorage, como al volver de `/monstruo`. "Volver" navega a `/mundoN`. Comprobar en Mundo 1 que el scroll vuelve al personaje.
- **Opciones de la app**: no hay ajustes de sonido ni de movimiento reducido; se respeta `prefers-reduced-motion` (menos partículas, transiciones más suaves). No hay audios nuevos en esta versión.

### Gastar estrellas (app y API)

- Reparto compartido en `shared/comidas.js`: `repartirGasto(saldosPorLetra, cantidad)` descuenta en el orden de `LETRAS_POR_MUNDO[mundo]`, de cada letra hasta su saldo; devuelve `null` si el total no alcanza. Lo usan la app y la API, así las dos cuentas coinciden.
- `gastarEstrellas(mundo, cantidad, efecto)` en `src/lib/recompensas.js`: valida con el estado actual (síncrono), aplica el reparto sumando `dadas` a la clave `estrellas` de cada letra, encola el evento `{ id, tipo: "gastar", mundo, cantidad, efecto, codigo }` y devuelve `true`; sin saldo devuelve `false` sin tocar nada.
- `server/index.js`: acepta `tipo: "gastar"` en la misma transacción idempotente por `id` que `premio` y `dar`, valida saldo del mundo y aplica el mismo reparto; si no alcanza, lo ignora sin dejar saldos negativos. Revisar si `eventos.letra` admite nulo (si no, guardar una fila por letra tocada o la primera letra del mundo) y que `sincronizar` no pise lo gastado localmente con una copia vieja de la API.
- **Una sola cobranza por toque**, en este orden: candado síncrono en el componente (`useRef`, se libera en el próximo cuadro) → ¿el efecto tiene lugar (`puedeAgregar`) y sus imágenes ya cargaron? → `gastarEstrellas` → disparar el efecto. Si no hay lugar o recursos, no se cobra; si falta saldo, aparece junto al botón "Te faltan N ⭐" (con `aria-live`), sin navegar ni tocar el paisaje.

### Configuración en un solo lugar (`src/lib/laboratorio.js`)

- `PRECIOS`: flores 2, estrellas 2, burbujas 2, aurora 3, constelacion 3, fuegos 5.
- `LIMITES` (iniciales, ajustables): 2 colonias por toque y pocas ramas por colonia, 15 flores abiertas en escena, estrellas fugaces 3 a 5 por toque, tandas y tope de burbujas vivas, cintas de aurora 2 a 3, fuegos 2 a 3 por toque, y un tope de instancias simultáneas por efecto. Con `prefers-reduced-motion`, la mitad de partículas.
- El mapa de `mapa-activos.json`, pasado a constantes:
  - Escenario 16:9, lienzo lógico 1920×1080. Cielo: x 0,25–0,95, y 0,09–0,55. Zona de vides: x 0,43–0,92, y 0,73–0,95 (fracciones del escenario).
  - Máquina: caja de ancho 0,46 del escenario, izquierda −0,032, abajo 0,025; coordenadas del arte en la rejilla original **1381×1139** (convertir con `x/1381`, `y/1139` dentro de la caja, no con los píxeles del PNG optimizado). Diámetro visual de botón 111.
  - Centros de botones: flores [329, 773], estrellas [461, 774], burbujas [593, 770], aurora [725, 765], constelacion [857, 757], fuegos [989, 746].
  - Instrumentos: globoBurbuja centro [669, 453] radios de máscara [137, 107]; globoAurora [789, 211] radios [86, 57]; lenteConstelacion [974, 392] radios [61, 59]; prisma [550, 221]; bandejaSemillas [878, 642]; anteojo [1124, 511]; bocaTubo [1216, 744]; tramo del tubo de salida `M 1105 646 C 1161 640 1210 656 1216 724`.
  - Pivotes de las piezas botánicas (fracción del PNG): semilla [0,5, 0,89], brote [0,52, 0,92], pimpollo [0,50, 0,96], flor rosa [0,51, 0,97], dorada [0,51, 0,97], violeta [0,49, 0,98].

### Pantalla `/laboratorio` (`src/pages/Laboratorio.jsx` + `Laboratorio.css`)

- Un solo componente para los seis laboratorios, cargado con `pantalla(() => import(...))` en `App.jsx`; lee `state.world` (sin mundo válido, redirige a `/mundos`) y se monta con `key={mundo}` para que cambiar de mundo arranque limpio. Seis instancias, cada una con el saldo de su mundo; los seis se ven y funcionan igual.
- **Imágenes de ejecución** (únicas): `fondos/comun.webp`, `maquina.png`, `botones/{flores,estrellas,burbujas,aurora,constelacion,fuegos}.png`, `flores/{semilla,brote,pimpollo,flor-rosa,flor-dorada,flor-violeta}.png`. `referencia-visual.webp` (muestra Flores activado) es solo para comparar: no va al juego. `variantes-futuras/` no se copia, importa ni precarga. `maquina.png` pesa 1,3 MB: probar pasarla a webp con transparencia. Se precargan al montar la pantalla (nunca a nivel de módulo); `PageLoader` cubre las `<img>`.
- **Escenario**: caja 1920×1080 escalada entera con `transform: scale()` para entrar en la pantalla (sin recortes distintos para fondo y efectos). Capas: fondo → canvas del paisaje (cielo, plantas, partículas) → máquina → canvas de luces dentro de los instrumentos (recortadas con las elipses; algunas burbujas pueden pasar sobre el borde de la máquina, nunca sobre los controles) → botones → saldo y "Volver". Cielo y zona de crecimiento quedan despejados.
- **Botones**: seis `<button>` reales sobre la madera (centros del mapa), con la imagen, nombre accesible ("Flores, 2 estrellas") y precio visible al lado o al enfocarlo. Encendido con brillo/escala por CSS, sin otro PNG. Si la fila queda chica (celular), un botón abre los mismos seis en una cuadrícula táctil compacta (mismos handlers, sin duplicar cargos).
- **Motor**: un solo ciclo de render con `runtime.requestAnimationFrame` (`usePageRuntime`); un registro de instancias por efecto, cada una con su estado y tiempos (`activas.flores`, `activas.burbujas`…), nunca un único `activeEffect`. Cada efecto se suma a lo que hay; los breves terminan solos; las plantas quedan con un vaivén sutil hasta salir. Pausa con `document.hidden`; al desmontar se cancela todo y se liberan los canvas. Nada del estado visual se guarda.
- Solo Canvas 2D y SVG (o Canvas) por código: sin PNG de auroras, burbujas, estelas ni brillos, sin sprites, GIF, video ni librerías nuevas, sin pedidos de red por toque.

### Los seis efectos

1. **Flores (2)**: se ilumina la bandeja de semillas y un pulso cálido recorre el tubo de salida (la curva anotada); una ola suave cruza el césped y deja semillas luminosas en lugares libres de la zona de vides. De cada una crece una **enredadera por código**: tallo de segmentos Bézier revelado de la raíz a la punta a velocidad progresiva, más fino en el extremo; sube, se curva a un lado, vuelve al otro y a veces se enrolla como zarcillo. Ramas laterales que salen de nudos ya alcanzados; puntas que buscan arriba o el espacio libre; una rama larga cede apenas o se hamaca. En nudos y puntas aparecen brotes y pimpollos (PNG anclados por la base a la curva, inclinados según la tangente, tamaños, giros y tiempos mezclados) y algunos se abren en flor rosa, dorada o violeta (brote → pimpollo → flor por escala y transición corta; algunas ramitas se quedan en brote). La semilla desaparece cuando sale el tallo. Resultado: plantas a distintas alturas y direcciones, no una pared verde, sin invadir el cielo ni la máquina. Un toque nuevo agrega en espacios libres sin borrar las anteriores.
2. **Estrellas fugaces (2)**: destello breve del anteojo o el prisma; 3 a 5 estrellas aparecen en puntos distintos del cielo y caen en diagonal con pequeños intervalos; punto luminoso con estela que se afina con degradados.
3. **Burbujas arcoíris (2)**: burbujitas dentro del globo central (recortadas a su elipse) que suben, crecen y se juntan; después varias tandas de burbujas iridiscentes desde la máquina y unos pocos puntos del paisaje que **llenan la pantalla** unos segundos: suben lento, se desvían y revientan en aros suaves. Muchas chicas y pocas grandes, con gradientes y contornos por código, para que se siga viendo lo de atrás.
4. **Aurora (3)**: un reflejo ondula dentro del globo de aurora o el prisma; luego arriba se despliegan 2 o 3 cintas translúcidas menta, celeste y lila (bandas con degradado, ondulación lenta, fundido). Dura un poco más que las estrellas fugaces y las otras luces se ven por delante.
5. **Constelación sorpresa (3)**: puntitos en la lente violeta; después aparecen puntos en el cielo que se unen uno a uno en una silueta simple. Figuras como arrays de vértices y segmentos (para empezar, una estrella y una mariposa, las mismas en los seis); legible unos segundos y se funde. Sin catálogo ni colección guardada.
6. **Fuegos de luz (5)**: una chispa sale del anteojo hacia arriba y se abren 2 o 3 flores de luz suaves, separadas en tiempo y altura: radios curvos, puntitos que caen y un rastro que se apaga de a poco. Sin parpadeos bruscos ni ruido fuerte.

### Archivos

Nuevos: `src/lib/laboratorio.js`, `src/pages/Laboratorio.jsx`, `src/pages/Laboratorio.css`, `public/assets/imagenes/laboratorio/…`. Tocados: `src/App.jsx` (ruta), `src/components/ContadorEstrellas.jsx`, `MonstruoDelMenu.jsx`, `Mundo1.jsx`, `src/styles/global.css`, `src/lib/recompensas.js`, `shared/comidas.js`, `server/index.js`, `CLAUDE.md` y `package.json` (4.6.0).

### Verificación

- Entrar desde el contador de cada uno de los seis mundos (también con saldo 0) y volver al mismo mundo, letra y posición del camino.
- Saldos distintos por mundo: el mismo laboratorio muestra el saldo que corresponde; las estrellas de dos letras de un mundo se suman; gastar desde una letra cambia el contador de la otra y no el de otro mundo.
- Saldo cero e insuficiente (mensaje con lo que falta, sin cobrar ni cambiar el paisaje), compra exacta, toques dobles rápidos (una sola cobranza, nunca negativo), efecto sin lugar o sin imágenes cargadas (no cobra), persistencia al recargar y con `npm run api` (evento `gastar` idempotente, mismo saldo en app y API).
- Flores → Burbujas → Fuegos con los tres a la vista juntos; Aurora durante Fuegos; plantas nuevas sin borrar las anteriores; salir y volver: saldo actualizado y escena vacía, sin sonidos ni animaciones colgadas.
- Tablero en pantalla chica (cuadrícula compacta) y con `prefers-reduced-motion`.
- Actividades, estrellas de repaso, comidas y evolución funcionan como antes; `npm run build` sin errores.

## Pendiente — Panel de trazado más a la izquierda y personaje más chico

Pedido del 18/11/2026, para después del Laboratorio de Luces. En todas las actividades de escribir/trazar (Dibujar en los seis mundos y Escribir de Mundo 1) el personaje tapa el trazo.

- Correr a la izquierda el panel para dibujar (tablero de `GuiaTrazado`) y las opciones (letras/sílabas a elegir, botones), dejando libre la zona del personaje.
- Achicar un poco el personaje en esas pantallas para que no se superponga al tablero en ningún tamaño (celular apaisado, tablet 4:3, escritorio 16:9).
- Verificar con las dos voces y en cada mundo (fondos distintos) que ningún trazo queda debajo del personaje ni de su boca. Cambio de estilos: versión parche.

## Cómo produzco audios y dibujos

- **Audios**: Chrome sobre tu sesión de elevenlabs.io. Por cada texto genero con Malena y con Dante, descargo y muevo el mp3 a `public/assets/sonido/supernena|supernene/` con el nombre de la tabla. Uso la configuración del archivo que ya está en el repo (`…Malena…_s50_sim75_v4`). **Consume créditos de tu cuenta**: son unos 45 textos de consigna + ~90 palabras, por dos voces.
- **Dibujos y fondos**: chatgpt.com, subiendo una lámina actual de `imagenes/peluches/` como referencia de estilo, PNG con fondo transparente. Miro cada imagen antes de guardarla y descarto la que no se reconozca. Son ~80 dibujos, ~8 fondos y 3 carteles.
- Ninguna actividad se habilita en un menú hasta tener todos sus audios y dibujos en las dos voces.

## Lo que no puedo resolver yo

- **Oído**: no puedo escuchar los audios. Necesito que confirmes si `letraL.mp3` dice el nombre ("ele") o el sonido, y que escuches los `sonidoL/M/S/T.mp3` generados: un fonema aislado suele salir mal en texto a voz. Si no sirven, las teclas y las galletitas usan `letraX.mp3`.
- **Progreso por dispositivo**: las marcas de completado quedan en localStorage y no viajan con el código de jugador (en Mundo 1 se reconstruyen desde las comidas). Sincronizarlas pide una tabla nueva en la API; lo dejo fuera salvo que lo pidas.
- Las preguntas de la última página de la auditoría (cómo reacciona un chico de 4 en tablet) siguen necesitando la prueba con chicos.

## Verificación

No hay tests ni linter: en cada fase corro `npm run build` y `npm run dev`, y recorro en Chrome las pantallas tocadas con las dos voces.

- Fase 1: 30 rondas de Caballitos Z y CE sin SA…SU; Bloques RR mostrando ARA/ERE.
- Fase 2: registro de audios (inicio y fin de cada uno) para comprobar que sílaba y felicitación no se superponen; dos errores seguidos muestran el brillo.
- Fase 3: `npm run api` con una base nueva; un jugador con datos viejos (más de 3 comidas) queda evolucionado; con 21 comidas evoluciona y las palabras se abren solas al volver al mundo; app y API devuelven el mismo tope.
- Fases 4 y 5: cada pantalla habla al entrar; en la vuelta 2 la respuesta no está escrita en pantalla; todas terminan con cartel.
- Fases 6 a 9: cada actividad nueva de punta a punta con supernena y supernene, consola sin 404 de audio o imagen.
- Fase 10: registro de audios y toques para comprobar que durante la consigna ningún toque llega a `elegir`; conteo de rondas por mundo.
- Fase 11: escenarios en localStorage (0, 1, 2 y 3 acumuladas; datos viejos con 2 y con 3) y comidas ganadas desde la API en Mundo 1.
- Fases 12 a 14: Dibujar de la A a la U sin tocar el selector, Ositos de consonantes en una ronda, Flores de Mundo 2 en los tres tamaños, brillo del monstruo al ganar y al dar comida, Memotest de las cinco letras.
- Fase 15: una letra por mundo (2 a 6) de punta a punta con las dos voces, más los grupos con pocas palabras (ZU, CHA, CHE, LLU, Ñ); capturas con dos y con tres soportes.
- En todas: `AppVersion` muestra la versión nueva, los redirects de `legacy/` en `src/App.jsx` siguen andando y CLAUDE.md queda actualizado cuando cambia la arquitectura.
