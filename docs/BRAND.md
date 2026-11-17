# Brand — Superletras

Esta guía describe el estilo que ya usa el proyecto y cómo continuar creando pantallas, imágenes y audios coherentes con él. El alcance funcional está en [PLAN.md](PLAN.md), el avance en [STATUS.md](STATUS.md) y el flujo de implementación en [PROCESS.md](PROCESS.md).

## Identidad y tono

Superletras acompaña a chicos que están aprendiendo a leer. La experiencia es un juego de exploración: elegir una letra, escuchar, tocar o armar una respuesta y recibir ayuda para seguir. Las imágenes y la voz permiten entender qué hacer antes de poder leer las instrucciones.

- Usar español rioplatense y voseo: «Tocá», «Escuchá», «Poné», «Escribí», «Mirá».
- Dar consignas breves, concretas y de una acción por vez. Nombrar el objeto que el chico ve: «Tocá la manga que dice: …».
- Mantener una voz cálida, clara y alentadora. Los errores llevan a otra escucha y a una pista; las felicitaciones son cortas, como «¡Muy bien!» o «¡Fabuloso!».
- Preferir íconos reconocibles para volver, reiniciar, repetir o continuar. El texto de apoyo y las etiquetas accesibles aclaran la acción.
- Conservar tildes, Ñ y diéresis en el contenido visible. Las palabras, sílabas y reglas de pronunciación deben coincidir con el audio.

## Lenguaje visual

El arte es infantil, colorido y amable. Los escenarios tienen profundidad suave, iluminación luminosa y superficies de juguete; los objetos y criaturas suelen tener contornos oscuros definidos, formas redondeadas, sombras simples y expresiones simpáticas. Hay variaciones entre recursos existentes: tomar como referencia la actividad que se está ampliando.

Los colores vivos se combinan con zonas de descanso para que se lean las letras. Dulces, flores, bloques, máquinas y animales se reconocen por su silueta. Los detalles decorativos acompañan la escena sin tapar la tarea ni confundirse con opciones que se puedan tocar.

### Temáticas por mundo

| Mundo | Universo visual | Elementos que ya lo representan |
|---|---|---|
| 1 | Dulces y fantasía | Chupetines, caramelos, pasteles, castillos dulces y caminos de golosinas. |
| 2 | Jardín e insectos | Flores, mariposas, orugas y vegetación. |
| 3 | Bloques y juguetes | Construcciones de bloques, colores vivos y personajes con esa temática. |
| 4 | Fondo del mar | Peces, caballitos, almejas, corales y personajes sirena. |
| 5 | Robots | Fábricas, talleres, engranajes, tuberías y máquinas amigables. |
| 6 | Unicornios y fantasía | Arcoíris, nubes, prados y castillos. |

Cada actividad nueva tiene un fondo propio que combina el mundo y la tarea. Por ejemplo, Inicio de Mundo 5 usa un piso de fábrica despejado y «¿J o G?» un taller con dos máquinas. El Tren tendrá escenario, locomotora y vagones de cada mundo; su implementación actual se consulta en `STATUS.md`.

### Referencias reales del repositorio

Antes de crear una pieza, abrir la referencia más cercana y usarla como imagen de entrada cuando la herramienta lo permita.

| Pieza | Referencia |
|---|---|
| Escenario panorámico del camino | [FONDOM1.jpg](../public/assets/imagenes/FONDOM1.jpg) |
| Fondo de actividad con el centro libre | [fondoInicioM5.jpg](../public/assets/imagenes/fondoInicioM5.jpg) |
| Dibujo de palabra recortado | [gato.png](../public/assets/imagenes/peluches/MUNDO5/gato.png) |
| Medallón de actividad | [INICIALESbtn.png](../public/assets/imagenes/INICIALESbtn.png) |
| Variantes del personaje y bocas | [assets.js](../src/lib/assets.js), constantes `CHARACTERS` y `MUNDO*_CHARACTERS` / `MUNDO*_MOUTH_IMAGES` |
| Controles, fichas y ayuda | [actividad.css](../src/pages/actividad.css) |
| Cartel y botones de premio | [PremioComida.css](../src/components/PremioComida.css) |

## Composición e interfaz

### Fondos y encuadre

