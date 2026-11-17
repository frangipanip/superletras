import { shuffle } from "./shuffle";

// Rondas de Peluches en todos los mundos: 6 pedidos, los 2 primeros con dos dibujos y los
// siguientes con tres (donde la escena tiene lugar para tres; si no, todas con dos).
export const TOTAL_RONDAS = 6;
export const RONDAS_DE_DOS = 2;

export function opcionesDeRonda(indice, conTres = true) {
	return conTres && indice >= RONDAS_DE_DOS ? 3 : 2;
}

// Orden de los pedidos: `total` rondas, cada sonido al menos una vez si alcanzan y nunca el mismo
// dos veces seguidas. `maximo(consigna)` limita cuántas veces se puede pedir un sonido (las
// palabras que tiene: LLU tiene una sola y pedirla otra vez era acertar de memoria).
export function ordenDeConsignas(consignas, { total = TOTAL_RONDAS, maximo = () => Infinity } = {}) {
	const pedidas = new Map();
	const orden = [];
	while (orden.length < total) {
		const disponibles = consignas.filter((consigna) => (pedidas.get(consigna) || 0) < maximo(consigna));
		if (!disponibles.length) {
			break;
		}
		let tanda = shuffle(disponibles);
		if (tanda.length > 1 && tanda[0] === orden[orden.length - 1]) {
			tanda = [...tanda.slice(1), tanda[0]];
		}
		for (const consigna of tanda) {
			if (orden.length >= total) {
				break;
			}
			orden.push(consigna);
			pedidas.set(consigna, (pedidas.get(consigna) || 0) + 1);
		}
	}
	return orden;
}

// Ubica el dibujo correcto entre los equivocados: repartido entre los lugares y nunca tres
// veces seguidas en el mismo (si no, se acierta tocando siempre el mismo lado).
// rondas: [{ consigna, correcta, incorrectas: [id] }] → [{ consigna, options: [{ id, correct }] }]
export function ubicarOpciones(rondas) {
	const usos = new Map();
	const previas = [];
	return rondas.map(({ consigna, correcta, incorrectas }) => {
		const cantidad = incorrectas.length + 1;
		let lugares = Array.from({ length: cantidad }, (_, lugar) => lugar);
		const [anteultima, ultima] = previas.slice(-2);
		if (anteultima !== undefined && anteultima === ultima) {
			lugares = lugares.filter((lugar) => lugar !== ultima);
		}
		const clave = (lugar) => `${cantidad}-${lugar}`;
		const menosUsado = Math.min(...lugares.map((lugar) => usos.get(clave(lugar)) || 0));
		const candidatos = lugares.filter((lugar) => (usos.get(clave(lugar)) || 0) === menosUsado);
		const lugar = candidatos[Math.floor(Math.random() * candidatos.length)];
		usos.set(clave(lugar), (usos.get(clave(lugar)) || 0) + 1);
		previas.push(lugar);
		const options = shuffle(incorrectas).map((id) => ({ id, correct: false }));
		options.splice(lugar, 0, { id: correcta, correct: true });
		return { consigna, options };
	});
}

// Elige `cantidad` palabras distintas, prefiriendo las que todavía no salieron en la partida.
export function elegirSinRepetir(palabras, usadas, cantidad) {
	const nuevas = shuffle(palabras.filter((palabra) => !usadas.has(palabra)));
	const viejas = shuffle(palabras.filter((palabra) => usadas.has(palabra)));
	const elegidas = [...nuevas, ...viejas].slice(0, cantidad);
	elegidas.forEach((palabra) => usadas.add(palabra));
	return elegidas;
}
