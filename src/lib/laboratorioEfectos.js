import { ALTO, ANCHO, CIELO, DURACION_EFECTOS, FLORES, INSTRUMENTOS, LIMITES, MOVIMIENTO_REDUCIDO, PIEZAS_PLANTA, ZONA_VIDES } from "./laboratorio";

// Motor de efectos del Laboratorio de Luces. Todo se dibuja por código en dos lienzos (Canvas 2D)
// con las coordenadas lógicas del escenario (1920×1080):
// - paisaje: detrás de la máquina (aurora, constelaciones, estrellas fugaces, fuegos, plantas y
//   burbujas del pasto);
// - luces: delante de la máquina y debajo de los botones (brillos recortados dentro de los
//   instrumentos y las burbujas que salen de la máquina).
// Cada toque agrega instancias a la escena (nunca reemplaza un efecto por otro). Las breves se
// terminan solas; las plantas quedan hasta salir de la pantalla. Nada de esto se guarda.

const TAU = Math.PI * 2;
const azar = (a, b) => a + Math.random() * (b - a);
const entero = (a, b) => Math.floor(azar(a, b + 1));
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
const suave = (u) => {
	const x = limitar(u, 0, 1);
	return x * x * (3 - 2 * x);
};
const salida = (u) => 1 - Math.pow(1 - limitar(u, 0, 1), 3);
const mezclar = (lista) => {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
};

// Sube en `entrada` segundos, se mantiene y se apaga en los últimos `apagado` segundos de `total`.
function envolvente(t, total, entrada, apagado) {
	if (t <= 0 || t >= total) return 0;
	return Math.min(1, t / entrada, (total - t) / apagado);
}

function brillo(ctx, x, y, radio, rgb, alfa) {
	if (alfa <= 0.002 || radio <= 0) return;
	const gradiente = ctx.createRadialGradient(x, y, 0, x, y, radio);
	gradiente.addColorStop(0, `rgba(${rgb},${alfa})`);
	gradiente.addColorStop(0.35, `rgba(${rgb},${alfa * 0.45})`);
	gradiente.addColorStop(1, `rgba(${rgb},0)`);
	ctx.fillStyle = gradiente;
	ctx.fillRect(x - radio, y - radio, radio * 2, radio * 2);
}

function punto(ctx, x, y, radio, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, radio, 0, TAU);
	ctx.fill();
}

// Dibuja solo dentro de la elipse de un instrumento (el vidrio de un globo o la lente).
function dentroDe(ctx, elipse, dibujo) {
	ctx.save();
	ctx.beginPath();
	ctx.ellipse(elipse.x, elipse.y, elipse.rx, elipse.ry, 0, 0, TAU);
	ctx.clip();
	dibujo();
	ctx.restore();
}

