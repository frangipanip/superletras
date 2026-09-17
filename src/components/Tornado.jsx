import "./Tornado.css";

// Anillos del embudo, de arriba (ancho) hacia abajo (angosto).
const RINGS = Array.from({ length: 8 }, (_, index) => {
	const rx = 88 - index * 10;
	return { cy: 34 + index * 27, rx, ry: rx * 0.24 };
});

// Hojas y piedritas que giran alrededor del embudo.
const DEBRIS = [
	{ cy: 60, size: 5, color: "#6aa84f", duration: "0.7s", delay: "0s" },
	{ cy: 110, size: 4, color: "#8d6e63", duration: "0.55s", delay: "-0.2s" },
	{ cy: 150, size: 6, color: "#93c47d", duration: "0.8s", delay: "-0.5s" },
	{ cy: 190, size: 3.5, color: "#795548", duration: "0.5s", delay: "-0.1s" },
	{ cy: 80, size: 3, color: "#b6d7a8", duration: "0.65s", delay: "-0.35s" },
];

// Dibujo de un tornado animado; se ubica y dimensiona desde afuera con className.
export default function Tornado({ className = "" }) {
	return (
		<svg className={`tornado ${className}`} viewBox="0 0 200 260" aria-hidden="true">
			<defs>
				<linearGradient id="tornado-body" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#8a98a8" stopOpacity="0.55" />
					<stop offset="0.5" stopColor="#e3eaf1" stopOpacity="0.8" />
					<stop offset="1" stopColor="#8a98a8" stopOpacity="0.55" />
				</linearGradient>
			</defs>
			<ellipse className="tornado-dust" cx="100" cy="246" rx="46" ry="10" />
			<g className="tornado-funnel">
				<path className="tornado-body" d="M12 34 Q100 60 188 34 L118 234 Q100 242 82 234 Z" fill="url(#tornado-body)" />
				{RINGS.map(({ cy, rx, ry }, index) => (
					<g className="tornado-ring" key={cy} style={{ animationDelay: `${index * -0.09}s` }}>
						<ellipse className="tornado-ring-fill" cx="100" cy={cy} rx={rx} ry={ry} />
						<ellipse className="tornado-ring-swirl" cx="100" cy={cy} rx={rx} ry={ry} />
					</g>
				))}
			</g>
			{DEBRIS.map(({ cy, size, color, duration, delay }) => (
				<g className="tornado-debris" key={cy} style={{ animationDuration: duration, animationDelay: delay }}>
					<ellipse cx="100" cy={cy} rx={size} ry={size * 0.6} fill={color} />
				</g>
			))}
		</svg>
	);
}
