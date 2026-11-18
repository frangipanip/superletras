// Circulito rojo con el total de comidas que el monstruo tiene para recibir (mismo estilo que
// los contadores de cada comida en /monstruo). Sin comidas no se muestra.
export default function ContadorComida({ cantidad }) {
	if (!(cantidad > 0)) {
		return null;
	}
	return (
		<span className="monstruo-contador" aria-hidden="true">
			{cantidad}
		</span>
	);
}