function bezier([p0, p1, p2, p3], u) {
	const v = 1 - u;
	const a = v * v * v;
	const b = 3 * v * v * u;
	const c = 3 * v * u * u;
	const d = u * u * u;
	return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function activas(escena, tipo) {
	return escena.instancias.filter((instancia) => instancia.tipo === tipo).length;
}

// Burbuja iridiscente dibujada una sola vez en un lienzo chico (tres variantes con el arcoíris
// girado); después cada burbuja es un drawImage escalado.
function crearSpriteBurbuja(giro) {
	const lienzo = document.createElement("canvas");
	lienzo.width = 128;
	lienzo.height = 128;
	const ctx = lienzo.getContext("2d");
	const radio = 60;
	const relleno = ctx.createRadialGradient(64, 64, radio * 0.15, 64, 64, radio);
	relleno.addColorStop(0, "rgba(255,255,255,0.02)");
	relleno.addColorStop(0.72, "rgba(225,240,255,0.08)");
	relleno.addColorStop(1, "rgba(255,255,255,0.3)");
	ctx.fillStyle = relleno;
	ctx.beginPath();
	ctx.arc(64, 64, radio, 0, TAU);
	ctx.fill();
	const dx = Math.cos(giro) * radio;
	const dy = Math.sin(giro) * radio;
	const borde = ctx.createLinearGradient(64 - dx, 64 - dy, 64 + dx, 64 + dy);
	borde.addColorStop(0, "rgba(255,150,220,0.9)");
	borde.addColorStop(0.25, "rgba(255,236,140,0.9)");
	borde.addColorStop(0.5, "rgba(140,255,215,0.9)");
	borde.addColorStop(0.75, "rgba(130,200,255,0.9)");
	borde.addColorStop(1, "rgba(210,150,255,0.9)");
	ctx.lineWidth = 4;
	ctx.strokeStyle = borde;
	ctx.beginPath();
	ctx.arc(64, 64, radio - 2, 0, TAU);
	ctx.stroke();
	ctx.fillStyle = "rgba(255,255,255,0.8)";
	ctx.beginPath();
	ctx.ellipse(44, 42, 15, 8, -0.75, 0, TAU);
	ctx.fill();
	punto(ctx, 86, 88, 4, "rgba(255,255,255,0.55)");
	return lienzo;
}

export function crearEscena({ reducido = false } = {}) {
	return {
		reducido,
		factor: reducido ? MOVIMIENTO_REDUCIDO : 1,
		// Escala del lienzo real respecto del lógico (la pone la pantalla al cambiar de tamaño).
		k: 1,
		reloj: 0,
		imagenes: {},
		imagenesListas: false,
		instancias: [],
		plantas: [],
		lugares: new Array(LIMITES.lugaresDeVides).fill(false),
		floresComprometidas: 0,
		burbujas: [],
		sprites: [0, 2.1, 4.2].map(crearSpriteBurbuja),
		figura: Math.floor(Math.random() * 3)
	};
}

// Baja las seis piezas botánicas al entrar a la pantalla. Hasta que estén, Flores no cobra.
export function cargarImagenes(escena) {
	const pedidos = Object.entries(PIEZAS_PLANTA).map(
		([nombre, pieza]) =>
			new Promise((resolve, reject) => {
				const imagen = new Image();
				imagen.decoding = "async";
				imagen.onload = () => resolve([nombre, imagen]);
				imagen.onerror = reject;
				imagen.src = pieza.imagen;
			})
	);
	return Promise.all(pedidos)
		.then((imagenes) => {
			escena.imagenes = Object.fromEntries(imagenes);
			escena.imagenesListas = true;
		})
		.catch(() => {});
}

export function actualizar(escena, dt) {
	escena.reloj += dt;
	escena.instancias = escena.instancias.filter((instancia) => instancia.actualizar(dt));
	actualizarBurbujas(escena, dt);
	escena.plantas.forEach((planta) => actualizarPlanta(escena, planta));
}

export function hayMovimiento(escena) {
	return escena.instancias.length > 0 || escena.burbujas.length > 0 || escena.plantas.length > 0;
}

const ORDEN_PAISAJE = ["aurora", "constelacion", "estrellas", "fuegos", "flores"];

export function dibujar(escena, paisaje, luces) {
	const { k } = escena;
	for (const ctx of [paisaje, luces]) {
		ctx.setTransform(k, 0, 0, k, 0, 0);
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = "source-over";
		ctx.clearRect(0, 0, ANCHO, ALTO);
	}
	for (const tipo of ORDEN_PAISAJE) {
		for (const instancia of escena.instancias) {
			if (instancia.tipo === tipo && instancia.paisaje) {
				instancia.paisaje(paisaje);
				paisaje.setTransform(k, 0, 0, k, 0, 0);
				paisaje.globalAlpha = 1;
				paisaje.globalCompositeOperation = "source-over";
			}
		}
	}
	[...escena.plantas].sort((a, b) => a.y - b.y).forEach((planta) => dibujarPlanta(paisaje, escena, planta));
	dibujarBurbujas(paisaje, escena, "paisaje");
	for (const instancia of escena.instancias) {
		if (instancia.luces) {
			instancia.luces(luces);
			luces.globalAlpha = 1;
		}
	}
	dibujarBurbujas(luces, escena, "luces");
}

// ---------------------------------------------------------------------------------------------
// Flores: semillas que deja una ola de luz y enredaderas hechas por código.

const ANCHO_LUGAR = (ZONA_VIDES.x[1] - ZONA_VIDES.x[0]) / LIMITES.lugaresDeVides;

// Recorrido de un tallo como una tortuga: en cada paso el ángulo se acerca de a poco a un objetivo,
// así la curva queda suave (se dibuja como una sucesión de tramos cortos). Devuelve los puntos
// relativos a la base y dónde empieza el zarcillo (si tiene).
function crecerTallo({ angulo, largo, lado, rama = false, ondas = 1.5, amplitud = 0.5, zarcillo = false, peso = 0 }) {
	const paso = 7;
	const cantidad = Math.max(5, Math.round(largo / paso));
	const fase = azar(-0.25, 0.25);
	let a = angulo;
	let x = 0;
	let y = 0;
	const puntos = [{ x, y }];
	const tirón = rama ? azar(0.05, 0.1) : 0.3;
	for (let i = 1; i <= cantidad; i += 1) {
		const u = i / cantidad;
		// Tallo: primero sube, después se curva a un lado y vuelve hacia el otro. Rama: sale de costado
		// y la punta busca de a poco el cielo, inclinada hacia su lado libre.
		const objetivo = rama
			? -Math.PI / 2 + lado * 0.4
			: -Math.PI / 2 + lado * amplitud * Math.sin((u * ondas + fase) * Math.PI) * Math.min(1, u * 4);
		a += (objetivo - a) * tirón;
		x += Math.cos(a) * paso;
		y += Math.sin(a) * paso;
		// Una rama larga cede un poco bajo su propio peso.
		puntos.push({ x, y: y + peso * u * u });
	}
	let inicioZarcillo = null;
	if (zarcillo) {
		inicioZarcillo = puntos.length - 1;
		const giro = Math.random() < 0.5 ? -1 : 1;
		const vueltas = 16;
		let yZ = puntos[puntos.length - 1].y;
		for (let j = 0; j < vueltas; j += 1) {
			a += giro * (0.3 + j * 0.035);
			const largoPaso = 5.5 * (1 - (j / vueltas) * 0.6);
			x += Math.cos(a) * largoPaso;
			yZ += Math.sin(a) * largoPaso;
			puntos.push({ x, y: yZ });
		}
	}
	return { puntos, inicioZarcillo };
}

function angulo(puntos, indice) {
	const i = limitar(indice, 1, puntos.length - 1);
	const a = puntos[i - 1];
	const b = puntos[i];
	return Math.atan2(b.y - a.y, b.x - a.x);
}

function crearPlanta(escena, { x, y, lugar }, tSemilla) {
	const profundidad = (y - ZONA_VIDES.y[0]) / (ZONA_VIDES.y[1] - ZONA_VIDES.y[0]);
	const escala = 0.82 + 0.45 * profundidad;
	const ultimo = LIMITES.lugaresDeVides - 1;
	// Las de los costados se abren hacia adentro (no invaden la máquina ni salen de la zona).
	const ladoInicial = lugar === 0 ? 1 : lugar === ultimo ? -1 : elegir([-1, 1]);
	const tallos = [];
	const inicio = tSemilla + 0.6;

	function agregarTallo(opciones, datos) {
		const { puntos, inicioZarcillo } = crecerTallo(opciones);
		tallos.push({
			puntos,
			inicioZarcillo,
			largo: opciones.largo,
			ancho: datos.ancho,
			padre: datos.padre ?? -1,
			nodo: datos.nodo ?? 0,
			base: datos.base || { x: 0, y: 0 },
			inicio: datos.inicio ?? null,
			duracion: datos.duracion,
			hamaca: { amplitud: datos.hamaca || 0, frecuencia: azar(0.9, 1.4), fase: azar(0, TAU) }
		});
		return tallos.length - 1;
	}

	const principal = agregarTallo(
		{ angulo: -Math.PI / 2 + azar(-0.12, 0.12), largo: azar(150, 240) * escala, lado: ladoInicial, ondas: azar(1.2, 1.8), amplitud: azar(0.35, 0.6), zarcillo: Math.random() < 0.45 },
		{ ancho: 8.5 * escala, inicio, duracion: azar(2.4, 3.2) * DURACION_EFECTOS }
	);
	const troncos = [principal];
	if (Math.random() < 0.5) {
		troncos.push(
			agregarTallo(
				{ angulo: -Math.PI / 2 - ladoInicial * azar(0.15, 0.3), largo: tallos[principal].largo * azar(0.5, 0.7), lado: -ladoInicial, ondas: azar(1, 1.5), amplitud: azar(0.3, 0.5), zarcillo: Math.random() < 0.3 },
				{ ancho: 6.5 * escala, inicio: inicio + 0.45 * DURACION_EFECTOS, duracion: azar(1.8, 2.4) * DURACION_EFECTOS, base: { x: -ladoInicial * 10 * escala, y: 2 } }
			)
		);
	}

	// Ramas laterales: salen de nudos que el tallo ya alcanzó, alternando el lado.
	for (const tronco of troncos) {
		const { puntos, inicioZarcillo } = tallos[tronco];
		const fin = inicioZarcillo ?? puntos.length - 1;
		const cantidad = tronco === principal ? entero(LIMITES.ramasPorTallo[0], LIMITES.ramasPorTallo[1]) : entero(0, 1);
		let lado = -ladoInicial;
		for (let r = 0; r < cantidad; r += 1) {
			const u = cantidad === 1 ? azar(0.45, 0.7) : 0.35 + (0.45 * r) / (cantidad - 1) + azar(-0.04, 0.04);
			const nodo = Math.round(fin * u);
			const ladoRama = (lugar === 0 && lado < 0) || (lugar === ultimo && lado > 0) ? -lado : lado;
			const largo = azar(50, 110) * escala;
			agregarTallo(
				{ angulo: angulo(puntos, nodo) + ladoRama * azar(0.7, 1.1), largo, lado: ladoRama, rama: true, zarcillo: Math.random() < 0.25, peso: largo > 80 ? largo * 0.18 : 0 },
				{ ancho: 4.6 * escala, padre: tronco, nodo, duracion: azar(1.3, 1.9) * DURACION_EFECTOS, hamaca: largo > 80 ? 0.05 : 0.025 }
			);
			lado = -lado;
		}
	}

	// Hojas por código, alternando lados a lo largo de cada tallo.
	const hojas = [];
	tallos.forEach((tallo, indiceTallo) => {
		const fin = tallo.inicioZarcillo ?? tallo.puntos.length - 1;
		let lado = elegir([-1, 1]);
		for (let i = 3; i < fin - 2; i += entero(4, 6)) {
			hojas.push({ tallo: indiceTallo, indice: i, lado, largo: azar(18, 28) * escala * (1 - (0.35 * i) / fin), aparece: null });
			lado = -lado;
		}
	});

	// Piezas: brotes, pimpollos y flores en las puntas y en algunos nudos. Primero se piden las
	// flores de las puntas; si la escena ya llegó al tope de flores abiertas, quedan en pimpollo.
	const lugaresPieza = [];
	tallos.forEach((tallo, indiceTallo) => {
		const ultimoPunto = tallo.puntos.length - 1;
		if (tallo.inicioZarcillo !== null) {
			lugaresPieza.push({ tallo: indiceTallo, indice: Math.max(2, tallo.inicioZarcillo - 3), punta: false });
		} else {
			lugaresPieza.push({ tallo: indiceTallo, indice: ultimoPunto, punta: true });
		}
	});
	const nudos = Math.random() < 0.6 ? 2 : 1;
	for (let n = 0; n < nudos; n += 1) {
		const tallo = tallos[principal];
		const fin = tallo.inicioZarcillo ?? tallo.puntos.length - 1;
		lugaresPieza.push({ tallo: principal, indice: Math.round(fin * azar(0.3, 0.6)), punta: false });
	}
	const disponibles = Math.max(0, LIMITES.floresAbiertas - escena.floresComprometidas);
	let flores = 0;
	const piezas = lugaresPieza.map((lugarPieza, orden) => {
		let final;
		if (orden < tallos.length && Math.random() < 0.8) {
			final = "flor";
		} else {
			final = Math.random() < 0.5 ? "pimpollo" : "brote";
		}
		if (final === "flor") {
			if (flores < disponibles) {
				flores += 1;
				final = elegir(FLORES);
			} else {
				final = "pimpollo";
			}
		}
		const etapas = [["brote", 0]];
		if (final !== "brote") {
			etapas.push(["pimpollo", azar(0.6, 1) * DURACION_EFECTOS]);
		}
		if (final !== "brote" && final !== "pimpollo") {
			etapas.push([final, etapas[1][1] + azar(0.7, 1.3) * DURACION_EFECTOS]);
		}
		return {
			...lugarPieza,
			lado: elegir([-1, 1]),
			tamaño: lugarPieza.punta ? azar(0.9, 1.15) : azar(0.65, 0.85),
			etapas,
			demora: azar(0, 0.35) * DURACION_EFECTOS,
			aparece: null,
			fase: azar(0, TAU)
		};
	});
	escena.floresComprometidas += flores;

	return { x, y, lugar, escala, tSemilla, tallos, hojas, piezas, fase: azar(0, TAU), velocidad: azar(0.6, 0.85) };
}

function visibles(escena, tallo) {
	if (tallo.inicio === null) return 0;
	return suave((escena.reloj - tallo.inicio) / tallo.duracion) * (tallo.puntos.length - 1);
}

function actualizarPlanta(escena, planta) {
	const reloj = escena.reloj;
	planta.tallos.forEach((tallo) => {
		if (tallo.inicio === null && tallo.padre >= 0 && visibles(escena, planta.tallos[tallo.padre]) >= tallo.nodo) {
			tallo.inicio = reloj;
		}
	});
	for (const lista of [planta.hojas, planta.piezas]) {
		for (const elemento of lista) {
			if (elemento.aparece === null && visibles(escena, planta.tallos[elemento.tallo]) >= elemento.indice) {
				elemento.aparece = reloj + (elemento.demora || 0);
			}
		}
	}
}

// Posiciones absolutas de cada tallo (sin el vaivén de toda la planta). Las ramas parten del nudo de
// su tallo y se hamacan girando apenas alrededor de ese punto.
function posicionesDePlanta(escena, planta) {
	const resultado = [];
	planta.tallos.forEach((tallo, indice) => {
		let baseX = planta.x + tallo.base.x;
		let baseY = planta.y + tallo.base.y;
		if (tallo.padre >= 0) {
			const nudo = resultado[tallo.padre][tallo.nodo];
			baseX = nudo.x;
			baseY = nudo.y;
		}
		const giro = tallo.hamaca.amplitud * Math.sin(escena.reloj * tallo.hamaca.frecuencia + tallo.hamaca.fase);
		const cos = Math.cos(giro);
		const sin = Math.sin(giro);
		resultado[indice] = tallo.puntos.map(({ x, y }) => ({ x: baseX + x * cos - y * sin, y: baseY + x * sin + y * cos }));
	});
	return resultado;
}

function dibujarPlanta(ctx, escena, planta) {
	const t = escena.reloj;
	// Semilla luminosa: aparece cuando pasa la ola y se apaga cuando sale el tallo.
	const imagenes = escena.imagenes;
	const principal = planta.tallos[0];
	const desdeSemilla = t - planta.tSemilla;
	if (desdeSemilla > 0) {
		const alfa = Math.min(1, desdeSemilla / 0.3) * (1 - limitar((t - principal.inicio - 0.3) / 0.4, 0, 1));
		if (alfa > 0) {
			brillo(ctx, planta.x, planta.y - 6, 34 * planta.escala, "255,236,150", 0.55 * alfa * (0.8 + 0.2 * Math.sin(t * 6)));
			dibujarPieza(ctx, imagenes.semilla, PIEZAS_PLANTA.semilla, planta.x, planta.y, 0, planta.escala * (0.6 + 0.4 * alfa), alfa);
		}
	}
	if (t < principal.inicio) return;

	const posiciones = posicionesDePlanta(escena, planta);
	// Vaivén sutil de toda la planta: más arriba, más se mueve.
	const vaiven = Math.sin(t * planta.velocidad + planta.fase) * 5;
	const mover = ({ x, y }) => {
		const altura = limitar((planta.y - y) / 260, 0, 1.4);
		return { x: x + vaiven * altura * altura, y };
	};

	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	planta.tallos.forEach((tallo, indice) => {
		const cuantos = visibles(escena, tallo);
		if (cuantos <= 0) return;
		const puntos = posiciones[indice];
		const total = tallo.puntos.length - 1;
		const ultimo = Math.floor(cuantos);
		const visiblesTallo = puntos.slice(0, ultimo + 1).map(mover);
		if (ultimo < total) {
			// Punta que está creciendo: interpolada entre dos puntos.
			const fraccion = cuantos - ultimo;
			const a = puntos[ultimo];
			const b = puntos[ultimo + 1];
			visiblesTallo.push(mover({ x: a.x + (b.x - a.x) * fraccion, y: a.y + (b.y - a.y) * fraccion }));
		}
		// Tramos de a 3 puntos, cada uno más fino que el anterior; la punta en crecimiento, más fina.
		for (const [color, proporcion] of [["#3f8a35", 1], ["#86cf5e", 0.32]]) {
			ctx.strokeStyle = color;
			for (let i = 1; i < visiblesTallo.length; i += 3) {
				const fin = Math.min(visiblesTallo.length - 1, i + 3);
				const medio = (i + fin) / 2;
				const punta = Math.min(1, 0.35 + (cuantos - medio) / 5);
				ctx.lineWidth = Math.max(0.8, tallo.ancho * (1 - (0.7 * medio) / total) * punta * proporcion);
				ctx.beginPath();
				const desplazamiento = proporcion < 1 ? -tallo.ancho * 0.18 : 0;
				ctx.moveTo(visiblesTallo[i - 1].x + desplazamiento, visiblesTallo[i - 1].y);
				for (let j = i; j <= fin; j += 1) {
					ctx.lineTo(visiblesTallo[j].x + desplazamiento, visiblesTallo[j].y);
				}
				ctx.stroke();
			}
		}
	});

	// Hojas.
	for (const hoja of planta.hojas) {
		if (hoja.aparece === null || t < hoja.aparece) continue;
		const crecida = salida((t - hoja.aparece) / 0.5);
		const puntos = posiciones[hoja.tallo];
		const { x, y } = mover(puntos[hoja.indice]);
		const largo = hoja.largo * crecida;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angulo(puntos, hoja.indice) + hoja.lado * 0.95 + Math.sin(t * 1.3 + hoja.indice) * 0.05);
		ctx.fillStyle = "#58a843";
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.quadraticCurveTo(largo * 0.5, -largo * 0.4, largo, 0);
		ctx.quadraticCurveTo(largo * 0.5, largo * 0.4, 0, 0);
		ctx.fill();
		ctx.strokeStyle = "rgba(40,100,40,0.7)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(largo * 0.85, 0);
		ctx.stroke();
		ctx.restore();
	}

	// Brote → pimpollo → flor: escala y fundido cortos, anclados por la base.
	for (const pieza of planta.piezas) {
		if (pieza.aparece === null || t < pieza.aparece) continue;
		const transcurrido = t - pieza.aparece;
		const puntos = posiciones[pieza.tallo];
		const { x, y } = mover(puntos[pieza.indice]);
		const tangente = angulo(puntos, pieza.indice) + Math.PI / 2;
		const giro = pieza.punta ? limitar(tangente * 0.65, -0.9, 0.9) : limitar(tangente + pieza.lado * 0.55, -1.1, 1.1);
		const rotacion = giro + Math.sin(t * 1.3 + pieza.fase) * 0.035;
		let actual = 0;
		while (actual + 1 < pieza.etapas.length && transcurrido >= pieza.etapas[actual + 1][1]) actual += 1;
		const [tipo, desde] = pieza.etapas[actual];
		const progreso = (transcurrido - desde) / 0.35;
		const tamaño = planta.escala * pieza.tamaño;
		if (actual > 0 && progreso < 1) {
			const anterior = pieza.etapas[actual - 1][0];
			dibujarPieza(ctx, imagenes[anterior], PIEZAS_PLANTA[anterior], x, y, rotacion, tamaño, 1 - progreso);
		}
		const escalaPieza = actual === 0 ? salida(progreso) * (1 + 0.12 * Math.sin(limitar(progreso, 0, 1) * Math.PI)) : 0.75 + 0.25 * salida(progreso);
		dibujarPieza(ctx, imagenes[tipo], PIEZAS_PLANTA[tipo], x, y, rotacion, tamaño * escalaPieza, Math.min(1, progreso));
	}
}

