import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import {
	canAutoUpdate,
	getPwaState,
	isInstalledApp,
	promptInstall,
	reloadToLatest,
	subscribePwa
} from "../lib/pwa";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";

// Los carteles solo aparecen en los menús para no tapar las actividades.
const MENU_ROUTES = ["/", "/mundos"];
const INSTALL_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function installSnoozed() {
	const dismissedAt = Number(readStorage(STORAGE_KEYS.installPromptDismissedAt));
	return Boolean(dismissedAt) && Date.now() - dismissedAt < INSTALL_SNOOZE_MS;
}

export default function AppBanners() {
	const { pathname } = useLocation();
	const { canInstall, latestVersion } = useSyncExternalStore(subscribePwa, getPwaState);
	const [installDismissed, setInstallDismissed] = useState(installSnoozed);
	const onMenu = MENU_ROUTES.includes(pathname);

	// Hay versión nueva: se recarga al estar (o volver) a un menú, así no se corta una actividad.
	useEffect(() => {
		if (onMenu && canAutoUpdate()) {
			reloadToLatest();
		}
	}, [onMenu, pathname, latestVersion]);

	if (!onMenu) {
		return null;
	}

	if (latestVersion) {
		return (
			<div className="app-banner" role="status">
				<span className="app-banner__text">Hay una versión nueva de Superletras</span>
				<button className="app-banner__button" type="button" onClick={reloadToLatest}>
					Actualizar
				</button>
			</div>
		);
	}

	if (canInstall && !installDismissed && !isInstalledApp()) {
		const dismiss = () => {
			writeStorage(STORAGE_KEYS.installPromptDismissedAt, String(Date.now()));
			setInstallDismissed(true);
		};
		return (
			<div className="app-banner" role="dialog" aria-label="Instalar Superletras">
				<img className="app-banner__icon" src="/icons/icon-192.png" alt="" />
				<span className="app-banner__text">¿Instalar Superletras? Se abre en pantalla completa y horizontal.</span>
				<button className="app-banner__button" type="button" onClick={promptInstall}>
					Instalar
				</button>
				<button className="app-banner__button app-banner__button--secondary" type="button" onClick={dismiss}>
					Ahora no
				</button>
			</div>
		);
	}

	return null;
}
