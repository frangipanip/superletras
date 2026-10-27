import { AGUA, AGUA_ABAJO, AGUA_ARRIBA, CANAL_ABAJO, CANAL_ARRIBA, CASCADA, CASCADA_LABIO, CASCADA_ORIGEN } from "./rioChocolateDatos";

// Dibuja en un canvas lo que no se resuelve con capas CSS: burbujas que nacen y
// revientan, chispas, el chorro de la cascada (baja despacio por la ladera bajo el
// glaseado y desde el labio cae acelerando), la corona que borbotea, gotas y ondas en el pozo.
// Todo se calcula a partir de la edad de cada elemento, así un cuadro lento no
// desarma nada. Coordenadas en píxeles de fondopalabras.png.

export const LIENZO = { x: 60, y: 360, ancho: 1873, alto: 420 };
// Tiene que coincidir con .rio-capa-base de RioChocolate.css (1200px en 42.86s).
const VELOCIDAD_RIO = 28;

const TAU = Math.PI * 2;

// En la caída, la coordenada s a lo largo del chorro crece como la raíz de la
// distancia (caída libre): los brillos salen del labio y se estiran abajo.
const CAIDA_K = 10.5;
const CAIDA_D0 = 9;
const CAIDA_S0 = CAIDA_K * Math.sqrt(CAIDA_D0);
const CAIDA_VELOCIDAD = 70;
const CAIDA_FONDO = 616;
// Columnas del chorro según dónde cruzan el labio.
const CAIDA_DESDE = 200;
const CAIDA_HASTA = 342;
// Lo que tarda una ola en bajar por la ladera, del glaseado al labio.
const LADERA_DURACION = 2.4;

const CANAL_INICIO = 62;
const CANAL_FIN = 190;
// Antes del final los trazos se afinan hasta desaparecer (si no, terminan todos en la misma columna).
const CANAL_AFINA = 28;
const CANAL_VELOCIDAD = 24;

const GRAVEDAD = 520;
const ESTALLIDO = 0.5;

function azar(min, max) {
	return min + Math.random() * (max - min);
}

function limitar(numero, min, max) {
	return Math.min(max, Math.max(min, numero));
}

function valor({ desde, paso, valores }, x) {
	const i = limitar((x - desde) / paso, 0, valores.length - 1.001);
	const i0 = Math.floor(i);
	return valores[i0] + (valores[i0 + 1] - valores[i0]) * (i - i0);
}

function dentro(poligono, x, y) {
	let adentro = false;
	for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
		const [xi, yi] = poligono[i];
		const [xj, yj] = poligono[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			adentro = !adentro;
		}
	}
	return adentro;
}

function camino(puntos) {
	const path = new Path2D();
	puntos.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
	path.closePath();
	return path;
}