function dibujarPieza(ctx, imagen, pieza, x, y, rotacion, escala, alfa) {
	if (!imagen || alfa <= 0 || escala <= 0) return;
	const ancho = pieza.ancho * escala;
	const alto = (ancho * imagen.naturalHeight) / imagen.naturalWidth;
	ctx.save();
	ctx.globalAlpha = limitar(alfa, 0, 1);
	ctx.translate(x, y);
	ctx.rotate(rotacion);
	ctx.drawImage(imagen, -ancho * pieza.pivote[0], -alto * pieza.pivote[1], ancho, alto);
	ctx.restore();
}

const flores = {
	puedeAgregar(escena) {
		if (!escena.imagenesListas) return "cargando";
		if (escena.floresComprometidas >= LIMITES.floresAbiertas || !escena.lugares.includes(false)) return "lleno";
		return "ok";
	},
	agregar(escena) {
		const libres = mezclar(escena.lugares.map((ocupado, lugar) => (ocupado ? null : lugar)).filter((lugar) => lugar !== null));
		const semillas = libres.slice(0, LIMITES.coloniasPorToque).map((lugar) => {
			escena.lugares[lugar] = true;
			return {
				lugar,
				x: ZONA_VIDES.x[0] + ANCHO_LUGAR * (lugar + 0.5) + azar(-0.2, 0.2) * ANCHO_LUGAR,
				y: azar(ZONA_VIDES.y[0] + 20, ZONA_VIDES.y[1] - 8)
			};
		});
		const [origenX, origenY] = INSTRUMENTOS.bocaTubo;
		const finOla = Math.max(...semillas.map(({ x }) => x)) + 90;
		const t0 = escena.reloj;
		const inicioOla = t0 + 1.3;
		const duracionOla = 1.7;
		for (const semilla of semillas) {
			const llegada = inicioOla + ((semilla.x - origenX) / (finOla - origenX)) * duracionOla;
			escena.plantas.push(crearPlanta(escena, semilla, llegada));
		}
		const [bandejaX, bandejaY] = INSTRUMENTOS.bandejaSemillas;
		escena.instancias.push({
			tipo: "flores",
			actualizar: () => escena.reloj - t0 < inicioOla - t0 + duracionOla + 0.8,
			luces(ctx) {
				const t = escena.reloj - t0;
				brillo(ctx, bandejaX, bandejaY, 75, "255,214,120", 0.8 * envolvente(t, 1.3, 0.25, 0.7));
				// Pulso cálido por el tubo de salida.
				const u = (t - 0.45) / 0.9;
				for (let j = 0; j < 6; j += 1) {
					const uj = u - j * 0.045;
					if (uj < 0 || uj > 1) continue;
					const [x, y] = bezier(INSTRUMENTOS.tuboSalida, uj);
					brillo(ctx, x, y, 24 - j * 2.5, "255,222,140", 0.9 * (1 - j / 6));
				}
			},
			paisaje(ctx) {
				// Ola suave por el césped: un frente de luz que va dejando las semillas.
				const u = (escena.reloj - inicioOla) / duracionOla;
				if (u <= 0 || u > 1.45) return;
				const apagado = u > 1 ? 1 - (u - 1) / 0.45 : 1;
				const frente = origenX + (finOla - origenX) * Math.min(u, 1);
				for (let s = 0; s < 16; s += 1) {
					const x = frente - s * 26;
					if (x < origenX) break;
					const alfa = (1 - s / 16) * apagado;
					for (const fila of [0, 1, 2]) {
						const y = origenY + 40 + fila * 75 + Math.sin(x / 60 + fila) * 10;
						brillo(ctx, x, y, 30, "255,238,165", 0.32 * alfa);
					}
				}
			}
		});
	}
};

