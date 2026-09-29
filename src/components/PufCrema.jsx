import "./PufCrema.css";

// "Puf de crema + confites": nube de crema que envuelve (o deja salir) a un personaje.
// Deben coincidir con las duraciones de PufCrema.css; useTeleport las usa para encadenar las fases.
export const PUF_OUT_MS = 1100;
export const PUF_IN_MS = 1200;

// Clase para el elemento que envuelve al personaje durante cada fase:
// "out" lo esconde en el pico de la nube; "in" lo muestra en el pico y hace el rebote de llegada.
export const PUF_CHARACTER_CLASS = { out: "puf-character-out", in: "puf-character-in" };

// Bochas de crema. x/y: centro en % de la caja del efecto; size: diámetro en % del ancho;
// dx/dy: hacia dónde se va al disiparse (en % de la propia bocha); row: de los pies (0) a la cabeza (3),
// para que en el origen la nube empiece por los pies.
const BLOBS = [
	{ x: 30, y: 86, size: 36, dx: -60, dy: 20, row: 0 },
	{ x: 50, y: 90, size: 40, dx: 0, dy: 35, row: 0 },
	{ x: 70, y: 86, size: 36, dx: 60, dy: 20, row: 0 },
	{ x: 24, y: 64, size: 40, dx: -75, dy: 0, row: 1 },
	{ x: 50, y: 62, size: 50, dx: 0, dy: 0, row: 1 },
	{ x: 76, y: 64, size: 40, dx: 75, dy: 0, row: 1 },
	{ x: 28, y: 40, size: 40, dx: -65, dy: -25, row: 2 },
	{ x: 52, y: 38, size: 46, dx: 0, dy: -30, row: 2 },
	{ x: 74, y: 42, size: 38, dx: 65, dy: -20, row: 2 },
	{ x: 38, y: 18, size: 34, dx: -40, dy: -55, row: 3 },
	{ x: 62, y: 16, size: 32, dx: 40, dy: -60, row: 3 }
];

// En el destino la nube nace del centro y crece hacia afuera.
const BLOB_IN_DELAY = [60, 0, 60, 40, 0, 40, 60, 20, 60, 100, 100];

// Confites: pocos y chiquitos. tx/ty: hasta dónde vuelan (en % de la caja del efecto).
const CONFITES = [
	{ shape: "baston", color: "#ffb3c7", x: 46, y: 50, tx: -58, ty: -34, rot: 20 },
	{ shape: "bolita", color: "#b9e4ff", x: 54, y: 48, tx: 55, ty: -40, rot: 0 },
	{ shape: "estrella", color: "#fff0a3", x: 50, y: 40, tx: -8, ty: -58, rot: 10 },
	{ shape: "cilindro", color: "#c9f2c7", x: 44, y: 60, tx: -62, ty: 6, rot: -35 },
	{ shape: "baston", color: "#dcc6ff", x: 56, y: 60, tx: 64, ty: 2, rot: 60 },
	{ shape: "bolita", color: "#ffd1a8", x: 48, y: 70, tx: -44, ty: 30, rot: 0 },
	{ shape: "estrella", color: "#ffb3c7", x: 54, y: 68, tx: 46, ty: 28, rot: -15 },
	{ shape: "cilindro", color: "#b9e4ff", x: 52, y: 44, tx: 30, ty: -60, rot: 80 },
	{ shape: "baston", color: "#fff0a3", x: 48, y: 44, tx: -34, ty: -56, rot: -50 },
	{ shape: "bolita", color: "#dcc6ff", x: 50, y: 56, tx: 8, ty: 44, rot: 0 }
];

// Dibuja el efecto; se ubica y dimensiona desde afuera con className (conviene que sea bastante más
// grande que el personaje para taparlo del todo). mode: "out" (desaparición) o "in" (aparición).
export default function PufCrema({ mode, className = "" }) {
	return (
		<div className={`puf puf-${mode} ${className}`} aria-hidden="true">
			<div className="puf-cloud">
				{BLOBS.map(({ x, y, size, dx, dy, row }, index) => (
					<span
						className="puf-blob"
						key={index}
						style={{
							left: `${x}%`,
							top: `${y}%`,
							width: `${size}%`,
							paddingTop: `${size}%`,
							animationDelay: `${mode === "out" ? 120 + row * 50 : BLOB_IN_DELAY[index]}ms`,
							"--dx": `${dx}%`,
							"--dy": `${dy}%`
						}}
					/>
				))}
			</div>
			{CONFITES.map(({ shape, color, x, y, tx, ty, rot }, index) => (
				<span
					className="puf-confite"
					key={index}
					style={{
						animationDelay: `${(mode === "out" ? 260 : 320) + (index % 4) * 40}ms`,
						"--tx": `${tx}%`,
						"--ty": `${ty}%`
					}}
				>
					<i
						className={`puf-confite-pieza puf-confite-${shape}`}
						style={{ left: `${x}%`, top: `${y}%`, background: color, "--rot": `${rot}deg` }}
					/>
				</span>
			))}
		</div>
	);
}
