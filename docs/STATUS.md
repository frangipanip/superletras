# Estado de la auditoría pedagógica

Plan completo: [PLAN.md](PLAN.md). Rama de trabajo: `auditoria-pedagogica` (se mergea a `develop` para verlo en dev-superletras.leviatas.com; nada pasó a `master`).

Última actualización: 17/11/2026.

## Resumen

| Fase | Qué | Versión | Estado |
|---|---|---|---|
| 1 | Distractores que suenan igual y contraste R/RR | 3.72.10 | ✅ Hecha (commit `6d023f7`) |
| 2 | Devolución que ayuda y audios que no se pisan | 3.73.0 | ✅ Hecha (commit `d15342b`) |
| 3 | Camino a palabras visible y corto | 3.74.0 | ✅ Hecha (commit `aae8b42`), en dev; 3.74.1 saca el bloqueo de Q y CE |
| 4 | Consigna oral en todas las pantallas e íconos | 3.75.0 | 🔄 En curso |
| 5 | Palabras: segunda vuelta sin modelo y cierre | 3.76.0 | ⏳ Pendiente |
| 6 | Peluches en Mundo 4 | 3.77.0 | ⏳ Pendiente: faltan los dibujos |
| 7 | Mundo 5: G, GE, GUE, J, GÜE | 3.78.0 | ⏳ Pendiente: faltan los dibujos y los fondos |
| 8 | Mundo 6: B, V, Ñ, K, X | 3.79.0 | ⏳ Pendiente: faltan los dibujos |
| 9 | Tramo de oraciones | 3.80.0 | ⏳ Pendiente: faltan los dibujos |

## Recursos

- **Audios**: los 143 de la lista (`descargas/lista-audios.tsv`) están generados con ElevenLabs e instalados en `public/assets/sonido/supernena` (Malena) y `supernene` (Dante), incluidos los de las fases 4 a 9. `acierto.mp3` es común a las dos voces y está en `sonido/`.
- **Dibujos y fondos**: falta generarlos (chatgpt.com). Hacen falta para las fases 6 a 9 y para el cartel "ARA" de Mundo 3 (fase 4):
  - `imagenes/peluches/MUNDO4/`: unas 25 palabras (casa, cama, copa, conejo, cuna, cubo, queso, paquete, mosquito, máquina, cebra, cepillo, cine, cinta, zapato, taza, zorro, pozo, azul, chancho, leche, chocolate, ocho, chupete, lechuza).
  - `imagenes/peluches/MUNDO5/`: unas 20 palabras, más el fondo y las criaturas robot de cada actividad.
  - `imagenes/peluches/MUNDO6/`: unas 22 palabras.
  - `imagenes/oraciones/`: un dibujo por oración (6).

## Hecho

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

## Pendientes del lado de ustedes

- Escuchar `sonidoL.mp3`, `sonidoM.mp3` y `sonidoS.mp3` (fonemas sueltos suelen salir mal en texto a voz). Si no sirven, las teclas y el Puzzle usan `nombreX.mp3`.
- Confirmar si `letraL.mp3` dice "ele" o el sonido.
- Bug viejo: en supernena el archivo se llama `suengaGÜE.mp3` y `Mundo5.jsx` busca `suenaGÜE.mp3` (se arregla en la fase 7).
- Probar con chicos (la última página de la auditoría).

## Notas

- Si se pasa a la actividad siguiente con el botón del premio y se vuelve al mundo, el personaje aparece en la actividad anterior; el brillo de "la que sigue" sí marca la correcta.
- Las marcas de completado viven en el navegador (no viajan con el código de jugador). En Mundo 1 también cuenta como completada toda actividad con comida ganada.