// ---------------------------------------------------------------------------------------------
// Estrellas fugaces.

function estela(ctx, x, y, dx, dy, largo, ancho, rgb, alfa) {
	const colaX = x - dx * largo;
	const colaY = y - dy * largo;
	const gradiente = ctx.createLinearGradient(x, y, colaX, colaY);
	gradiente.addColorStop(0, `rgba(${rgb},${alfa})`);
	gradiente.addColorStop(1, `rgba(${rgb},0)`);
	ctx.fillStyle = gradiente;
	ctx.beginPath();
	ctx.moveTo(x - dy * ancho, y + dx * ancho);
	ctx.lineTo(colaX, colaY);
	ctx.lineTo(x + dy * ancho, y - dx * ancho);
	ctx.closePath();
	ctx.fill();
}

let usarAnteojo = true;

const estrellas = {
	puedeAgregar: (escena) => (activas(escena, "estrellas") < LIMITES.estrellasActivas ? "ok" : "lleno"),
	agregar(escena) {
		const t0 = escena.reloj;
		usarAnteojo = !usarAnteojo;
		const [origenX, origenY] = usarAnteojo ? INSTRUMENTOS.anteojo : INSTRUMENTOS.prisma;
		const cantidad = Math.max(2, Math.round(entero(LIMITES.estrellasPorToque[0], LIMITES.estrellasPorToque[1]) * (escena.reducido ? 0.7 : 1)));
		const lista = [];
		let inicio = 0.45;
		for (let i = 0; i < cantidad; i += 1) {
			const direccion = azar(2.62, 2.85);
			const dx = Math.cos(direccion);
			const dy = Math.sin(direccion);
			const x = azar(CIELO.x[0] + 420, CIELO.x[1]);
			const y = azar(CIELO.y[0], CIELO.y[0] + 200);
			// Que termine dentro del cielo, sin bajar a las colinas ni pasar sobre la máquina.
			const largo = Math.min(azar(380, 560), (x - CIELO.x[0]) / -dx, (CIELO.y[1] - 60 - y) / dy);
			lista.push({ x, y, dx, dy, largo, inicio, duracion: azar(0.9, 1.3) * DURACION_EFECTOS * (escena.reducido ? 1.4 : 1) });
			inicio += azar(0.25, 0.45) * DURACION_EFECTOS;
		}
		const fin = Math.max(...lista.map((estrella) => estrella.inicio + estrella.duracion)) + 0.1;
		escena.instancias.push({
			tipo: "estrellas",
			actualizar: () => escena.reloj - t0 < fin,
			luces(ctx) {
				brillo(ctx, origenX, origenY, 60, "255,250,215", 0.85 * envolvente(escena.reloj - t0, 0.7, 0.15, 0.5));
			},
			paisaje(ctx) {
				const t = escena.reloj - t0;
				for (const estrella of lista) {
					const u = (t - estrella.inicio) / estrella.duracion;
					if (u <= 0 || u >= 1) continue;
					const avance = estrella.largo * (0.15 * u + 0.85 * u * u * (3 - 2 * u));
					const x = estrella.x + estrella.dx * avance;
					const y = estrella.y + estrella.dy * avance;
					const alfa = Math.min(1, u * 5, (1 - u) * 4);
					estela(ctx, x, y, estrella.dx, estrella.dy, 170 * Math.min(1, u * 3), 4.5, "235,240,255", 0.85 * alfa);
					brillo(ctx, x, y, 16, "255,255,235", 0.9 * alfa);
					punto(ctx, x, y, 2.6, `rgba(255,255,255,${alfa})`);
				}
			}
		});
	}
};

