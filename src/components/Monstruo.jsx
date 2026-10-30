import { img } from "../lib/assets";
import "./Monstruo.css";

// Cuadros de cada monstruo (public/assets/imagenes/monstruos): la letra va en la panza.
// 1: normal · 2: boca abierta · 3: masticando · 4: se relame · 5: feliz.
// 6: normal en el nivel 1; brazos arriba con la boca abierta en el nivel 2 (evolucionado).
export const CUADROS_MONSTRUO = { normal: 1, abre: 2, mastica: 3, relame: 4, feliz: 5 };

export function imagenMonstruo(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${letra}-${cuadro}.webp`);
}

export function imagenMonstruoNivel2(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${letra}-nivel2-${cuadro}.webp`);
}

export function imagenesMonstruo(letra) {
	return [1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruo(letra, cuadro));
}

export function imagenesMonstruoNivel2(letra) {
	return [1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruoNivel2(letra, cuadro));
}

export default function Monstruo({ letra, cuadro = CUADROS_MONSTRUO.normal, evolucionado = false, className = "" }) {
	const clases = ["monstruo", className].filter(Boolean).join(" ");
	const src = evolucionado ? imagenMonstruoNivel2(letra, cuadro) : imagenMonstruo(letra, cuadro);
	const estado = evolucionado ? " evolucionado" : "";
	return <img className={clases} src={src} alt={`Monstruo${estado} de la letra ${letra.toUpperCase()}`} draggable={false} />;
}
