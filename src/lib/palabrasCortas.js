// Sílabas aproximadas: cada grupo de vocales seguidas cuenta como una (pue-rta, dia-rio).
// Alcanza para preferir palabras cortas en Peluches; no es una división silábica exacta.
export function contarSilabas(palabra) {
	return (palabra.toLowerCase().match(/[aeiouáéíóúü]+/g) || []).length;
}

// Las palabras de hasta 3 sílabas de la lista; si no hay ninguna, la lista entera.
export function preferirCortas(palabras, maximo = 3) {
	const cortas = palabras.filter((palabra) => contarSilabas(palabra) <= maximo);
	return cortas.length ? cortas : palabras;
}