// ---------------------------------------------------------------------------------------------
// Burbujas arcoíris.

function actualizarBurbujas(escena, dt) {
	for (const burbuja of escena.burbujas) {
		burbuja.edad += dt;
		if (burbuja.estalla !== null) {
			burbuja.estalla += dt;
			continue;
		}
		burbuja.x += (burbuja.vx + Math.sin(burbuja.edad * 1.4 + burbuja.fase) * 14) * dt;
		burbuja.vx *= 1 - 0.6 * dt;
		burbuja.y += burbuja.vy * dt;
		if (burbuja.edad > burbuja.vida || burbuja.y < 30 + burbuja.radio) {
			burbuja.estalla = 0;
		}
	}
	escena.burbujas = escena.burbujas.filter((burbuja) => burbuja.estalla === null || burbuja.estalla < 0.4);
}

function dibujarBurbujas(ctx, escena, capa) {
	ctx.lineWidth = 2;
	for (const burbuja of escena.burbujas) {
		if (burbuja.capa !== capa) continue;
		const { x, y, radio } = burbuja;
		if (burbuja.estalla !== null) {
			// Revienta en un aro suave que se agranda y se apaga.
			const u = burbuja.estalla / 0.4;
			ctx.globalAlpha = 1;
			ctx.strokeStyle = `rgba(255,255,255,${0.65 * (1 - u)})`;
			ctx.beginPath();
			ctx.arc(x, y, radio * (1 + u * 0.7), 0, TAU);
			ctx.stroke();
			continue;
		}
		ctx.globalAlpha = Math.min(1, burbuja.edad / 0.3);
		ctx.drawImage(burbuja.sprite, x - radio, y - radio, radio * 2, radio * 2);
	}
	ctx.globalAlpha = 1;
}

function soltarTanda(escena, puntosDelPasto) {
	const globo = INSTRUMENTOS.globoBurbuja;
	const [tuboX, tuboY] = INSTRUMENTOS.bocaTubo;
	const fuentes = [
		{ x: globo.x, y: globo.y - globo.ry * 0.9, capa: "luces", vx: [-25, 70] },
		{ x: tuboX, y: tuboY - 10, capa: "luces", vx: [0, 90] },
		...puntosDelPasto.map(({ x, y }) => ({ x, y, capa: "paisaje", vx: [-60, 60] }))
	];
	const cantidad = Math.round(LIMITES.burbujasPorTanda * escena.factor);
	for (let i = 0; i < cantidad && escena.burbujas.length < LIMITES.burbujasVivas; i += 1) {
		const fuente = fuentes[i % fuentes.length];
		const tamaño = Math.random();
		// Muchas chicas y pocas grandes, para que se siga viendo lo de atrás.
		const radio = tamaño < 0.84 ? azar(5, 16) : tamaño < 0.96 ? azar(18, 32) : azar(36, 58);
		escena.burbujas.push({
			x: fuente.x + azar(-24, 24),
			y: fuente.y + azar(-12, 12),
			radio,
			vx: azar(fuente.vx[0], fuente.vx[1]),
			vy: (-azar(45, 95) * (radio > 30 ? 0.6 : 1) * (escena.reducido ? 0.7 : 1)) / Math.sqrt(DURACION_EFECTOS),
			edad: -azar(0, 0.5),
			vida: azar(4.5, 8) * DURACION_EFECTOS,
			fase: azar(0, TAU),
			sprite: elegir(escena.sprites),
			capa: fuente.capa,
			estalla: null
		});
	}
}

