import { img } from "../lib/assets";
import "./Monstruo.css";

// Cuadros de cada monstruo (public/assets/imagenes/monstruos): la letra va en la panza.
// 1 y 6: normal · 2: boca abierta · 3: masticando · 4: se relame · 5: feliz.
export const CUADROS_MONSTRUO = { normal: 1, abre: 2, mastica: 3, relame: 4, feliz: 5 };

export function imagenMonstruo(letra, cuadro = CUADROS_MONSTRUO.normal) {
	return img(`monstruos/monstruo-${letra}-${cuadro}.webp`);
}

export function imagenesMonstruo(letra) {
	return [1, 2, 3, 4, 5, 6].map((cuadro) => imagenMonstruo(letra, cuadro));
}

// lleno: salta contento (cuando ya comió todo lo que necesitaba).
export default function Monstruo({ letra, cuadro = CUADROS_MONSTRUO.normal, lleno = false, className = "" }) {
	const clases = ["monstruo", lleno && "lleno", className].filter(Boolean).join(" ");
	return <img className={clases} src={imagenMonstruo(letra, cuadro)} alt={`Monstruo de la letra ${letra.toUpperCase()}`} draggable={false} />;
}