- Diseñar siempre en horizontal. Los fondos de actividad recientes suelen ser de 1672 × 941, aproximadamente 16:9; los caminos de los menús usan panoramas más anchos. Mantener las proporciones de la pantalla de referencia.
- Dejar espacio libre donde van las letras, opciones, personaje y controles. Poner la decoración más cargada hacia los bordes o al fondo de la escena.
- Definir piso, plataformas o vía según la mecánica. En el Tren, la vía debe ser recta y horizontal y coincidir con el apoyo del convoy al integrarlo.
- Comprobar el recorte real de `cover` o el escenario escalado de la actividad. Un fondo correcto por separado puede ocultar elementos al verse en un celular horizontal.
- Probar poca altura además del ancho y conservar el encuadre de tablet de 1138 × 712. Las piezas y sus áreas de toque deben seguir siendo grandes y separables.

### Letras, color y controles

Las letras y palabras de las actividades se presentan grandes, gruesas y principalmente en mayúsculas. La tipografía funcional existente usa Arial/Helvetica; Peluches usa alternativas redondeadas como Arial Rounded MT Bold y Trebuchet MS. El premio incluye familias decorativas con fallbacks. Reutilizar el estilo de la pantalla y comprobar qué fuente se renderiza en el dispositivo.

Los medallones, botones redondeados, bordes visibles, degradados suaves y sombras dan aspecto de piezas que se pueden tocar. Las letras de las respuestas se dibujan en la interfaz para conservar legibilidad y exactitud; los carteles ilustrados existentes sirven de referencia para nuevos carteles.

El proyecto no tiene una única paleta centralizada. Estos son colores ya presentes, útiles al extender controles compartidos:

| Uso existente | Colores de referencia |
|---|---|
| Paneles globales | Violeta oscuro `#1b1464` y blanco. |
| Controles celestes | Degradado `#d6f8ff` → `#7bcfe3` → `#5fb5cb`, borde `#2f8498`. |
| Fichas del Tren | Crema `#fff8c7` y texto marrón `#65352a`. |
| Ficha elegida | Naranja `#ff8a00` con borde y sombra. |
| Ayuda tras errores | Halo blanco y amarillo `#ffd400` (`pista-correcta`). |
| Premio | Marco dorado, estrellas y botones verdes, azules o naranjas. |

El contraste debe permitir distinguir la respuesta sobre el fondo ilustrado. Acompañar los estados con cambios de forma, halo, movimiento o audio, además del color. Las animaciones celebran el acierto o guían la atención; la consigna y el comienzo de la ronda siguiente esperan a que termine el audio correspondiente.

## Cómo crear imágenes

La producción previa se hizo en ChatGPT con imágenes de referencia. También se usó la herramienta de generación de imágenes de Codex para el fondo y la locomotora de Tren de Mundo 5. La continuidad visual se consigue con una referencia concreta y una composición pensada para la actividad.

1. Revisar qué pieza falta y dónde se va a colocar. Definir mundo, función, proporción, tamaño visible y, si corresponde, estados de reposo, acierto y error.
2. Abrir una imagen existente del mismo tipo. Adjuntarla como referencia y pedir que conserve estilo, proporciones, contornos e iluminación.
3. Describir un objeto o escenario preciso. En un dibujo de vocabulario, la prioridad es que el chico reconozca exactamente la palabra pedida.
4. Generar y mirar el resultado antes de incorporarlo. Revisar silueta, partes del objeto, márgenes, transparencia, dirección y ausencia de textos accidentales.
5. Guardar la pieza final en `public/assets/imagenes/`, junto a las de su actividad. Conservar los recursos elegidos por el usuario; si se produce una alternativa, identificarla y registrar cuál quedó integrada.
6. Integrar y revisar a tamaño real sobre el fondo de la actividad, con los recortes de celular y tablet. Una imagen aprobada por separado todavía requiere esta comprobación.

### Dibujos de palabras y criaturas

Para Peluches se vienen creando láminas de seis dibujos, en grilla de 3 × 2 sobre blanco, con separación amplia. Cada dibujo se recorta, se limpia el fondo y se guarda como PNG con transparencia; las piezas recientes suelen tener unos 300 px en su lado mayor. También se puede pedir directamente una pieza aislada con fondo transparente.

La transparencia debe estar en el canal alfa: un damero o un fondo blanco pintado siguen siendo parte de la imagen. Conservar el objeto completo y evitar halos blancos. Ajustar el tamaño de exportación al uso; los fondos y personajes grandes necesitan más resolución que una opción de Peluches.

Para animaciones o estados de una criatura, mantener el mismo lienzo, escala, punto de apoyo y posición. La expresión o pose puede cambiar sin que la pieza salte entre cuadros. Reutilizar las variantes existentes de Supernena y Supernene y sus bocas; verificar la alineación antes de agregar una variante de mundo.

