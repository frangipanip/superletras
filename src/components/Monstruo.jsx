import "./Monstruo.css";

// Color de cada monstruo: el mismo tono que los botones del camino de esa letra en Mundo 1.
export const COLORES_MONSTRUO = {
	a: { cuerpo: "#9b4fc0", sombra: "#6a2a88" },
	l: { cuerpo: "#3db36c", sombra: "#237a47" },
	m: { cuerpo: "#f0b92e", sombra: "#b3811a" },
	s: { cuerpo: "#e2474a", sombra: "#a0282b" },
	t: { cuerpo: "#3a8fd6", sombra: "#22609a" }
};

// Monstruo provisorio dibujado en SVG (hasta tener las imágenes de cada letra).
// comiendo: abre la boca; lleno: sonríe con los ojos cerrados.
export default function Monstruo({ letra, comiendo = false, lleno = false, className = "" }) {
	const { cuerpo, sombra } = COLORES_MONSTRUO[letra] || COLORES_MONSTRUO.a;
	const clases = ["monstruo", comiendo && "comiendo", lleno && "lleno", className].filter(Boolean).join(" ");
	return (
		<svg className={clases} viewBox="0 0 200 220" role="img" aria-label={`Monstruo de la letra ${letra.toUpperCase()}`}>
			<g className="monstruo-cuerpo">
				{/* Cuernitos */}
				<path d="M58 52 L46 14 L78 40 Z" fill={sombra} />
				<path d="M142 52 L154 14 L122 40 Z" fill={sombra} />
				{/* Patas y brazos */}
				<ellipse cx="68" cy="204" rx="24" ry="12" fill={sombra} />
				<ellipse cx="132" cy="204" rx="24" ry="12" fill={sombra} />
				<ellipse className="monstruo-brazo izquierdo" cx="22" cy="130" rx="14" ry="28" fill={sombra} />
				<ellipse className="monstruo-brazo derecho" cx="178" cy="130" rx="14" ry="28" fill={sombra} />
				{/* Cuerpo y panza con la letra */}
				<path d="M100 30 C160 30 184 80 184 130 C184 180 150 206 100 206 C50 206 16 180 16 130 C16 80 40 30 100 30 Z" fill={cuerpo} />
				<ellipse cx="100" cy="160" rx="50" ry="38" fill="#ffffff" opacity="0.35" />
				<text x="100" y="178" textAnchor="middle" className="monstruo-letra">
					{letra.toUpperCase()}
				</text>
				{/* Ojos */}
				{lleno ? (
					<g stroke="#2b1a10" strokeWidth="6" strokeLinecap="round" fill="none">
						<path d="M58 78 Q70 66 82 78" />
						<path d="M118 78 Q130 66 142 78" />
					</g>
				) : (
					<g className="monstruo-ojos">
						<circle cx="70" cy="76" r="17" fill="#ffffff" />
						<circle cx="130" cy="76" r="17" fill="#ffffff" />
						<circle cx="73" cy="80" r="8" fill="#2b1a10" />
						<circle cx="127" cy="80" r="8" fill="#2b1a10" />
					</g>
				)}
				{/* Boca */}
				{comiendo ? (
					<ellipse cx="100" cy="116" rx="26" ry="20" fill="#5a1020" />
				) : (
					<path d="M70 108 Q100 138 130 108" stroke="#2b1a10" strokeWidth="6" strokeLinecap="round" fill={lleno ? "#5a1020" : "none"} />
				)}
				<path d="M84 110 L90 122 L96 111 Z" fill="#ffffff" />
				<path d="M104 111 L110 122 L116 110 Z" fill="#ffffff" />
			</g>
		</svg>
	);
}
