import { img } from "./assets";

// Laboratorio de Luces: pantalla opcional donde se gastan las estrellas del mundo en efectos de luz.
// Por ahora los seis laboratorios (uno por mundo) se ven y funcionan igual; cada uno usa el saldo de
// su mundo (estrellasDelMundo / gastarEstrellas en recompensas.js). Acá está todo lo ajustable:
// precios, límites visuales y el mapa del arte (pasado de mapa-activos.json).

// Entrada al laboratorio. Hoy la llama el contador de estrellas de los menús; para mover la entrada
// alcanza con llamar esta función desde otro lado.
export function abrirLaboratorio(navigate, mundo) {
	navigate("/laboratorio", { state: { world: mundo } });
}

export const NOMBRES_LABORATORIO = {
	1: "Dulces",
	2: "Insectos",
	3: "Bloques",
	4: "Sirenas",
	5: "Robots",
	6: "Unicornios"
};

// Precio de cada botón, en estrellas del mundo.
export const PRECIOS = {
	flores: 2,
	estrellas: 2,
	burbujas: 2,
	aurora: 3,
	constelacion: 3,
	fuegos: 5
};

// Límites visuales: si un efecto llegó a su tope, el toque no cobra. Con movimiento reducido
// (prefers-reduced-motion) las cantidades de partículas se multiplican por MOVIMIENTO_REDUCIDO.
export const LIMITES = {
	// Flores: colonias nuevas por toque, ramas laterales por tallo, flores abiertas en toda la escena
	// y lugares (columnas) de la zona de vides donde puede nacer una colonia.
	coloniasPorToque: 2,
	ramasPorTallo: [1, 3],
	floresAbiertas: 15,
	lugaresDeVides: 8,
	// Toques de cada efecto que pueden estar a la vista a la vez.
	estrellasActivas: 3,
	burbujasActivas: 2,
	auroraActivas: 2,
	constelacionActivas: 2,
	fuegosActivos: 2,
	// Cantidades por toque.
	estrellasPorToque: [3, 5],
	tandasDeBurbujas: 4,
	burbujasPorTanda: 34,
	burbujasVivas: 240,
	cintasDeAurora: [2, 3],
	fuegosPorToque: [2, 3],
	chispasPorFuego: 34
};
export const MOVIMIENTO_REDUCIDO = 0.5;

// Ignora un segundo toque al mismo botón dentro de este tiempo (toques dobles accidentales).
export const ESPERA_ENTRE_TOQUES = 450;

// Escenario lógico 16:9: todas las capas se dibujan en estas coordenadas y se escalan juntas.
export const ANCHO = 1920;
export const ALTO = 1080;
export const CIELO = { x: [0.25 * ANCHO, 0.95 * ANCHO], y: [0.09 * ALTO, 0.55 * ALTO] };
export const ZONA_VIDES = { x: [0.43 * ANCHO, 0.92 * ANCHO], y: [0.73 * ALTO, 0.95 * ALTO] };

// Máquina: caja del 46 % del ancho, corrida −3,2 % a la izquierda y apoyada al 2,5 % del borde de
// abajo. Las coordenadas del arte están en la rejilla original de 1381×1139.
const FUENTE = [1381, 1139];
const MAQUINA_ANCHO = 0.46 * ANCHO;
const MAQUINA_ALTO = (MAQUINA_ANCHO * FUENTE[1]) / FUENTE[0];
export const MAQUINA = {
	x: -0.032 * ANCHO,
	y: ALTO - 0.025 * ALTO - MAQUINA_ALTO,
	ancho: MAQUINA_ANCHO,
	alto: MAQUINA_ALTO
};
const ESCALA_MAQUINA = MAQUINA_ANCHO / FUENTE[0];

// Punto del arte de la máquina (rejilla 1381×1139) → coordenadas del escenario.
export function enMaquina([x, y]) {
	return [MAQUINA.x + x * ESCALA_MAQUINA, MAQUINA.y + y * ESCALA_MAQUINA];
}
const medida = (valor) => valor * ESCALA_MAQUINA;

export const DIAMETRO_BOTON = medida(111);

export const BOTONES = [
	{ id: "flores", nombre: "Flores", centro: [329, 773] },
	{ id: "estrellas", nombre: "Estrellas fugaces", centro: [461, 774] },
	{ id: "burbujas", nombre: "Burbujas arcoíris", centro: [593, 770] },
	{ id: "aurora", nombre: "Aurora de colores", centro: [725, 765] },
	{ id: "constelacion", nombre: "Constelación sorpresa", centro: [857, 757] },
	{ id: "fuegos", nombre: "Fuegos de luz", centro: [989, 746] }
].map((boton) => ({ ...boton, centro: enMaquina(boton.centro), imagen: img(`laboratorio/botones/${boton.id}.png`), precio: PRECIOS[boton.id] }));

function elipse(centro, radios) {
	const [x, y] = enMaquina(centro);
	return { x, y, rx: medida(radios[0]), ry: medida(radios[1]) };
}

// Instrumentos de la máquina: las elipses recortan las luces para que queden dentro del vidrio.
export const INSTRUMENTOS = {
	globoBurbuja: elipse([669, 453], [137, 107]),
	globoAurora: elipse([789, 211], [86, 57]),
	lenteConstelacion: elipse([974, 392], [61, 59]),
	prisma: enMaquina([550, 221]),
	bandejaSemillas: enMaquina([878, 642]),
	anteojo: enMaquina([1124, 511]),
	bocaTubo: enMaquina([1216, 744]),
	// Tramo del tubo de salida: "M 1105 646 C 1161 640 1210 656 1216 724" (curva cúbica).
	tuboSalida: [[1105, 646], [1161, 640], [1210, 656], [1216, 724]].map(enMaquina)
};

export const IMAGENES = {
	fondo: img("laboratorio/fondo.webp"),
	maquina: img("laboratorio/maquina.webp")
};

// Piezas de las plantas: el pivote (fracción de la imagen) es la base del tallito, que se apoya en
// la curva. `ancho` es el tamaño base en el escenario (se multiplica por la escala de la planta).
export const PIEZAS_PLANTA = {
	semilla: { imagen: img("laboratorio/flores/semilla.png"), pivote: [0.5, 0.89], ancho: 34 },
	brote: { imagen: img("laboratorio/flores/brote.png"), pivote: [0.52, 0.92], ancho: 42 },
	pimpollo: { imagen: img("laboratorio/flores/pimpollo.png"), pivote: [0.5, 0.96], ancho: 60 },
	rosa: { imagen: img("laboratorio/flores/flor-rosa.png"), pivote: [0.51, 0.97], ancho: 88 },
	dorada: { imagen: img("laboratorio/flores/flor-dorada.png"), pivote: [0.51, 0.97], ancho: 86 },
	violeta: { imagen: img("laboratorio/flores/flor-violeta.png"), pivote: [0.49, 0.98], ancho: 86 }
};
export const FLORES = ["rosa", "dorada", "violeta"];