const burbujas = {
	puedeAgregar: (escena) =>
		activas(escena, "burbujas") < LIMITES.burbujasActivas && escena.burbujas.length < LIMITES.burbujasVivas * 0.7 ? "ok" : "lleno",
	agregar(escena) {
		const t0 = escena.reloj;
		const globo = INSTRUMENTOS.globoBurbuja;
		const internas = [];
		let nacidas = 0;
		let tandas = 0;
		const totalTandas = LIMITES.tandasDeBurbujas;
		const puntosDelPasto = [0, 1, 2].map(() => ({ x: azar(950, 1780), y: azar(880, 1010) }));
		escena.instancias.push({
			tipo: "burbujas",
			actualizar(dt) {
				const t = escena.reloj - t0;
				// Primero, burbujitas dentro del globo que suben, crecen y se juntan.
				while (nacidas < 14 && t > nacidas * 0.08) {
					internas.push({ x: globo.x + azar(-0.5, 0.5) * globo.rx, y: globo.y + globo.ry * 0.65, radio: azar(3, 6), vy: azar(28, 55), fase: azar(0, TAU), sprite: elegir(escena.sprites) });
					nacidas += 1;
				}
				for (const burbuja of internas) {
					burbuja.y -= burbuja.vy * dt;
					burbuja.radio += 4 * dt;
					burbuja.x += Math.sin(t * 3 + burbuja.fase) * 12 * dt;
				}
				for (let i = 0; i < internas.length; i += 1) {
					for (let j = internas.length - 1; j > i; j -= 1) {
						const a = internas[i];
						const b = internas[j];
						if (Math.hypot(a.x - b.x, a.y - b.y) < (a.radio + b.radio) * 0.75) {
							a.radio = Math.hypot(a.radio, b.radio);
							internas.splice(j, 1);
						}
					}
				}
				for (let i = internas.length - 1; i >= 0; i -= 1) {
					if (internas[i].y < globo.y - globo.ry * 0.6) internas.splice(i, 1);
				}
				// Después, tandas de burbujas desde la máquina y desde el pasto.
				while (tandas < totalTandas && t >= 1.1 + tandas * 0.75 * DURACION_EFECTOS) {
					soltarTanda(escena, puntosDelPasto);
					tandas += 1;
				}
				return t < 2.6 || tandas < totalTandas;
			},
			luces(ctx) {
				const t = escena.reloj - t0;
				const alfa = envolvente(t, 2.6, 0.3, 0.8);
				dentroDe(ctx, globo, () => {
					brillo(ctx, globo.x, globo.y + globo.ry * 0.3, globo.rx, "255,240,205", 0.4 * alfa);
					ctx.globalAlpha = alfa;
					for (const burbuja of internas) {
						ctx.drawImage(burbuja.sprite, burbuja.x - burbuja.radio, burbuja.y - burbuja.radio, burbuja.radio * 2, burbuja.radio * 2);
					}
					ctx.globalAlpha = 1;
				});
			}
		});
	}
};

// ---------------------------------------------------------------------------------------------
// Aurora de colores.

const COLORES_AURORA = ["130,255,205", "130,205,255", "205,155,255"];

const aurora = {
	puedeAgregar: (escena) => (activas(escena, "aurora") < LIMITES.auroraActivas ? "ok" : "lleno"),
	agregar(escena) {
		const t0 = escena.reloj;
		const globo = INSTRUMENTOS.globoAurora;
		const [prismaX, prismaY] = INSTRUMENTOS.prisma;
		const cantidad = entero(LIMITES.cintasDeAurora[0], LIMITES.cintasDeAurora[1]);
		const colores = mezclar(COLORES_AURORA);
		const cintas = Array.from({ length: cantidad }, (_, i) => ({
			color: colores[i % colores.length],
			base: CIELO.y[0] + 60 + i * 85 + azar(-20, 20),
			amplitud: azar(25, 50),
			frecuencia: azar(0.0025, 0.0042),
			velocidad: azar(0.25, 0.45) * (escena.reducido ? 0.6 : 1),
			fase: azar(0, TAU),
			alto: azar(80, 135),
			alfa: azar(0.75, 0.95),
			desde: CIELO.x[0] + azar(20, 140),
			hasta: CIELO.x[1] - azar(0, 120)
		}));
		const inicioCintas = 1.2;
		const duracionCintas = 9.8 * DURACION_EFECTOS;
		escena.instancias.push({
			tipo: "aurora",
			actualizar: () => escena.reloj - t0 < inicioCintas + duracionCintas,
			luces(ctx) {
				const t = escena.reloj - t0;
				const alfa = envolvente(t, 2.6, 0.4, 1);
				if (alfa <= 0) return;
				brillo(ctx, prismaX, prismaY, 50, "235,220,255", 0.5 * alfa);
				dentroDe(ctx, globo, () => {
					brillo(ctx, globo.x, globo.y, globo.rx * 1.2, "150,255,220", 0.35 * alfa);
					ctx.lineWidth = 7;
					ctx.lineCap = "round";
					COLORES_AURORA.forEach((color, j) => {
						ctx.strokeStyle = `rgba(${color},${0.6 * alfa})`;
						ctx.beginPath();
						for (let s = 0; s <= 20; s += 1) {
							const x = globo.x - globo.rx + (s * 2 * globo.rx) / 20;
							const y = globo.y + (j - 1) * globo.ry * 0.38 + Math.sin(s * 0.6 + t * 3 + j) * globo.ry * 0.18;
							if (s === 0) ctx.moveTo(x, y);
							else ctx.lineTo(x, y);
						}
						ctx.stroke();
					});
				});
			},
			paisaje(ctx) {
				const t = escena.reloj - t0 - inicioCintas;
				const general = envolvente(t, duracionCintas, 1.8 * 1.5, 2.4 * 1.5);
				if (general <= 0) return;
				const { k } = escena;
				const reloj = escena.reloj;
				const altoBase = 100;
				// Franjas verticales de ~8 px lógicos, cada una con el mismo degradado estirado a su alto:
				// así se ve la cortina con sus rayos. Los bordes de cada franja caen en píxeles enteros del
				// lienzo, para que no se pisen ni quede una rayita entre dos.
				const paso = Math.max(1, Math.round(8 * k));
				ctx.globalCompositeOperation = "screen";
				for (const cinta of cintas) {
					const gradiente = ctx.createLinearGradient(0, -altoBase, 0, 16);
					gradiente.addColorStop(0, `rgba(${cinta.color},0)`);
					gradiente.addColorStop(0.5, `rgba(${cinta.color},0.25)`);
					gradiente.addColorStop(0.86, `rgba(${cinta.color},0.7)`);
					gradiente.addColorStop(1, `rgba(${cinta.color},0)`);
					ctx.fillStyle = gradiente;
					const desde = Math.round(cinta.desde * k);
					const hasta = Math.round(cinta.hasta * k);
					for (let px = desde; px < hasta; px += paso) {
						const x = (px + paso / 2) / k;
						const borde = suave((x - cinta.desde) / 260) * suave((cinta.hasta - x) / 260);
						const y = cinta.base + cinta.amplitud * Math.sin(x * cinta.frecuencia + reloj * cinta.velocidad + cinta.fase) + cinta.amplitud * 0.35 * Math.sin(x * cinta.frecuencia * 2.3 - reloj * cinta.velocidad * 0.7);
						const alto = cinta.alto * (0.72 + 0.28 * Math.sin(x * 0.019 + reloj * 0.8 + cinta.fase));
						// Rayos: el brillo de cada franja varía despacio a lo largo de la cinta.
						const rayos = 0.7 + 0.3 * Math.sin(x * 0.11 + Math.sin(x * 0.023 + reloj * 0.6) * 2);
						ctx.globalAlpha = borde * general * cinta.alfa * rayos;
						ctx.setTransform(1, 0, 0, (k * alto) / altoBase, 0, k * y);
						ctx.fillRect(px, -altoBase, Math.min(paso, hasta - px), altoBase + 16);
					}
				}
			}
		});
	}
};

