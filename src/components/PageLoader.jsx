import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { img } from "../lib/assets";
import "./PageLoader.css";

// Si una imagen no termina nunca, no se deja la pantalla tapada para siempre.
const MAX_WAIT_MS = 30000;
const FADE_MS = 300;
const CSS_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

// Junta las imágenes de la pantalla: <img> y fondos de CSS (también ::before/::after).
// Las del propio cartel de carga no cuentan.
function collectImages(root) {
	const urls = new Map();
	const inLoader = (element) => element.closest(".page-loader");
	root.querySelectorAll("img").forEach((element) => {
		const url = element.currentSrc || element.src;
		if (url && !urls.has(url) && !inLoader(element)) {
			urls.set(url, element);
		}
	});
	root.querySelectorAll("*").forEach((element) => {
		if (inLoader(element)) {
			return;
		}
		[null, "::before", "::after"].forEach((pseudo) => {
			const background = window.getComputedStyle(element, pseudo).backgroundImage;
			if (!background || background === "none") {
				return;
			}
			for (const [, , url] of background.matchAll(CSS_URL)) {
				if (url && !urls.has(url)) {
					urls.set(url, null);
				}
			}
		});
	});
	return urls;
}

function isLoaded(url, element) {
	if (element?.complete) {
		return true;
	}
	const probe = new Image();
	probe.src = url;
	return probe.complete;
}

function waitFor(url, element, done) {
	const target = element ?? new Image();
	const finish = () => {
		target.removeEventListener("load", finish);
		target.removeEventListener("error", finish);
		done();
	};
	target.addEventListener("load", finish);
	target.addEventListener("error", finish);
	if (!element) {
		target.src = url;
	} else if (element.complete) {
		finish();
	}
}

// Tapa la pantalla mientras se descargan sus imágenes (por ejemplo, después de una versión
// nueva con imágenes que todavía no están en la caché), mostrando cuánto falta.
// Si todo ya está en la caché no aparece.
export default function PageLoader() {
	const { pathname } = useLocation();
	const [progress, setProgress] = useState(null);
	const [hiding, setHiding] = useState(false);
	const scanRef = useRef(0);

	useLayoutEffect(() => {
		const root = document.getElementById("root");
		const scan = ++scanRef.current;
		const seen = new Set();
		let total = 0;
		let loaded = 0;
		let finished = false;
		const timers = [];
		const frames = [];

		const update = () => {
			if (scan !== scanRef.current || finished) {
				return;
			}
			if (loaded >= total) {
				finish();
				return;
			}
			setHiding(false);
			setProgress({ loaded, total });
		};

		const finish = () => {
			finished = true;
			if (total === 0) {
				setProgress(null);
				return;
			}
			setProgress({ loaded: total, total });
			setHiding(true);
			timers.push(window.setTimeout(() => {
				if (scan === scanRef.current) {
					setProgress(null);
					setHiding(false);
				}
			}, FADE_MS));
		};

		const addImages = () => {
			if (!root || finished) {
				return;
			}
			collectImages(root).forEach((element, url) => {
				if (seen.has(url)) {
					return;
				}
				seen.add(url);
				if (isLoaded(url, element)) {
					return;
				}
				total += 1;
				waitFor(url, element, () => {
					loaded += 1;
					update();
				});
			});
		};

		addImages();
		if (total > 0) {
			update();
		}
		// Algunas pantallas agregan imágenes en sus efectos: se vuelve a mirar unos cuadros después.
		const rescan = (remaining) => {
			frames.push(window.requestAnimationFrame(() => {
				if (scan !== scanRef.current || finished) {
					return;
				}
				addImages();
				if (remaining > 0) {
					rescan(remaining - 1);
				} else if (total === 0) {
					finished = true;
					setProgress(null);
				} else {
					update();
				}
			}));
		};
		rescan(2);
		timers.push(window.setTimeout(finish, MAX_WAIT_MS));

		return () => {
			finished = true;
			timers.forEach((id) => window.clearTimeout(id));
			frames.forEach((id) => window.cancelAnimationFrame(id));
		};
	}, [pathname]);

	if (!progress) {
		return null;
	}

	const percent = Math.round((progress.loaded / progress.total) * 100);
	return (
		<div
			className={`page-loader${hiding ? " page-loader--hiding" : ""}`}
			role="progressbar"
			aria-label="Cargando"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
		>
			{/* La imagen y la barra van en el mismo cuadro, así la barra queda siempre sobre el pasto. */}
			<div className="page-loader__scene">
				<img className="page-loader__image" src={img("cargando.jpg")} alt="" />
				<div className="page-loader__bar">
					<div className="page-loader__fill" style={{ width: `${percent}%` }} />
				</div>
			</div>
		</div>
	);
}
