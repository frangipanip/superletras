// Contador de estrellas de la letra, al lado del monstruo del camino (Mundos 1 a 5). Las estrellas
// se ganan al volver a jugar una actividad que ya dio todas sus comidas. Sin estrellas no se muestra.
export default function ContadorEstrellas({ cantidad }) {
	if (!(cantidad > 0)) {
		return null;
	}
	return (
		<span className="monstruo-estrellas" aria-label={`${cantidad} ${cantidad === 1 ? "estrella" : "estrellas"}`}>
			<span aria-hidden="true">⭐</span>
			{cantidad}
		</span>
	);
}
