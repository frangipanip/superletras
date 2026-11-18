import { ACTIVIDADES_SOLO_ESTRELLAS, CLAVE_ESTRELLAS, COMIDA_POR_ACTIVIDAD, COMIDA_POR_CLAVE, comidasDelMonstruo, LETRAS, LETRAS_POR_MUNDO, premioPorErrores, repartirGasto, repartirPremio } from "../../shared/comidas.js";
import { marcarCompletada } from "./progreso";
import { STORAGE_KEYS, readStorage, writeStorage } from "./storage";

// Comidas ganadas en las actividades, por letra. La fuente de verdad es la API (SQLite);
// acá se guarda una copia en localStorage y una cola de eventos sin enviar, así la app
// sigue sumando sin conexión y lo manda cuando puede. Cada dispositivo se identifica con
// un código que genera la API la primera vez (se puede copiar y pegar en otro dispositivo).
// Lo leen los componentes con useSyncExternalStore (subscribeRecompensas / getRecompensas).

function leerJson(key, fallback) {
	try {
		return JSON.parse(readStorage(key)) || fallback;
	} catch {
		return fallback;
	}
}

let state = {
	codigo: readStorage(STORAGE_KEYS.codigo),
	// { a: { cerezas: { ganadas, dadas }, ... }, l: { ... } }
	letras: leerJson(STORAGE_KEYS.comidas, {})
};
let pendientes = leerJson(STORAGE_KEYS.comidasPendientes, []);

// Id de este navegador, guardado apenas abre la app: la API devuelve siempre el mismo código
// para el mismo id, así recargar a mitad del pedido no crea otro usuario.
const dispositivo = readStorage(STORAGE_KEYS.dispositivo) || nuevoId();
writeStorage(STORAGE_KEYS.dispositivo, dispositivo);
let sincronizando = null;
const listeners = new Set();

function setState(changes) {
	state = { ...state, ...changes };
	if (changes.codigo) {
		writeStorage(STORAGE_KEYS.codigo, state.codigo);
	}
	writeStorage(STORAGE_KEYS.comidas, JSON.stringify(state.letras));
	listeners.forEach((listener) => listener());
}

function guardarPendientes() {
	writeStorage(STORAGE_KEYS.comidasPendientes, JSON.stringify(pendientes));
}

