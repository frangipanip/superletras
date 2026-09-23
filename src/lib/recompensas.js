import { COMIDA_POR_ACTIVIDAD, COMIDA_POR_CLAVE, premioPorErrores } from "../../shared/comidas.js";
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

function nuevoId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Misma cuenta que hace la API (server/index.js): el premio no pasa de lo que necesita
// el monstruo y solo se le puede dar lo que se ganó.
function aplicarLocal(evento) {
	const comida = evento.tipo === "premio" ? COMIDA_POR_ACTIVIDAD[evento.actividad] : COMIDA_POR_CLAVE[evento.comida];
	const actual = cantidadComida(state.letras, evento.letra, comida.clave);
	let cantidad;
	let siguiente;
	if (evento.tipo === "premio") {
		cantidad = Math.max(0, Math.min(premioPorErrores(evento.actividad, evento.errores), comida.necesarias - actual.ganadas));
		siguiente = { ...actual, ganadas: actual.ganadas + cantidad };
	} else {
		cantidad = actual.dadas < actual.ganadas ? 1 : 0;
		siguiente = { ...actual, dadas: actual.dadas + cantidad };
	}
	if (cantidad > 0) {
		setState({
			letras: { ...state.letras, [evento.letra]: { ...state.letras[evento.letra], [comida.clave]: siguiente } }
		});
	}
	return cantidad;
}

function encolar(evento) {
	pendientes = [...pendientes, evento];
	guardarPendientes();
	sincronizar();
}

// Al completar una actividad. Devuelve { comida, cantidad } (cantidad 0 si ya llegó al tope).
export function otorgarPremio(letra, actividad, errores = 0) {
	const comida = COMIDA_POR_ACTIVIDAD[actividad];
	if (!comida || !letra) {
		return null;
	}
	const evento = { id: nuevoId(), tipo: "premio", letra, actividad, errores, codigo: state.codigo };
	const cantidad = aplicarLocal(evento);
	if (cantidad > 0) {
		encolar(evento);
	}
	return { id: evento.id, comida, cantidad };
}

// Le da una unidad de comida al monstruo de la letra. Devuelve false si no quedaba.
export function darComida(letra, clave) {
	const evento = { id: nuevoId(), tipo: "dar", letra, comida: clave, codigo: state.codigo };
	if (aplicarLocal(evento) === 0) {
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

export function startRecompensas() {
	sincronizar();
	window.addEventListener("online", sincronizar);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") {
			sincronizar();
		}
	});
}
