// API de las comidas ganadas en las actividades. Guarda todo en SQLite (node:sqlite, sin
// dependencias). En producción nginx le pasa /api/ (ver nginx.conf); en desarrollo, Vite.
import { randomInt } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { COMIDA_POR_ACTIVIDAD, COMIDA_POR_CLAVE, premioPorErrores } from "../shared/comidas.js";

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || fileURLToPath(new URL("../datos/superletras.db", import.meta.url));
const MAX_BODY = 10 * 1024;

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
	PRAGMA journal_mode = WAL;
	PRAGMA foreign_keys = ON;
	-- dispositivo: id que genera cada navegador al abrir la app por primera vez. Si pide
	-- código dos veces (por ejemplo, recargó antes de recibir la respuesta) recibe el mismo.
	CREATE TABLE IF NOT EXISTS jugadores (
		codigo TEXT PRIMARY KEY,
		dispositivo TEXT UNIQUE,
		creado TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE TABLE IF NOT EXISTS comidas (
		codigo TEXT NOT NULL REFERENCES jugadores (codigo),
		letra TEXT NOT NULL,
		comida TEXT NOT NULL,
		ganadas INTEGER NOT NULL DEFAULT 0,
		dadas INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (codigo, letra, comida)
	);
	-- Cada evento (premio o comida dada al monstruo) tiene un id que genera la app:
	-- si reintenta el envío porque se cortó la conexión, no se cuenta dos veces.
	CREATE TABLE IF NOT EXISTS eventos (
		id TEXT PRIMARY KEY,
		codigo TEXT NOT NULL REFERENCES jugadores (codigo),
		tipo TEXT NOT NULL,
		letra TEXT NOT NULL,
		comida TEXT NOT NULL,
		actividad TEXT,
		errores INTEGER,
		cantidad INTEGER NOT NULL,
		fecha TEXT NOT NULL DEFAULT (datetime('now'))
	);
`);

// Sin letras ni números que se confundan (0/O, 1/I): fácil de dictar, copiar y pegar.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LARGO_CODIGO = 8;

function generarCodigo() {
	let codigo = "";
	for (let i = 0; i < LARGO_CODIGO; i += 1) {
		codigo += ALFABETO[randomInt(ALFABETO.length)];
	}
	return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

// Acepta el código con o sin guion, en minúsculas o con espacios de más al pegarlo.
function normalizarCodigo(texto) {
	const limpio = String(texto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
	if (limpio.length !== LARGO_CODIGO || [...limpio].some((letra) => !ALFABETO.includes(letra))) {
		return null;
	}
	return `${limpio.slice(0, 4)}-${limpio.slice(4)}`;
}

const sql = {
	crearJugador: db.prepare("INSERT INTO jugadores (codigo, dispositivo) VALUES (?, ?)"),
	jugadorDeDispositivo: db.prepare("SELECT codigo FROM jugadores WHERE dispositivo = ?"),
	existeJugador: db.prepare("SELECT 1 FROM jugadores WHERE codigo = ?"),
	comidas: db.prepare("SELECT letra, comida, ganadas, dadas FROM comidas WHERE codigo = ?"),
	comida: db.prepare("SELECT ganadas, dadas FROM comidas WHERE codigo = ? AND letra = ? AND comida = ?"),
	guardarComida: db.prepare(`
		INSERT INTO comidas (codigo, letra, comida, ganadas, dadas) VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (codigo, letra, comida) DO UPDATE SET ganadas = excluded.ganadas, dadas = excluded.dadas
	`),
	existeEvento: db.prepare("SELECT 1 FROM eventos WHERE id = ?"),
	guardarEvento: db.prepare(`
		INSERT INTO eventos (id, codigo, tipo, letra, comida, actividad, errores, cantidad)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`)
};

function crearJugador(dispositivo) {
	if (dispositivo) {
		const existente = sql.jugadorDeDispositivo.get(dispositivo);
		if (existente) {
			return existente.codigo;
		}
	}
	for (let intento = 0; intento < 10; intento += 1) {
		const codigo = generarCodigo();
		try {
			sql.crearJugador.run(codigo, dispositivo);
			return codigo;
		} catch (error) {
			if (!String(error.message).includes("UNIQUE")) {
				throw error;
			}
		}
	}
	throw new Error("No se pudo generar un código libre");
}

// { a: { cerezas: { ganadas, dadas }, ... }, l: { ... } }
function leerComidas(codigo) {
	const letras = {};
	for (const { letra, comida, ganadas, dadas } of sql.comidas.all(codigo)) {
		letras[letra] ??= {};
		letras[letra][comida] = { ganadas, dadas };
	}
	return letras;
}

function aplicarEvento(codigo, evento) {
	const { id, tipo, letra } = evento;
	if (typeof id !== "string" || id.length < 8 || id.length > 64 || !/^[a-zñ]$/.test(letra)) {
		return false;
	}
	let comida;
	let errores = null;
	if (tipo === "premio") {
		comida = COMIDA_POR_ACTIVIDAD[evento.actividad];
		errores = Math.max(0, Math.floor(Number(evento.errores) || 0));
	} else if (tipo === "dar") {
		comida = COMIDA_POR_CLAVE[evento.comida];
	}
	if (!comida) {
		return false;
	}

	db.exec("BEGIN IMMEDIATE");
	try {
		if (!sql.existeEvento.get(id)) {
			// El jugador puede no existir si la base se perdió pero la app recuerda su código.
			if (!sql.existeJugador.get(codigo)) {
				sql.crearJugador.run(codigo, null);
			}
			const actual = sql.comida.get(codigo, letra, comida.clave) || { ganadas: 0, dadas: 0 };
			let cantidad = 0;
			if (tipo === "premio") {
				cantidad = Math.min(premioPorErrores(evento.actividad, errores), comida.necesarias - actual.ganadas);
			} else if (actual.dadas < actual.ganadas) {
				cantidad = 1;
			}
			cantidad = Math.max(0, cantidad);
			sql.guardarComida.run(
				codigo,
				letra,
				comida.clave,
				actual.ganadas + (tipo === "premio" ? cantidad : 0),
				actual.dadas + (tipo === "dar" ? cantidad : 0)
			);
			sql.guardarEvento.run(id, codigo, tipo, letra, comida.clave, evento.actividad ?? null, errores, cantidad);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
	return true;
}

function responder(res, status, datos) {
	res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
	res.end(JSON.stringify(datos));
}

function leerCuerpo(req) {
	return new Promise((resolve, reject) => {
		let cuerpo = "";
		req.setEncoding("utf8");
		req.on("data", (parte) => {
			cuerpo += parte;
			if (cuerpo.length > MAX_BODY) {
				reject(new Error("Cuerpo demasiado grande"));
				req.destroy();
			}
		});
		req.on("end", () => {
			try {
				resolve(cuerpo ? JSON.parse(cuerpo) : {});
			} catch (error) {
				reject(error);
			}
		});
		req.on("error", reject);
	});
}

const server = createServer(async (req, res) => {
	const { pathname } = new URL(req.url, "http://localhost");
	try {
		// POST /api/jugadores { dispositivo } → el código de ese dispositivo (lo crea la primera vez).
		if (req.method === "POST" && pathname === "/api/jugadores") {
			const { dispositivo } = (await leerCuerpo(req).catch(() => null)) || {};
			const valido = typeof dispositivo === "string" && /^[\w-]{8,64}$/.test(dispositivo) ? dispositivo : null;
			const codigo = crearJugador(valido);
			return responder(res, 201, { codigo, letras: leerComidas(codigo) });
		}

		const ruta = pathname.match(/^\/api\/jugadores\/([^/]+)(\/eventos)?$/);
		const codigo = ruta && normalizarCodigo(decodeURIComponent(ruta[1]));
		if (!ruta) {
			return responder(res, 404, { error: "No existe" });
		}
		if (!codigo) {
			return responder(res, 400, { error: "Código inválido" });
		}

		// GET /api/jugadores/:codigo → comidas de cada letra.
		if (req.method === "GET" && !ruta[2]) {
			if (!sql.existeJugador.get(codigo)) {
				return responder(res, 404, { error: "Código no encontrado" });
			}
			return responder(res, 200, { codigo, letras: leerComidas(codigo) });
		}

		// POST /api/jugadores/:codigo/eventos → premio de una actividad o comida dada al monstruo.
		if (req.method === "POST" && ruta[2]) {
			const evento = await leerCuerpo(req).catch(() => null);
			if (!evento || !aplicarEvento(codigo, evento)) {
				return responder(res, 400, { error: "Evento inválido" });
			}
			return responder(res, 200, { codigo, letras: leerComidas(codigo) });
		}

		return responder(res, 405, { error: "Método no permitido" });
	} catch (error) {
		console.error(error);
		return responder(res, 500, { error: "Error interno" });
	}
});

server.listen(PORT, () => {
	console.log(`API de superletras en el puerto ${PORT} (base: ${DB_PATH})`);
});
