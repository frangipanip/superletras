import { useLayoutEffect, useRef, useState } from "react";
import { img } from "../lib/assets";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import BackButton from "./BackButton";
import FullscreenButton from "./FullscreenButton";
import "./UserNav.css";

const MAX_NAME_LENGTH = 10;
const DEFAULT_NAME = "USUARIO";

// Barra superior de los menus: volver, pantalla completa y nombre del usuario.
export default function UserNav() {
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
				<BackButton className="corner-button back-button" />
				<FullscreenButton />
				<button className="corner-button guest-button" type="button" onClick={openProfileModal}>
					<span>{guestName}</span>
				</button>
			</nav>

			<section className="profile-modal" role="dialog" aria-modal="true" aria-label="Configurar perfil" hidden={!modalOpen}>
				<div className="profile-window">
					<input
						ref={inputRef}
						className="profile-input"
						type="text"
						maxLength={MAX_NAME_LENGTH}
						placeholder="Escribe tu nombre aqui..."
						autoComplete="name"
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
					/>
					<span className="profile-counter">{draft.length}/{MAX_NAME_LENGTH}</span>
					<div className="profile-actions">
						<button type="button" aria-label="Aceptar" onClick={saveGuestName}>
							<img src={img("aceptarbtn.png")} alt="Aceptar" />
						</button>
						<button type="button" aria-label="Cancelar" onClick={() => setModalOpen(false)}>
							<img src={img("cancelarbtn.png")} alt="Cancelar" />
						</button>
					</div>
				</div>
			</section>
		</>
	);
}
