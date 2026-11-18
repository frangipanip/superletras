import { img } from "../lib/assets";
import "./Monstruo.css";

// Cuadros de cada monstruo (public/assets/imagenes/monstruos): la letra va en la panza.
// 1: normal · 2: boca abierta · 3: masticando · 4: se relame · 5: feliz.
// 6: normal en el nivel 1; brazos arriba con la boca abierta en el nivel 2 (evolucionado).
export const CUADROS_MONSTRUO = { normal: 1, abre: 2, mastica: 3, relame: 4, feliz: 5 };

// Monstruos que ya tienen los 6 cuadros de comer, por nivel. Los de Mundos 2 a 5 salieron de la
// lámina con una sola imagen por nivel: hasta tener sus cuadros (fase 17, hechos con ChatGPT y
// scripts/cortar-hoja-monstruo.py) usan el cuadro 1 en todos los estados.
const MUNDO1 = ["a", "l", "m", "s", "t"];
const CON_CUADROS = {
	1: new Set([...MUNDO1, "p", "n", "d"]),
	2: new Set([...MUNDO1, "p", "n"])
};

// Nombre de la letra en el archivo: sin diéresis, para el servidor Linux y las URLs.
function archivo(letra) {
	return letra === "gü" ? "gdieresis" : letra;
}

function cuadroDe(letra, cuadro, nivel) {
	return CON_CUADROS[nivel].has(letra) ? cuadro : CUADROS_MONSTRUO.normal;
}

export function imagenMonstruo(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${archivo(letra)}-${cuadroDe(letra, cuadro, 1)}.webp`);
}

export function imagenMonstruoNivel2(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${archivo(letra)}-nivel2-${cuadroDe(letra, cuadro, 2)}.webp`);
}

export function imagenesMonstruo(letra) {
	return [...new Set([1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruo(letra, cuadro)))];
}

export function imagenesMonstruoNivel2(letra) {
	return [...new Set([1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruoNivel2(letra, cuadro)))];
}

export default function Monstruo({ letra, cuadro = CUADROS_MONSTRUO.normal, evolucionado = false, className = "" }) {
	const clases = ["monstruo", className].filter(Boolean).join(" ");
	const src = evolucionado ? imagenMonstruoNivel2(letra, cuadro) : imagenMonstruo(letra, cuadro);
	const estado = evolucionado ? " evolucionado" : "";
	return <img className={clases} src={src} alt={`Monstruo${estado} de la letra ${letra.toUpperCase()}`} draggable={false} />;
}