// Rebote al aparecer, como en los dibujos animados.
function rebote(t) {
	const c = 1.9;
	return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

function frenar(t) {
	return 1 - (1 - t) * (1 - t);
}

// Los chorros de la izquierda se cierran un poco menos que los de la derecha.
function inclinacion(xl) {
	return 0.2 + (0.05 * (xl - CAIDA_DESDE)) / (CAIDA_HASTA - CAIDA_DESDE);
}

function yCaida(yl, s) {
	return yl + (s / CAIDA_K) ** 2 - CAIDA_D0;
}

// Recta del chorro que cruza el labio en xl: baja por la ladera desde el glaseado
// (yo) y cae desde el labio (yl).
function columna(xl) {
	const yl = valor(CASCADA_LABIO, xl);
	const pendiente = inclinacion(xl);
	const yo = valor(CASCADA_ORIGEN, xl - pendiente * (yl - valor(CASCADA_ORIGEN, xl)));
	return { xl, yl, yo: Math.min(yo, yl), inclinacion: pendiente };
}

function xColumna(c, y) {
	return c.xl + c.inclinacion * (y - c.yl);
}

const COLUMNAS_CAIDA = [];
for (let xl = CAIDA_DESDE; xl <= CAIDA_HASTA; xl += 6) {
	COLUMNAS_CAIDA.push(columna(xl));
}
const LABIO_MAS_ALTO = Math.min(...COLUMNAS_CAIDA.map((c) => c.yl));

export function crearAnimacion(canvas) {
	const ctx = canvas.getContext("2d");
	const agua = camino(AGUA);
	const cascada = camino(CASCADA);
	const burbujas = [];
	const estallidos = [];
	const chispas = [];
	const trazos = [];
	const olasLadera = [];
	const pulsos = [];
	const canal = [];
	const olasCanal = [];
	const borbotones = [];
	const gotas = [];
	const ondas = [];
	const acumulado = {};
	let anterior = null;

	function cada(clave, porSegundo, dt, crear) {
		acumulado[clave] = (acumulado[clave] || 0) + porSegundo * dt;
		while (acumulado[clave] >= 1) {
			acumulado[clave] -= 1;
			crear();
		}
	}

	function recorrer(lista, dibujar) {
		let j = 0;
		for (let i = 0; i < lista.length; i++) {
			if (dibujar(lista[i]) !== false) {
				lista[j++] = lista[i];
			}
		}
		lista.length = j;
	}

	// Una tira afinada en las puntas a lo largo de puntos {x, y, ancho}; si es
	// vertical se ensancha en x, si no en y.
	function tira(puntos, vertical, factor) {
		ctx.beginPath();
		puntos.forEach((p, i) => {
			const x = vertical ? p.x - p.ancho * factor : p.x;
			const y = vertical ? p.y : p.y - p.ancho * factor;
			if (i) ctx.lineTo(x, y);
			else ctx.moveTo(x, y);
		});
		for (let i = puntos.length - 1; i >= 0; i--) {
			const p = puntos[i];
			ctx.lineTo(vertical ? p.x + p.ancho * factor : p.x, vertical ? p.y : p.y + p.ancho * factor);
		}
		ctx.closePath();
		ctx.fill();
	}

	// ------------------------------------------------------------ nacimientos

	function puntoEnAgua(margen) {
		for (let intento = 0; intento < 8; intento++) {
			const enPozo = Math.random() < 0.3;
			const x = enPozo ? azar(250, 470) : azar(480, 1915);
			let y;
			if (x >= 430) {
				const arriba = valor(AGUA_ARRIBA, x) + margen + 5;
				const abajo = valor(AGUA_ABAJO, x) - margen - 4;
				if (abajo <= arriba) continue;
				y = azar(arriba, abajo);
			} else {
				y = azar(645, 730);
				if (!dentro(AGUA, x, y - margen - 3) || !dentro(AGUA, x, y + margen + 3)) continue;
			}
			return { x, y, enPozo };
		}
		return null;
	}

	function nuevaBurbuja(nace) {
		const r = Math.random() < 0.18 ? azar(11, 16) : azar(5, 10);
		const punto = puntoEnAgua(r);
		if (!punto) return;
		const vel = punto.enPozo ? azar(10, 18) : VELOCIDAD_RIO * azar(0.9, 1.1);
		burbujas.push({ x: punto.x, y: punto.y, r, vel, nace, vida: azar(1.6, 4.4), fase: azar(0, TAU) });
		// A veces sale un racimo: burbujitas pegadas que aparecen un poco después.
		if (Math.random() < 0.35) {
			const extra = 1 + Math.floor(Math.random() * 2);
			for (let i = 0; i < extra; i++) {
				const rr = azar(3, Math.max(3.5, r * 0.6));
				const lado = Math.random() < 0.5 ? -1 : 1;
				burbujas.push({
					x: punto.x + lado * (r + rr) * azar(1, 1.4),
					y: punto.y + azar(-2, 2),
					r: rr,
					vel,
					nace: nace + azar(0.1, 0.5),
					vida: azar(1.2, 3),
					fase: azar(0, TAU)
				});
			}
		}
	}

	function nuevoEstallido(x, y, r, nace) {
		const gotitas = [];
		const cantidad = 4 + Math.floor(Math.random() * 3);
		for (let i = 0; i < cantidad; i++) {
			const angulo = -Math.PI * (0.08 + (0.84 * (i + azar(0, 0.7))) / cantidad);
			const velocidad = azar(35, 70) * (0.7 + r / 14);
			gotitas.push({ vx: Math.cos(angulo) * velocidad, vy: Math.sin(angulo) * velocidad, r: Math.max(0.9, r * azar(0.12, 0.2)) });
		}
		estallidos.push({ x, y, r, nace, gotitas, giro: azar(0, TAU) });
	}

	function nuevaChispa(nace, enCascada) {
		if (enCascada) {
			const c = COLUMNAS_CAIDA[Math.floor(Math.random() * COLUMNAS_CAIDA.length)];
			const y = azar(c.yl + 15, 595);
			chispas.push({ x: xColumna(c, y), y, tam: azar(3.5, 6.5), nace, vida: 0.6 });
			return;
		}
		const punto = puntoEnAgua(4);
		if (punto && !punto.enPozo) {
			chispas.push({ x: punto.x, y: punto.y, tam: azar(4, 8.5), nace, vida: azar(0.55, 0.8) });
		}
	}

	function nuevaGota(nace, x, y, vx, vy, r) {
		const caida = azar(4, 16);
		const vida = (-vy + Math.sqrt(vy * vy + 2 * GRAVEDAD * caida)) / GRAVEDAD;
		gotas.push({ x, y, vx, vy, r, nace, vida });
	}

	function nuevaOnda(nace, x, y, radio, vida, deriva) {
		ondas.push({ x, y, radio, vida, deriva, nace });
	}

	function generar(t, dt) {
		cada("burbujas", 9, dt, () => nuevaBurbuja(t));
		cada("chispas", 3.2, dt, () => nuevaChispa(t, false));
		cada("chispasCascada", 1.4, dt, () => nuevaChispa(t, true));
		cada("trazos", 18, dt, () => {
			const oscuro = Math.random() < 0.22;
			trazos.push({
				...columna(azar(CAIDA_DESDE, CAIDA_HASTA)),
				largo: azar(8, 24),
				ancho: oscuro ? azar(3, 6) : azar(1.6, 4),
				oscuro,
				nace: t
			});
		});
		// Cada ola baja por la ladera y, cuando su centro llega al labio, sigue como pulso por la caída.
		cada("olas", 1.4, dt, () => {
			const ola = { nace: t, claro: Math.random() < 0.55, fase: azar(0, TAU) };
			olasLadera.push(ola);
			pulsos.push({ ...ola, nace: t + LADERA_DURACION - 14 / CAIDA_VELOCIDAD });
		});
		cada("canal", 4, dt, () => canal.push({ nace: t, p: azar(0.08, 0.45), largo: azar(22, 44), ancho: azar(1.5, 2.6) }));
		cada("olasCanal", 1.1, dt, () => olasCanal.push({ nace: t }));
		cada("borbotones", 9, dt, () => borbotones.push({ nace: t, x: azar(224, 392), y: azar(610, 624), r: azar(5, 11), vida: azar(0.5, 0.85) }));
		cada("gotas", 6, dt, () => nuevaGota(t, azar(222, 392), azar(604, 618), azar(-45, 85), azar(-190, -90), azar(1.8, 3.6)));
		cada("ondas", 1.3, dt, () => nuevaOnda(t, azar(270, 330), azar(668, 676), azar(85, 135), azar(1.6, 2.2), azar(30, 60)));
	}

	// ------------------------------------------------------------ dibujo

	// Franja ondulada que cruza todas las columnas del chorro, entre borde(c, -medio)
	// y borde(c, medio); más marcada en unas columnas que en otras (degradado
	// horizontal sobre una sola figura, sin costuras).
	function franja(borde, medio, color, alfa, fase) {
		const izquierda = borde(COLUMNAS_CAIDA[0], 0)[0];
		const derecha = borde(COLUMNAS_CAIDA[COLUMNAS_CAIDA.length - 1], 0)[0] + 2;
		const degradado = ctx.createLinearGradient(izquierda, 0, derecha, 0);
		for (let i = 0; i <= 8; i++) {
			const intensidad = 0.3 + 0.7 * Math.max(0, Math.sin(i * 0.9 + fase * 2));
			degradado.addColorStop(i / 8, `rgba(${color}, ${alfa * intensidad})`);
		}
		ctx.fillStyle = degradado;
		ctx.beginPath();
		COLUMNAS_CAIDA.forEach((c, i) => {
			const [x, y] = borde(c, -medio);
			if (i) ctx.lineTo(x, y);
			else ctx.moveTo(x, y);
		});
		for (let i = COLUMNAS_CAIDA.length - 1; i >= 0; i--) {
			const [x, y] = borde(COLUMNAS_CAIDA[i], medio);
			ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.fill();
	}

	// Ola que baja despacio por la ladera, del glaseado al labio; se apaga contra el labio.
	function dibujarOlaLadera(o, ahora) {
		const q = (ahora - o.nace) / LADERA_DURACION;
		if (q >= 1.15) return false;
		const color = o.claro ? "255, 232, 205" : "45, 14, 0";
		const visible = limitar(q / 0.25, 0, 1) * limitar((1.15 - q) / 0.3, 0, 1);
		const borde = (c, desplazamiento) => {
			const avance = limitar(q + desplazamiento + 0.04 * Math.sin(c.xl * 0.05 + o.fase), 0, 1);
			const y = c.yo + (c.yl - c.yo) * avance;
			return [xColumna(c, y), y];
		};
		// Baja despacio: con capas finas el borde se ve suave y no como una línea.
		[[0.16, 0.035], [0.11, 0.035], [0.07, 0.04], [0.035, 0.04]].forEach(([medio, alfa]) => franja(borde, medio, color, alfa * visible, o.fase));
	}

	// Abultamiento que cae por el chorro desde el labio.
	function dibujarPulso(p, ahora) {
		const edad = ahora - p.nace;
		if (edad < 0) return true;
		const centro = CAIDA_S0 + CAIDA_VELOCIDAD * edad - 14;
		if (yCaida(LABIO_MAS_ALTO, centro - 16) > CAIDA_FONDO) return false;
		const color = p.claro ? "255, 232, 205" : "45, 14, 0";
		const borde = (c, desplazamiento) => {
			const s = Math.max(CAIDA_S0, centro + desplazamiento + 4 * Math.sin(c.xl * 0.05 + p.fase));
			const y = yCaida(c.yl, s);
			return [xColumna(c, y), y];
		};
		[[13, 0.05], [6, 0.1]].forEach(([medio, alfa]) => franja(borde, medio, color, alfa, p.fase));
	}

	function dibujarTrazoCanal(t, ahora) {
		const cabeza = CANAL_INICIO + CANAL_VELOCIDAD * (ahora - t.nace);
		const cola = cabeza - t.largo;
		if (cola > CANAL_FIN) return false;
		const desde = Math.max(cola, CANAL_INICIO);
		const hasta = Math.min(cabeza, CANAL_FIN);
		if (hasta <= desde) return true;
		const puntos = [];
		for (let i = 0; i <= 6; i++) {
			const x = desde + ((hasta - desde) * i) / 6;
			const arriba = valor(CANAL_ARRIBA, x);
			const forma = Math.sin(Math.PI * limitar((x - cola) / t.largo, 0, 1)) ** 0.6 * limitar((CANAL_FIN - x) / CANAL_AFINA, 0, 1);
			puntos.push({ x, y: arriba + t.p * (valor(CANAL_ABAJO, x) - arriba), ancho: (t.ancho / 2) * forma });
		}
		const alfa = 0.55 * limitar((cabeza - CANAL_INICIO) / 25, 0, 1);
		ctx.fillStyle = `rgba(255, 232, 205, ${alfa * 0.25})`;
		tira(puntos, false, 2.4);
		ctx.fillStyle = `rgba(255, 238, 214, ${alfa})`;
		tira(puntos, false, 1);
	}

	// Franja de luz que cruza el canal de izquierda a derecha, como una ola que empuja.
	function dibujarOlaCanal(o, ahora) {
		const centro = CANAL_INICIO - 20 + CANAL_VELOCIDAD * 1.3 * (ahora - o.nace);
		if (centro - 20 > CANAL_FIN) return false;
		const apaga = limitar((CANAL_FIN - centro) / CANAL_AFINA, 0, 1);
		[[26, 0.13], [13, 0.16]].forEach(([medio, alfa]) => {
			const desde = Math.max(CANAL_INICIO, centro - medio);
			const hasta = Math.min(CANAL_FIN, centro + medio);
			if (hasta <= desde) return;
			const degradado = ctx.createLinearGradient(centro - medio, 0, centro + medio, 0);
			degradado.addColorStop(0, "rgba(255, 228, 198, 0)");
			degradado.addColorStop(0.5, `rgba(255, 228, 198, ${alfa * apaga})`);
			degradado.addColorStop(1, "rgba(255, 228, 198, 0)");
			ctx.fillStyle = degradado;
			ctx.beginPath();
			for (let i = 0; i <= 4; i++) {
				const x = desde + ((hasta - desde) * i) / 4;
				if (i) ctx.lineTo(x, valor(CANAL_ARRIBA, x));
				else ctx.moveTo(x, valor(CANAL_ARRIBA, x));
			}
			for (let i = 4; i >= 0; i--) {
				const x = desde + ((hasta - desde) * i) / 4;
				ctx.lineTo(x, valor(CANAL_ABAJO, x));
			}
			ctx.closePath();
			ctx.fill();
		});
	}

	function dibujarTrazo(t, ahora) {
		const cabeza = CAIDA_S0 + CAIDA_VELOCIDAD * (ahora - t.nace);
		const cola = cabeza - t.largo;
		if (yCaida(t.yl, cola) > CAIDA_FONDO) return false;
		const desde = Math.max(cola, CAIDA_S0);
		if (cabeza <= desde) return true;
		const puntos = [];
		for (let i = 0; i <= 6; i++) {
			const s = desde + ((cabeza - desde) * i) / 6;
			const y = yCaida(t.yl, s);
			const forma = Math.sin(Math.PI * limitar((s - cola) / t.largo, 0, 1)) ** 0.6;
			puntos.push({ x: xColumna(t, y), y, ancho: (t.ancho / 2) * forma * (1 + (y - t.yl) / 180) });
		}
		// Asoma por el labio.
		const asoma = limitar((yCaida(t.yl, cabeza) - t.yl) / 10, 0, 1);
		if (t.oscuro) {
			ctx.fillStyle = `rgba(50, 16, 2, ${0.2 * asoma})`;
			tira(puntos, true, 1);
			return true;
		}
		ctx.fillStyle = `rgba(255, 232, 205, ${0.16 * asoma})`;
		tira(puntos, true, 2.4);
		ctx.fillStyle = `rgba(255, 240, 220, ${0.8 * asoma})`;
		tira(puntos, true, 1);
		return true;
	}

	function dibujarBorboton(b, ahora) {
		const p = (ahora - b.nace) / b.vida;
		if (p >= 1) {
			if (Math.random() < 0.45) {
				nuevaGota(b.nace + b.vida, b.x, b.y - b.r, azar(-40, 70), azar(-170, -90), azar(1.6, 3));
			}
			return false;
		}
		const escala = (p < 0.35 ? rebote(p / 0.35) : 1) * (1 - (Math.max(0, p - 0.55) / 0.45) * 0.5);
		const rx = Math.max(0.1, b.r * escala);
		const ry = rx * 0.82;
		const cy = b.y - b.r * 0.55 * Math.sin(Math.PI * p);
		const degradado = ctx.createRadialGradient(b.x - rx * 0.35, cy - ry * 0.5, rx * 0.05, b.x, cy, rx * 1.1);
		degradado.addColorStop(0, "#bb7a52");
		degradado.addColorStop(0.55, "#7c3f1c");
		degradado.addColorStop(1, "#552710");
		ctx.fillStyle = degradado;
		ctx.beginPath();
		ctx.ellipse(b.x, cy, rx, ry, 0, 0, TAU);
		ctx.fill();
		ctx.fillStyle = "rgba(255, 244, 228, 0.9)";
		ctx.beginPath();
		ctx.ellipse(b.x - rx * 0.25, cy - ry * 0.45, rx * 0.28, ry * 0.16, -0.5, 0, TAU);
		ctx.fill();
	}

	function dibujarOnda(o, ahora) {
		const p = (ahora - o.nace) / o.vida;
		if (p >= 1) return false;
		const rx = o.radio * frenar(p) + 3;
		const ry = rx * 0.3;
		const x = o.x + o.deriva * p;
		ctx.lineCap = "round";
		ctx.lineWidth = 0.6 + 1.6 * (1 - p);
		ctx.strokeStyle = `rgba(255, 226, 194, ${0.7 * (1 - p)})`;
		ctx.beginPath();
		ctx.ellipse(x, o.y, rx, ry, 0, 0.04 * Math.PI, 0.96 * Math.PI);
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.strokeStyle = `rgba(70, 24, 6, ${0.3 * (1 - p)})`;
		ctx.beginPath();
		ctx.ellipse(x, o.y, rx, ry, 0, 1.06 * Math.PI, 1.94 * Math.PI);
		ctx.stroke();
	}

	function dibujarBurbuja(b, ahora) {
		const edad = ahora - b.nace;
		if (edad < 0) return true;
		const x = b.x + b.vel * edad;
		if (edad >= b.vida) {
			nuevoEstallido(x, b.y, b.r, b.nace + b.vida);
			return false;
		}
		let escala = edad < 0.35 ? rebote(edad / 0.35) : 1;
		const resta = b.vida - edad;
		if (resta < 0.14) escala *= 1 + (1 - resta / 0.14) * 0.2;
		const bamboleo = Math.sin(edad * 7 + b.fase) * 0.06;
		const rx = Math.max(0.1, b.r * escala * (1 + bamboleo));
		const ry = Math.max(0.1, b.r * escala * 0.8 * (1 - bamboleo));
		const cy = b.y - ry * 0.3;
		ctx.globalAlpha = limitar(edad / 0.15, 0, 1);
		// Anillo que levanta en la superficie y sombra de contacto.
		ctx.lineWidth = Math.max(1, b.r * 0.12);
		ctx.strokeStyle = "rgba(240, 182, 142, 0.5)";
		ctx.beginPath();
		ctx.ellipse(x, b.y + ry * 0.2, rx * 1.45, rx * 0.5, 0, 0, TAU);
		ctx.stroke();
		ctx.fillStyle = "rgba(50, 16, 2, 0.38)";
		ctx.beginPath();
		ctx.ellipse(x + rx * 0.12, b.y + ry * 0.25, rx * 1.02, ry * 0.4, 0, 0, TAU);
		ctx.fill();
		// Cúpula con contorno claro, como las burbujas pintadas del fondo.
		const degradado = ctx.createRadialGradient(x - rx * 0.3, cy - ry * 0.45, rx * 0.08, x, cy, rx * 1.1);
		degradado.addColorStop(0, "#a8653c");
		degradado.addColorStop(0.55, "#74391a");
		degradado.addColorStop(1, "#4f230b");
		ctx.fillStyle = degradado;
		ctx.beginPath();
		ctx.ellipse(x, cy, rx, ry, 0, 0, TAU);
		ctx.fill();
		ctx.strokeStyle = "rgba(238, 186, 148, 0.95)";
		ctx.lineWidth = Math.max(1.1, b.r * 0.13);
		ctx.stroke();
		ctx.lineCap = "round";
		ctx.strokeStyle = "rgba(255, 236, 210, 0.95)";
		ctx.lineWidth = Math.max(1.2, b.r * 0.2);
		ctx.beginPath();
		ctx.ellipse(x, cy, rx * 0.82, ry * 0.82, 0, 0.08 * Math.PI, 0.58 * Math.PI);
		ctx.stroke();
		ctx.fillStyle = "#fffaf3";
		ctx.beginPath();
		ctx.ellipse(x + rx * 0.18, cy - ry * 0.4, rx * 0.38, ry * 0.24, -0.35, 0, TAU);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x - rx * 0.4, cy - ry * 0.1, Math.max(0.5, b.r * 0.09), 0, TAU);
		ctx.fill();
		ctx.globalAlpha = 1;
	}

	function dibujarAnillo(e, ahora) {
		const p = (ahora - e.nace) / ESTALLIDO;
		if (p >= 1) return false;
		const rx = e.r * (1 + 2.6 * frenar(p));
		const ry = rx * 0.36;
		ctx.lineCap = "round";
		ctx.lineWidth = 0.6 + 1.4 * (1 - p);
		ctx.strokeStyle = `rgba(255, 228, 196, ${0.9 * (1 - p)})`;
		ctx.beginPath();
		ctx.ellipse(e.x, e.y, rx, ry, 0, 0, Math.PI);
		ctx.stroke();
		ctx.strokeStyle = `rgba(70, 24, 6, ${0.35 * (1 - p)})`;
		ctx.beginPath();
		ctx.ellipse(e.x, e.y, rx, ry, 0, Math.PI, TAU);
		ctx.stroke();
	}

	// Gotitas y rayitas del "¡pop!", fuera del recorte del agua.
	function dibujarSalpicon(e, ahora) {
		const edad = ahora - e.nace;
		const p = edad / ESTALLIDO;
		if (p >= 1) return false;
		const q = p / 0.45;
		if (q < 1) {
			ctx.lineCap = "round";
			ctx.lineWidth = Math.max(0.8, e.r * 0.13);
			ctx.strokeStyle = `rgba(255, 240, 220, ${1 - q})`;
			ctx.beginPath();
			for (let i = 0; i < 5; i++) {
				const angulo = e.giro + (i * TAU) / 5;
				const c = Math.cos(angulo);
				const s = Math.sin(angulo) * 0.7;
				const desde = e.r * (1.2 + 1.2 * q);
				const hasta = e.r * (1.7 + 1.8 * q);
				ctx.moveTo(e.x + c * desde, e.y - e.r * 0.4 + s * desde);
				ctx.lineTo(e.x + c * hasta, e.y - e.r * 0.4 + s * hasta);
			}
			ctx.stroke();
		}
		e.gotitas.forEach((g) => {
			const x = e.x + g.vx * edad;
			const y = e.y - e.r * 0.5 + g.vy * edad + 0.5 * 300 * edad * edad;
			const r = g.r * (1 - 0.4 * p);
			ctx.fillStyle = `rgba(111, 52, 22, ${1 - p})`;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, TAU);
			ctx.fill();
			ctx.fillStyle = `rgba(255, 236, 214, ${1 - p})`;
			ctx.beginPath();
			ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.35, 0, TAU);
			ctx.fill();
		});
	}

	function dibujarGota(g, ahora) {
		const edad = ahora - g.nace;
		if (edad >= g.vida) {
			const x = g.x + g.vx * g.vida;
			const y = g.y + g.vy * g.vida + 0.5 * GRAVEDAD * g.vida * g.vida;
			if (dentro(AGUA, x, y)) {
				nuevaOnda(g.nace + g.vida, x, y, azar(10, 18), 0.6, 4);
			}
			return false;
		}
		const x = g.x + g.vx * edad;
		const y = g.y + g.vy * edad + 0.5 * GRAVEDAD * edad * edad;
		const vy = g.vy + GRAVEDAD * edad;
		const estira = 1 + Math.min(0.8, Math.hypot(g.vx, vy) / 500);
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(Math.atan2(vy, g.vx));
		ctx.fillStyle = "#74381a";
		ctx.beginPath();
		ctx.ellipse(0, 0, g.r * estira, g.r / Math.sqrt(estira), 0, 0, TAU);
		ctx.fill();
		ctx.restore();
		ctx.fillStyle = "rgba(255, 238, 216, 0.9)";
		ctx.beginPath();
		ctx.arc(x - g.r * 0.3, y - g.r * 0.35, g.r * 0.35, 0, TAU);
		ctx.fill();
	}

	function dibujarChispa(c, ahora) {
		const p = (ahora - c.nace) / c.vida;
		if (p >= 1) return false;
		const s = Math.sin(Math.PI * p);
		const largo = c.tam * s;
		const curva = largo * 0.12;
		ctx.save();
		ctx.translate(c.x, c.y);
		ctx.rotate(p * 1.2);
		ctx.fillStyle = `rgba(255, 240, 215, ${0.28 * s})`;
		ctx.beginPath();
		ctx.arc(0, 0, largo * 0.7, 0, TAU);
		ctx.fill();
		ctx.fillStyle = `rgba(255, 252, 245, ${0.95 * s})`;
		ctx.beginPath();
		ctx.moveTo(0, -largo);
		ctx.quadraticCurveTo(curva, -curva, largo, 0);
		ctx.quadraticCurveTo(curva, curva, 0, largo);
		ctx.quadraticCurveTo(-curva, curva, -largo, 0);
		ctx.quadraticCurveTo(-curva, -curva, 0, -largo);
		ctx.fill();
		ctx.restore();
	}

	function pintar(ahora, escala) {
		const ancho = Math.round(LIENZO.ancho * escala);
		const alto = Math.round(LIENZO.alto * escala);
		if (canvas.width !== ancho || canvas.height !== alto) {
			canvas.width = ancho;
			canvas.height = alto;
		}
		if (anterior === null) {
			// Arranca con todo ya en movimiento, como si hubiera estado corriendo.
			for (let t = ahora - 6; t < ahora; t += 0.05) generar(t, 0.05);
		} else {
			generar(ahora, Math.min(ahora - anterior, 0.1));
		}
		anterior = ahora;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(escala, 0, 0, escala, -LIENZO.x * escala, -LIENZO.y * escala);

		ctx.save();
		ctx.clip(cascada);
		recorrer(olasLadera, (o) => dibujarOlaLadera(o, ahora));
		recorrer(pulsos, (p) => dibujarPulso(p, ahora));
		recorrer(olasCanal, (o) => dibujarOlaCanal(o, ahora));
		recorrer(canal, (t) => dibujarTrazoCanal(t, ahora));
		recorrer(trazos, (t) => dibujarTrazo(t, ahora));
		ctx.restore();

		recorrer(borbotones, (b) => dibujarBorboton(b, ahora));

		ctx.save();
		ctx.clip(agua);
		recorrer(ondas, (o) => dibujarOnda(o, ahora));
		recorrer(burbujas, (b) => dibujarBurbuja(b, ahora));
		estallidos.forEach((e) => dibujarAnillo(e, ahora));
		ctx.restore();

		recorrer(estallidos, (e) => dibujarSalpicon(e, ahora));
		recorrer(gotas, (g) => dibujarGota(g, ahora));
		recorrer(chispas, (c) => dibujarChispa(c, ahora));
	}

	return { pintar };
}