// ---------------------------------------------------------------------------------------------
// Constelación sorpresa: figuras como vértices y segmentos (no imágenes).

const FIGURAS = [
	{
		nombre: "estrella",
		vertices: [0, 1, 2, 3, 4].map((i) => [Math.cos(-Math.PI / 2 + (i * TAU) / 5), Math.sin(-Math.PI / 2 + (i * TAU) / 5)]),
		segmentos: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]]
	},
	{
		nombre: "mariposa",
		vertices: [[0, -0.7], [0, 0.65], [-0.95, -0.75], [-0.45, 0], [-0.75, 0.7], [0.95, -0.75], [0.45, 0], [0.75, 0.7], [-0.3, -1.05], [0.3, -1.05]],
		segmentos: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 1], [0, 5], [5, 6], [6, 7], [7, 1], [0, 8], [0, 9]]
	},
	{
		nombre: "corazón",
		vertices: [[0, -0.45], [-0.5, -0.95], [-1, -0.5], [-0.8, 0.15], [0, 0.95], [0.8, 0.15], [1, -0.5], [0.5, -0.95]],
		segmentos: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]]
	}
];

const constelacion = {
	puedeAgregar: (escena) => (activas(escena, "constelacion") < LIMITES.constelacionActivas ? "ok" : "lleno"),
	agregar(escena) {
		const t0 = escena.reloj;
		const lente = INSTRUMENTOS.lenteConstelacion;
		const figura = FIGURAS[escena.figura % FIGURAS.length];
		escena.figura += 1;
		const tamaño = azar(120, 150);
		// Lejos de otras constelaciones que todavía se ven.
		const otras = escena.instancias.filter((instancia) => instancia.tipo === "constelacion").map((instancia) => instancia.centro);
		let centro = null;
		let mejor = -1;
		for (let intento = 0; intento < 10; intento += 1) {
			const candidato = [azar(CIELO.x[0] + 260, CIELO.x[1] - 160), azar(CIELO.y[0] + 150, CIELO.y[1] - 170)];
			const distancia = otras.length ? Math.min(...otras.map(([x, y]) => Math.hypot(x - candidato[0], y - candidato[1]))) : 1;
			if (distancia > mejor) {
				mejor = distancia;
				centro = candidato;
			}
		}
		const giro = azar(-0.2, 0.2);
		const vertices = figura.vertices.map(([x, y]) => [
			centro[0] + (x * Math.cos(giro) - y * Math.sin(giro)) * tamaño,
			centro[1] + (x * Math.sin(giro) + y * Math.cos(giro)) * tamaño
		]);
		const inicio = 1;
		const porSegmento = 0.42 * 1.5;
		// Cada vértice aparece la primera vez que lo usa un segmento.
		const aparece = new Array(vertices.length).fill(Infinity);
		figura.segmentos.forEach(([a, b], j) => {
			const desde = inicio + j * porSegmento;
			aparece[a] = Math.min(aparece[a], desde);
			aparece[b] = Math.min(aparece[b], desde + porSegmento * 0.85);
		});
		const completa = inicio + figura.segmentos.length * porSegmento;
		// Se mantiene legible el tiempo que haga falta para durar DURACION_EFECTOS veces el diseño original.
		const apagado = 1.6 * 1.5;
		const total = Math.max(completa + 3.5 + apagado, DURACION_EFECTOS * (inicio + figura.segmentos.length * 0.42 + 3.5 + 1.6));
		const chispitas = Array.from({ length: 7 }, () => {
			const a = azar(0, TAU);
			const r = Math.sqrt(Math.random()) * 0.8;
			return { x: lente.x + Math.cos(a) * lente.rx * r, y: lente.y + Math.sin(a) * lente.ry * r, fase: azar(0, TAU) };
		});
		escena.instancias.push({
			tipo: "constelacion",
			centro,
			actualizar: () => escena.reloj - t0 < total,
			luces(ctx) {
				const t = escena.reloj - t0;
				const alfa = envolvente(t, 1.8, 0.3, 0.6);
				if (alfa <= 0) return;
				dentroDe(ctx, lente, () => {
					brillo(ctx, lente.x, lente.y, lente.rx * 1.3, "190,150,255", 0.4 * alfa);
					for (const chispa of chispitas) {
						const titila = 0.5 + 0.5 * Math.sin(t * 9 + chispa.fase);
						brillo(ctx, chispa.x, chispa.y, 9, "255,245,255", alfa * titila);
					}
				});
			},
			paisaje(ctx) {
				const t = escena.reloj - t0;
				const general = Math.min(1, (total - t) / apagado);
				if (t < inicio || general <= 0) return;
				ctx.lineCap = "round";
				figura.segmentos.forEach(([a, b], j) => {
					const u = (t - inicio - j * porSegmento) / (porSegmento * 0.85);
					if (u <= 0) return;
					const avance = salida(u);
					const [x1, y1] = vertices[a];
					const x2 = x1 + (vertices[b][0] - x1) * avance;
					const y2 = y1 + (vertices[b][1] - y1) * avance;
					for (const [ancho, alfa] of [[7, 0.15], [2.2, 0.8]]) {
						ctx.strokeStyle = `rgba(225,215,255,${alfa * general})`;
						ctx.lineWidth = ancho;
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
					}
				});
				vertices.forEach(([x, y], i) => {
					const u = (t - aparece[i]) / 0.3;
					if (u <= 0) return;
					const titila = 0.85 + 0.15 * Math.sin(t * 4 + i);
					brillo(ctx, x, y, 16 * (1 + 0.3 * Math.max(0, 1 - u)), "245,235,255", general * titila * Math.min(1, u));
					punto(ctx, x, y, 3.2, `rgba(255,255,255,${general * Math.min(1, u)})`);
				});
			}
		});
	}
};

// ---------------------------------------------------------------------------------------------
// Fuegos de luz: chispa desde el anteojo y flores de luz suaves (sin parpadeos bruscos).

