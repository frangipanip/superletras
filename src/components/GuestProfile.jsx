import { useEffect, useRef, useState } from "react";
import { GUEST_NAME_KEY, readStorage, writeStorage } from "../lib/storage.js";

const DEFAULT_NAME = "USUARIO";
const MAX_LENGTH = 10;

export function GuestProfile() {
	const [guestName, setGuestName] = useState(() => readStorage(GUEST_NAME_KEY) || DEFAULT_NAME);
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const inputRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	function openModal() {
		setDraft(readStorage(GUEST_NAME_KEY) || "");
		setIsOpen(true);
	}

	function saveGuestName() {
		const nextName = draft.trim().slice(0, MAX_LENGTH).toUpperCase();

		if (!nextName) {
			setGuestName(DEFAULT_NAME);
			writeStorage(GUEST_NAME_KEY, null);
		} else {
			setGuestName(nextName);
			writeStorage(GUEST_NAME_KEY, nextName);
		}

		setIsOpen(false);
	}

	return (
		<>
			<button className="corner-button guest-button" type="button" onClick={openModal}>
				<span>{guestName}</span>
			</button>

			{isOpen ? (
				<section
					className="profile-modal"
					role="dialog"
					aria-modal="true"
					aria-label="Configurar perfil"
				>
					<div className="profile-window">
						<input
							ref={inputRef}
							className="profile-input"
							type="text"
							maxLength={MAX_LENGTH}
							placeholder="Escribe tu nombre aqui..."
							autoComplete="name"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									saveGuestName();
								}
								if (event.key === "Escape") {
									setIsOpen(false);
								}
							}}
						/>
						<span className="profile-counter">{`${draft.length}/${MAX_LENGTH}`}</span>
						<div className="profile-actions">
							<button type="button" aria-label="Aceptar" onClick={saveGuestName}>
								<img src="/assets/imagenes/aceptarbtn.png" alt="Aceptar" />
							</button>
							<button type="button" aria-label="Cancelar" onClick={() => setIsOpen(false)}>
								<img src="/assets/imagenes/cancelarbtn.png" alt="Cancelar" />
							</button>
						</div>
					</div>
				</section>
			) : null}
		</>
	);
}