export function subscribeRecompensas(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getRecompensas() {
	return state;
}

export function cantidadComida(letras, letra, clave) {
	return letras[letra]?.[clave] || { ganadas: 0, dadas: 0 };
}

// Comidas que el monstruo de la letra pide ahora (sílabas o, ya evolucionado en Mundo 1, palabras).
export function comidasPedidas(letras, letra) {
	return comidasDelMonstruo(letra, (clave) => cantidadComida(letras, letra, clave));
}

// Saldo de estrellas del mundo (Laboratorio de Luces): lo ganado menos lo gastado en todas sus letras.
// Es el mismo para cualquier letra del mundo y nunca mezcla mundos.
export function estrellasDelMundo(letras, mundo) {
	return (LETRAS_POR_MUNDO[mundo] || []).reduce((total, letra) => {
		const { ganadas, dadas } = cantidadComida(letras, letra, CLAVE_ESTRELLAS);
		return total + Math.max(0, ganadas - dadas);
	}, 0);
}

// Total de comidas ganadas que todavía no se le dieron al monstruo de la letra (todas las comidas
// que pide ahora, sumadas). Si hay alguna, el monstruo brilla y muestra este número en un contador
// rojo, en el menú de Mundo 1 y en el selector de /monstruo, para que se note que lo están esperando.
export function comidaParaDar(letras, letra) {
	return comidasPedidas(letras, letra).reduce((total, { clave }) => {
		const { ganadas, dadas } = cantidadComida(letras, letra, clave);
		return total + Math.max(0, ganadas - dadas);
	}, 0);
}

function nuevoId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function sumarALetra(letra, clave, cambios) {
	const actual = cantidadComida(state.letras, letra, clave);
	const siguiente = { ganadas: actual.ganadas + (cambios.ganadas || 0), dadas: actual.dadas + (cambios.dadas || 0) };
	setState({
		letras: { ...state.letras, [letra]: { ...state.letras[letra], [clave]: siguiente } }
	});
}

// Misma cuenta que hace la API (server/index.js): el premio da la comida que le falta a la
// actividad o, si ya las tiene todas, estrellas (repartirPremio); solo se le puede dar al monstruo
// lo que se ganó. Devuelve { comida, estrellas } (lo que se sumó).
function aplicarLocal(evento) {
	if (evento.tipo === "gastar") {
		const reparto = repartirGasto(evento.mundo, evento.cantidad, (letra) => cantidadComida(state.letras, letra, CLAVE_ESTRELLAS));
		if (!reparto) {
			return null;
		}
		// Todo en un solo cambio de estado: nadie ve el saldo a medio descontar.
		const letras = { ...state.letras };
		for (const [letra, descuento] of reparto) {
			const actual = cantidadComida(letras, letra, CLAVE_ESTRELLAS);
			letras[letra] = { ...letras[letra], [CLAVE_ESTRELLAS]: { ganadas: actual.ganadas, dadas: actual.dadas + descuento } };
		}
		setState({ letras });
		return reparto;
	}
	if (evento.tipo === "premio") {
		const comida = COMIDA_POR_ACTIVIDAD[evento.actividad];
		const ganadas = comida ? cantidadComida(state.letras, evento.letra, comida.clave).ganadas : 0;
		const premio = repartirPremio(comida, ganadas, premioPorErrores(evento.actividad, evento.errores, evento.cantidad));
		if (premio.comida > 0) {
			sumarALetra(evento.letra, comida.clave, { ganadas: premio.comida });
		}
		if (premio.estrellas > 0) {
			sumarALetra(evento.letra, CLAVE_ESTRELLAS, { ganadas: premio.estrellas });
		}
		return premio;
	}
	const comida = COMIDA_POR_CLAVE[evento.comida];
	const actual = cantidadComida(state.letras, evento.letra, comida.clave);
	const cantidad = actual.dadas < actual.ganadas ? 1 : 0;
	if (cantidad > 0) {
		sumarALetra(evento.letra, comida.clave, { dadas: 1 });
	}
	return { comida: cantidad, estrellas: 0 };
}

function encolar(evento) {
	pendientes = [...pendientes, evento];
	guardarPendientes();
	sincronizar();
}

// Al completar una actividad. Devuelve { comida, cantidad, score }: la comida que se ganó o, si la
// actividad ya tenía todas (o no da comida), PREMIO_ESTRELLAS con las estrellas ganadas.
const PREMIO_ESTRELLAS = { clave: CLAVE_ESTRELLAS, nombre: "Estrellas", emoji: "⭐" };

export function otorgarPremio(letra, actividad, errores = 0, cantidadSolicitada) {
	if (!letra) {
		return null;
	}
	const score = premioPorErrores(actividad, errores, cantidadSolicitada);
	// Completar la actividad se anota aunque el monstruo ya no necesite esa comida.
	marcarCompletada(letra, actividad, score);
	const comida = COMIDA_POR_ACTIVIDAD[actividad];
	if (!LETRAS.includes(letra) || (!comida && !ACTIVIDADES_SOLO_ESTRELLAS.includes(actividad))) {
		// Sin monstruo para la letra (LETRAS) o actividad sin comida: estrellas que no se guardan en
		// la API.
		return { id: nuevoId(), comida: PREMIO_ESTRELLAS, cantidad: 0, score };
	}
	const evento = { id: nuevoId(), tipo: "premio", letra, actividad, errores, codigo: state.codigo };
	if (cantidadSolicitada !== undefined) {
		evento.cantidad = cantidadSolicitada;
	}
	const premio = aplicarLocal(evento);
	if (premio.comida > 0 || premio.estrellas > 0) {
		encolar(evento);
	}
	if (premio.estrellas > 0 || !comida) {
		return { id: evento.id, comida: PREMIO_ESTRELLAS, cantidad: premio.estrellas, score };
	}
	return { id: evento.id, comida, cantidad: premio.comida, score };
}

// Le da una unidad de comida al monstruo de la letra. Devuelve false si no quedaba.
export function darComida(letra, clave) {
	const evento = { id: nuevoId(), tipo: "dar", letra, comida: clave, codigo: state.codigo };
	if (aplicarLocal(evento).comida === 0) {
		return false;
	}
	encolar(evento);
	return true;
}

// Gasta estrellas del mundo en el Laboratorio de Luces. Valida contra el saldo actual (todo es
// síncrono, así dos toques seguidos no pueden gastar la misma estrella) y devuelve false sin tocar
// nada si no alcanza. `efecto` queda en el evento solo como referencia.
export function gastarEstrellas(mundo, cantidad, efecto) {
	const letras = LETRAS_POR_MUNDO[mundo];
	if (!letras) {
		return false;
	}
	// La API valida la letra: va la primera del mundo, que alcanza para saber de qué mundo es.
	const evento = { id: nuevoId(), tipo: "gastar", mundo, letra: letras[0], cantidad, efecto, codigo: state.codigo };
	if (!aplicarLocal(evento)) {
		return false;
	}
	encolar(evento);
	return true;
}

async function pedir(metodo, ruta, cuerpo) {
	const respuesta = await fetch(ruta, {
		method: metodo,
		headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
		body: cuerpo ? JSON.stringify(cuerpo) : undefined,
		cache: "no-store"
	});
	const datos = await respuesta.json().catch(() => ({}));
	return { status: respuesta.status, datos };
}

async function sincronizarAhora() {
	if (!state.codigo) {
		const { status, datos } = await pedir("POST", "/api/jugadores", { dispositivo });
		if (status !== 201 || !datos.codigo) {
			return;
		}
		setState({ codigo: datos.codigo });
	}
	while (pendientes.length > 0) {
		const { codigo, ...evento } = pendientes[0];
		const destino = codigo || state.codigo;
		const { status } = await pedir("POST", `/api/jugadores/${encodeURIComponent(destino)}/eventos`, evento);
		// 5xx: se reintenta más tarde. 4xx: el evento no sirve y trabaría la cola.
		if (status >= 500) {
			return;
		}
		pendientes = pendientes.slice(1);
		guardarPendientes();
	}
	const codigo = state.codigo;
	const { status, datos } = await pedir("GET", `/api/jugadores/${encodeURIComponent(codigo)}`);
	// Si mientras tanto se sumó algo o se cambió de código, esta respuesta ya quedó vieja.
	if (status === 200 && pendientes.length === 0 && state.codigo === codigo) {
		setState({ letras: datos.letras || {} });
	}
}

// Manda lo pendiente y trae lo guardado en la API. Sin conexión no hace nada: se reintenta
// al volver la conexión, al volver a la app o con el próximo premio.
export function sincronizar() {
	if (!sincronizando) {
		sincronizando = sincronizarAhora()
			.catch(() => {})
			.finally(() => {
				sincronizando = null;
			});
	}
	return sincronizando;
}

// Cambia este dispositivo al código de otro (pegado por el usuario). Devuelve un mensaje de error o null.
export async function usarCodigo(texto) {
	const limpio = String(texto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
	if (limpio.length !== 8) {
		return "El código tiene 8 letras y números.";
	}
	const codigo = `${limpio.slice(0, 4)}-${limpio.slice(4)}`;
	if (codigo === state.codigo) {
		return null;
	}
	try {
		// Lo que quedó sin enviar se manda antes al código anterior.
		await sincronizar();
		const { status, datos } = await pedir("GET", `/api/jugadores/${encodeURIComponent(codigo)}`);
		if (status === 404 || status === 400) {
			return "No encontramos ese código.";
		}
		if (status !== 200) {
			return "No se pudo conectar. Probá de nuevo.";
		}
		setState({ codigo: datos.codigo, letras: datos.letras || {} });
		return null;
	} catch {
		return "No se pudo conectar. Probá de nuevo.";
	}
}

// Debug: fuerza el monstruo de una letra al tope (evoluciona) o a cero (desevoluciona).
// El servidor solo lo acepta para CODIGO_DEBUG (ver server/index.js); lo usan los botones
// de Monstruo.jsx, que también chequean el código antes de mostrarse.
export async function forzarMonstruo(letra, evolucionar) {
	if (!state.codigo) {
		return false;
	}
	const accion = evolucionar ? "evolucionar" : "desevolucionar";
	try {
		const { status, datos } = await pedir("POST", `/api/jugadores/${encodeURIComponent(state.codigo)}/letras/${encodeURIComponent(letra)}/${accion}`);
		if (status !== 200) {
			return false;
		}
		setState({ letras: datos.letras || {} });
		return true;
	} catch {
		return false;
	}
}

// Debug: suma comida de cada tipo para darle a todos los monstruos (ver server/index.js).
export async function sumarComidaPrueba() {
	if (!state.codigo) {
		return false;
	}
	try {
		const { status, datos } = await pedir("POST", `/api/jugadores/${encodeURIComponent(state.codigo)}/comida-prueba`);
		if (status !== 200) {
			return false;
		}
		setState({ letras: datos.letras || {} });
		return true;
	} catch {
		return false;
	}
}

export function startRecompensas() {
	sincronizar();
	window.addEventListener("online", sincronizar);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") {
			sincronizar();
		}
	});
}
