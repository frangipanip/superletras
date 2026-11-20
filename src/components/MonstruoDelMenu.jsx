import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { COMIDAS, LETRAS_POR_MUNDO } from "../../shared/comidas.js";
import { cantidadComida, comidaParaDar, getRecompensas, subscribeRecompensas } from "../lib/recompensas";
import ContadorEstrellas from "./ContadorEstrellas";
import { img } from "../lib/assets";
import ContadorComida from "./ContadorComida";
import Monstruo from "./Monstruo";

// Monstruo de la letra elegida, fijo arriba en los menús de Mundos 2 a 6 (como la nube de Mundo 1):
// brilla y muestra el total de comidas para darle; al tocarlo lleva a /monstruo. A su izquierda, el
// contador de estrellas del mundo (ContadorEstrellas), que abre el Laboratorio de Luces.
// `letra` es la clave del menú (en mayúscula, o null si todavía no se eligió ninguna). En Mundos 2 a 4 y 6
// la columna de letras está cerca del medio: ahí el monstruo va a su derecha (clase monstruo-menu-derecha).
export default function MonstruoDelMenu({ mundo, letra, disabled = false }) {
	const navigate = useNavigate();
	const { letras } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const letrasMundo = LETRAS_POR_MUNDO[mundo];
	const elegida = letra?.toLowerCase();
	const actual = letrasMundo.includes(elegida) ? elegida : letrasMundo[0];
	const pendientes = comidaParaDar(letras, actual);
	const evolucionado = COMIDAS.every(({ clave, necesarias }) => cantidadComida(letras, actual, clave).dadas >= necesarias);

	function abrir() {
		if (disabled) return;
		navigate("/monstruo", { state: { world: mundo, letra: actual } });
	}

	return (
		<>
			<button
				className={`monstruo-menu-boton${mundo !== 5 ? " monstruo-menu-derecha" : ""}${mundo === 4 ? " monstruo-menu-burbuja" : ""}${pendientes > 0 ? " monstruo-con-comida" : ""}`}
				type="button"
				aria-label={`Ver al monstruo y sus comidas${pendientes > 0 ? `: tiene ${pendientes} ${pendientes === 1 ? "comida" : "comidas"} para darle` : ""}`}
				onClick={abrir}
			>
				<img
					className={mundo === 4 ? "monstruo-menu-burbuja-imagen" : "monstruo-menu-nube"}
					src={img(mundo === 4 ? "burbuja.png" : "nube.png")}
					alt=""
					aria-hidden="true"
					draggable={false}
				/>
				<Monstruo letra={actual} evolucionado={evolucionado} />
				<ContadorComida cantidad={pendientes} />
			</button>
			<ContadorEstrellas mundo={mundo} x={mundo !== 5 ? "66%" : "50%"} disabled={disabled} />
		</>
	);
}