### Prompts de partida

Reemplazar los campos entre corchetes y adjuntar la referencia indicada.

**Dibujo de palabra:**

> Usá la imagen adjunta como referencia de estilo para Superletras, un juego infantil para aprender a leer. Dibujá [objeto] claramente reconocible, completo y centrado, con formas redondeadas, contorno oscuro definido, colores vivos y sombras suaves como la referencia. Un solo objeto, sin palabras ni letras, con margen alrededor y fondo transparente. Se verá pequeño como opción de una actividad.

**Lámina para recortar:**

> Creá seis dibujos de [lista exacta], en una grilla de tres columnas y dos filas sobre fondo blanco, con amplio espacio entre ellos. Mantené el estilo de la lámina adjunta, una escala visual similar y todos los objetos completos. Sin rótulos, letras, marcos ni elementos que unan los dibujos. Se van a recortar por separado para un juego infantil.

**Fondo de actividad:**

> Tomá el fondo adjunto como referencia de estilo y composición. Creá un escenario horizontal para la actividad [actividad] del mundo [temática] de Superletras. Decoración en [zonas], con [zona de juego] libre para colocar [opciones/personaje/fichas]. Colores vivos, formas redondeadas, profundidad e iluminación suaves. Sin consignas, letras ni botones dibujados. El piso o soporte debe quedar en [posición según el encuadre de referencia].

## Cómo crear audios

La voz forma parte de la identidad del juego. La producción documentada usa ElevenLabs, con el mismo contenido para los dos personajes:

| Personaje | Voz | Carpeta de destino |
|---|---|---|
| Supernena | Malena — Warm, Dynamic and Confident | `public/assets/sonido/supernena/` |
| Supernene | Dante — Clear, Expressive, Natural | `public/assets/sonido/supernene/` |

La configuración registrada en [prompt-audios-elevenlabs.md](../descargas/prompt-audios-elevenlabs.md) es Eleven v4, estabilidad 50, similitud 75, intensidad de clonación 0, español y MP3 de 44,1 kHz / 128 kbps. Esa es la referencia de las tandas existentes, no una comprobación de la configuración actual de la cuenta.

1. Preparar una lista de nombre de archivo y texto exacto; tomar como referencia [lista-audios.tsv](../descargas/lista-audios.tsv). Respetar tildes, signos y pausas de punto o dos puntos.
2. Reutilizar los audios existentes de letras, sílabas y palabras. Armar consignas variables con una frase fija y el audio correspondiente, como «Empieza con:» + sílaba.
3. Generar el mismo texto con las dos voces. El procedimiento de las tandas existentes usa la Generación 1 y evita regeneraciones innecesarias, porque consumen créditos.
4. Guardar cada MP3 con su ruta exacta dentro de la carpeta de cada voz. Los efectos comunes, como `acierto.mp3`, van directamente en `public/assets/sonido/`.
5. Escuchar la pronunciación, especialmente fonemas aislados, R/RR, GE/GUE/GÜE y palabras con Ñ. Si no se pudo escuchar, dejar esa revisión pendiente en `STATUS.md`.
6. Probar la secuencia en la actividad: lo tocado → devolución → ayuda, sin voces superpuestas. La primera ayuda dice «Casi. Escuchá otra vez:»; la siguiente dice «Mirá, es esta:» y acompaña con halo y «Tocala».

Respetar el español rioplatense del contenido: Z y S pueden sonar igual, al igual que B/V o GE/GI y JE/JI. El diseño de las opciones debe tener en cuenta esas equivalencias para que una respuesta válida al oído no se marque como error. Las decisiones pedagógicas y las listas de palabras se mantienen según el plan.

## Entrega de recursos

Los nombres y rutas deben coincidir exactamente con el código, incluyendo mayúsculas, espacios, tildes, Ñ y Ü: el servidor Linux distingue mayúsculas de minúsculas. Usar `img()`, `sound()` y `commonSound()` de `src/lib/assets.js` al integrar.

Antes de habilitar una actividad, comprobar que tiene todas sus imágenes y audios en ambas voces, que el dibujo coincide con la palabra, que el texto se lee sobre el fondo y que el personaje no tapa opciones. Registrar en `STATUS.md` los recursos integrados, las alternativas pendientes y las pruebas realizadas. La versión y la publicación se manejan según `AGENTS.md` y `PROCESS.md`.
