import { useRef, useState, useSyncExternalStore } from "react";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { getRecompensas, subscribeRecompensas, usarCodigo } from "../lib/recompensas";
import "./CodigoUsuario.css";

function copiarTexto(texto, respaldo) {
	if (navigator.clipboard?.writeText) {
		return navigator.clipboard.writeText(texto);
	}
	// Sin HTTPS no hay API del portapapeles: se copia seleccionando el texto.
	respaldo.select();
	document.execCommand("copy");
	return Promise.resolve();
}

// Código del usuario (identifica sus comidas en la API): se copia para llevarlo a otro
// dispositivo, o se pega el de otro con "Usar otro".
export default function CodigoUsuario() {
	const runtime = usePageRuntime();
	const { codigo } = useSyncExternalStore(subscribeRecompensas, getRecompensas);
	const [copiado, setCopiado] = useState(false);
	const [cambiando, setCambiando] = useState(false);
	const [borrador, setBorrador] = useState("");
	const [error, setError] = useState("");
	const [buscando, setBuscando] = useState(false);
	const codigoRef = useRef(null);

	function copiarCodigo() {
		copiarTexto(codigo, codigoRef.current)
			.then(() => {
				setCopiado(true);
				runtime.setTimeout(() => setCopiado(false), 1800);
			})
			.catch(() => {});
	}

	async function aceptarCodigo(event) {
		event.preventDefault();
		setBuscando(true);
		const mensaje = await usarCodigo(borrador);
		setBuscando(false);
		setError(mensaje || "");
		if (!mensaje) {
			setCambiando(false);
			setBorrador("");
		}
	}

	function cancelar() {
		setCambiando(false);
		setBorrador("");
		setError("");
	}

	return (
		<div className="codigo-usuario">
			{cambiando ? (
				<form onSubmit={aceptarCodigo}>
					<input
						type="text"
						value={borrador}
						maxLength={12}
						placeholder="Pegá tu código"
						aria-label="Código de otro dispositivo"
						autoCapitalize="characters"
						autoComplete="off"
						spellCheck={false}
						autoFocus
						onChange={(event) => setBorrador(event.target.value)}
					/>
					<button type="submit" disabled={buscando}>
						{buscando ? "Buscando..." : "Usar"}
					</button>
					<button type="button" onClick={cancelar}>
						Cancelar
					</button>
					{error && <span className="codigo-usuario-error">{error}</span>}
				</form>
			) : (
				<>
					<span>Tu código:</span>
					<input
						ref={codigoRef}
						readOnly
						aria-label="Tu código"
						value={codigo || "sin conexión"}
						onFocus={(event) => event.target.select()}
					/>
					<button type="button" disabled={!codigo} onClick={copiarCodigo}>
						{copiado ? "¡Copiado!" : "Copiar"}
					</button>
					<button type="button" onClick={() => setCambiando(true)}>
						Usar otro
					</button>
				</>
			)}
		</div>
	);
}
