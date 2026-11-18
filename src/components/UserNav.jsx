import { useLayoutEffect, useRef, useState } from "react";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import BackButton from "./BackButton";
import CodigoUsuario from "./CodigoUsuario";
import FullscreenButton from "./FullscreenButton";
import "./UserNav.css";

const MAX_NAME_LENGTH = 10;
const DEFAULT_NAME = "USUARIO";
// Título del modal: cada letra con su color, como el cartel dibujado original.
const TITULO = [
	[["C", "#e9726c"], ["O", "#f59a5a"], ["N", "#f7ac4c"], ["F", "#f8c843"], ["I", "#f8c843"], ["G", "#8ccb68"], ["U", "#7cc36b"], ["R", "#5cbccb"], ["A", "#5ea6dc"], ["R", "#f2795f"]],
	[["P", "#b06cd8"], ["E", "#9a5cc0"], ["R", "#ee6aa3"], ["F", "#f27a86"], ["I", "#f58a72"], ["L", "#f2795f"]]
];

// Barra superior de los menus: volver, pantalla completa y nombre del usuario.
// Con soloUsuario (pantalla de inicio) muestra solo el botón del usuario.
export default function UserNav({ soloUsuario = false }) {
	const [guestName, setGuestName] = useState(() => readStorage(STORAGE_KEYS.guestName) || DEFAULT_NAME);
	const [modalOpen, setModalOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const inputRef = useRef(null);

	function openProfileModal() {
		setDraft(readStorage(STORAGE_KEYS.guestName) || "");
		setModalOpen(true);
	}

	useLayoutEffect(() => {
		if (modalOpen) {
			inputRef.current?.focus();
		}
	}, [modalOpen]);

	function saveGuestName() {
		const name = draft.trim().slice(0, MAX_NAME_LENGTH).toUpperCase();
		if (name) {
			writeStorage(STORAGE_KEYS.guestName, name);
		} else {
			removeStorage(STORAGE_KEYS.guestName);
		}
		setGuestName(name || DEFAULT_NAME);
		setModalOpen(false);
	}

	return (
		<>
			<nav className="top-nav" aria-label="Navegación y usuario">
				{!soloUsuario && <BackButton className="corner-button back-button" />}
				{!soloUsuario && <FullscreenButton />}
				<button className="corner-button guest-button" type="button" onClick={openProfileModal}>
					<span>{guestName}</span>
				</button>
			</nav>

			<section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" hidden={!modalOpen}>
				{/* Ventana armada con HTML (antes era una imagen): escala con el ancho y se lee bien en el celular. */}
				<div className="profile-window">
					<div className="profile-panel">
						<h2 className="profile-title" id="profile-title" aria-label="Configurar perfil">
							{TITULO.map((palabra, palabraIndex) => (
								<span className="profile-title-palabra" key={palabraIndex} aria-hidden="true">
									{palabra.map(([letra, color], letraIndex) => (
										<span className="profile-title-letra" key={letraIndex} style={{ "--letra-color": color }}>{letra}</span>
									))}
								</span>
							))}
						</h2>
						<label className="profile-question" htmlFor="profile-name">
							¿Cómo querés que te llamemos?
							<br />
							(máximo {MAX_NAME_LENGTH} caracteres)
						</label>
						<div className="profile-input-frame">
							<input
								ref={inputRef}
								id="profile-name"
								className="profile-input"
								type="text"
								maxLength={MAX_NAME_LENGTH}
								placeholder="Escribe tu nombre aqui..."
								autoComplete="name"
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") saveGuestName();
								}}
							/>
						</div>
						<span className="profile-counter">{draft.length}/{MAX_NAME_LENGTH}</span>
						{modalOpen && <CodigoUsuario />}
						<div className="profile-actions">
							<button className="profile-boton profile-aceptar" type="button" onClick={saveGuestName}>
								<span>Aceptar</span>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path className="profile-icono-borde" d="M4.5 12.5l5 5L19.5 6.5" />
									<path className="profile-icono-relleno" d="M4.5 12.5l5 5L19.5 6.5" />
								</svg>
							</button>
							<button className="profile-boton profile-cancelar" type="button" onClick={() => setModalOpen(false)}>
								<span>Cancelar</span>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path className="profile-icono-borde" d="M6 6l12 12M18 6L6 18" />
									<path className="profile-icono-relleno" d="M6 6l12 12M18 6L6 18" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
