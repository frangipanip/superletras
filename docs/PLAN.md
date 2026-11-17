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

## Fase 9 — Tramo de oraciones (3.80.0)

`Oraciones.jsx` en `/oraciones`, tipo `oraciones` en `shared/actividades.js` y cartel nuevo en `PATH_BUTTONS` / `ACTIVITY_SIGN_IMAGES` de `Mundo1.jsx` (hay 19 posiciones y se usan 12). Se oye una oración de tres palabras, se ordenan tres fichas y el dibujo se anima al acertar. Vuelta 1 con modelo tenue, vuelta 2 sin modelo.

Como las palabras de las actividades no cambian, las oraciones usan su propia lista de palabras reales con las letras vistas. Propuesta inicial, a confirmar al llegar a la fase: LA MULA SALTA · EL SOL SALE · LOLA TOMA TÉ · EL OSO SALE · TITO TOMA MATE · MAMI AMA A LOLA. Cada una lleva un dibujo, el audio de la oración y el de cada palabra.

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
- En todas: `AppVersion` muestra la versión nueva, los redirects de `legacy/` en `src/App.jsx` siguen andando y CLAUDE.md queda actualizado cuando cambia la arquitectura.