// Colores vivos de los fuegos. Cada flor de luz es de un estilo: arcoíris (el color sigue el ángulo),
// doble (afuera un color y adentro otro) o confeti (cada chispa de un color).
const ARCOIRIS = ["255,70,110", "255,150,40", "255,225,50", "90,235,110", "50,205,255", "120,120,255", "215,90,255"];
const ESTILOS_FUEGOS = ["arcoiris", "doble", "confeti"];

function colorDeChispa(fuego, indice, total, capa) {
	if (fuego.estilo === "arcoiris") return ARCOIRIS[Math.floor((indice / total) * ARCOIRIS.length) % ARCOIRIS.length];
	if (fuego.estilo === "doble") return capa === 0 ? fuego.colores[0] : fuego.colores[1];
	return elegir(ARCOIRIS);
}

const fuegos = {
	puedeAgregar: (escena) => (activas(escena, "fuegos") < LIMITES.fuegosActivos ? "ok" : "lleno"),
	agregar(escena) {
		const t0 = escena.reloj;
		const D = DURACION_EFECTOS;
		const [lenteX, lenteY] = INSTRUMENTOS.anteojo;
		const cantidad = entero(LIMITES.fuegosPorToque[0], LIMITES.fuegosPorToque[1]);
		const franjas = mezclar([0, 1, 2]);
		const estilos = mezclar(ESTILOS_FUEGOS);
		const lista = Array.from({ length: cantidad }, (_, i) => {
			const [primero, segundo] = mezclar(ARCOIRIS);
			return {
				salida: i * 0.85 * D,
				x: azar(900, 1750),
				y: CIELO.y[0] + 70 + franjas[i] * 95 + azar(-25, 25),
				estilo: estilos[i % estilos.length],
				colores: [primero, segundo],
				curva: elegir([-1, 1]) * azar(0.3, 0.8),
				chispas: null,
				puntitos: []
			};
		});
		const vuelo = 1;
		const vidaChispa = [1.8 * D, 2.4 * D];
		const fin = lista[lista.length - 1].salida + vuelo + 2.8 * D;
		escena.instancias.push({
			tipo: "fuegos",
			actualizar(dt) {
				const t = escena.reloj - t0;
				for (const fuego of lista) {
					const desde = t - fuego.salida - vuelo;
					if (desde < 0) continue;
					if (!fuego.chispas) {
						// Dos capas: la de afuera más rápida y una de adentro más chica.
						const total = Math.round(LIMITES.chispasPorFuego * escena.factor);
						fuego.chispas = [];
						[[total, [230, 320]], [Math.round(total * 0.6), [120, 170]]].forEach(([cuantas, [minima, maxima]], capa) => {
							for (let i = 0; i < cuantas; i += 1) {
								const a = (i / cuantas) * TAU + azar(-0.06, 0.06) + capa * 0.2;
								const velocidad = azar(minima, maxima);
								fuego.chispas.push({ x: fuego.x, y: fuego.y, vx: Math.cos(a) * velocidad, vy: Math.sin(a) * velocidad, rastro: [], vida: azar(vidaChispa[0], vidaChispa[1]) * (capa ? 0.8 : 1), color: colorDeChispa(fuego, i, cuantas, capa) });
							}
						});
					}
					const giroCos = Math.cos(fuego.curva * dt);
					const giroSin = Math.sin(fuego.curva * dt);
					const freno = Math.exp(-1.5 * dt);
					for (const chispa of fuego.chispas) {
						// Radios curvos: la velocidad gira apenas, se frena y cae despacio.
						const vx = chispa.vx * giroCos - chispa.vy * giroSin;
						const vy = chispa.vx * giroSin + chispa.vy * giroCos;
						chispa.vx = vx * freno;
						chispa.vy = vy * freno + 35 * dt;
						chispa.x += chispa.vx * dt;
						chispa.y += chispa.vy * dt;
						chispa.rastro.push([chispa.x, chispa.y]);
						if (chispa.rastro.length > 12) chispa.rastro.shift();
					}
					if (desde > 0.6 * D && fuego.puntitos.length === 0) {
						fuego.puntitos = fuego.chispas
							.filter((_, i) => i % 2 === 0)
							.map((chispa) => ({ x: chispa.x, y: chispa.y, vy: azar(18, 40), edad: 0, vida: azar(1.4, 2.1) * D, fase: azar(0, TAU), color: chispa.color }));
					}
					for (const puntito of fuego.puntitos) {
						puntito.edad += dt;
						puntito.y += puntito.vy * dt;
					}
				}
				return t < fin;
			},
			luces(ctx) {
				const t = escena.reloj - t0;
				for (const fuego of lista) {
					brillo(ctx, lenteX, lenteY, 46, fuego.colores[0], 0.8 * envolvente(t - fuego.salida, 0.6, 0.12, 0.45));
				}
			},
			paisaje(ctx) {
				const t = escena.reloj - t0;
				ctx.lineCap = "round";
				for (const fuego of lista) {
					const u = (t - fuego.salida) / vuelo;
					if (u > 0 && u < 1) {
						// Chispa que sube desde el anteojo, con rastro del color del fuego.
						for (let j = 0; j < 9; j += 1) {
							const uj = salida(u - j * 0.03);
							if (u - j * 0.03 < 0) break;
							const v = 1 - uj;
							const x = v * v * lenteX + 2 * v * uj * (lenteX + 60) + uj * uj * fuego.x;
							const y = v * v * lenteY + 2 * v * uj * fuego.y + uj * uj * fuego.y;
							brillo(ctx, x, y, 14 - j, j === 0 ? "255,250,230" : fuego.colores[0], 0.85 * (1 - j / 9));
						}
					}
					const desde = t - fuego.salida - vuelo;
					if (desde < 0 || !fuego.chispas) continue;
					// Brillo suave del centro (sin destello brusco).
					brillo(ctx, fuego.x, fuego.y, 70 + desde * 80, fuego.colores[0], 0.3 * Math.max(0, 1 - desde / 0.9));
					for (const chispa of fuego.chispas) {
						const vida = 1 - desde / chispa.vida;
						if (vida <= 0 || chispa.rastro.length < 2) continue;
						const alfa = Math.min(1, vida * 1.6);
						ctx.strokeStyle = `rgba(${chispa.color},${0.85 * alfa})`;
						ctx.lineWidth = 3.4;
						ctx.beginPath();
						chispa.rastro.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
						ctx.stroke();
						const [x, y] = chispa.rastro[chispa.rastro.length - 1];
						brillo(ctx, x, y, 13, chispa.color, 0.7 * alfa);
						punto(ctx, x, y, 2.8, `rgba(255,255,245,${0.9 * alfa})`);
					}
					for (const puntito of fuego.puntitos) {
						const vida = 1 - puntito.edad / puntito.vida;
						if (vida <= 0) continue;
						const titila = 0.6 + 0.4 * Math.sin(puntito.edad * 7 + puntito.fase);
						brillo(ctx, puntito.x, puntito.y, 10, puntito.color, 0.95 * vida * titila);
					}
				}
			}
		});
	}
};

// Cada botón: puedeAgregar(escena) → "ok" | "lleno" | "cargando" (antes de cobrar) y agregar(escena).
export const EFECTOS = { flores, estrellas, burbujas, aurora, constelacion, fuegos };
