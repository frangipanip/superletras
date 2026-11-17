import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import IconoParlante from "../components/IconoParlante";
import PremioComida from "../components/PremioComida";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePeluchesJuego } from "../hooks/usePeluchesJuego";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, preloadImages } from "../lib/assets";
import {
	audioPalabraPeluche,
	audioSonidoMundo1,
	BANCO_PELUCHES,
	imagenPeluche,
	imagenPelucheRespaldo,
	palabrasQueEmpiezanCon,
	sonidosDeLetra,
	VOCALES
} from "../lib/peluchesMundo1";
import { elegirSinRepetir, opcionesDeRonda, ordenDeConsignas, ubicarOpciones } from "../lib/peluchesRondas";
import { readMenuOption } from "../lib/storage";
import "./actividad.css";
import "./Iniciales.css";

// 6 rondas: las 2 primeras con dos dibujos y las 4 siguientes con tres. Cada sonido de la letra se
// pide al menos una vez; los dibujos equivocados empiezan con otro sonido de la misma letra.
function crearRondas(letra) {
	const consignas = sonidosDeLetra(letra).filter((sonido) => palabrasQueEmpiezanCon(sonido).length > 0);
	const orden = ordenDeConsignas(consignas, { maximo: (sonido) => palabrasQueEmpiezanCon(sonido).length });
	const usadas = new Set();
	return ubicarOpciones(orden.map((consigna, indice) => {
		const [correcta] = elegirSinRepetir(palabrasQueEmpiezanCon(consigna), usadas, 1);
		const distractores = BANCO_PELUCHES.filter((palabra) => {
			const perteneceAlGrupo = letra === "a"
				? VOCALES.some((vocal) => palabra.startsWith(vocal))
				: palabra.startsWith(letra);
			return perteneceAlGrupo && !palabra.startsWith(consigna);
		});
		const incorrectas = elegirSinRepetir(distractores, usadas, opcionesDeRonda(indice) - 1);
		return { consigna, correcta, incorrectas };
	}));
}

export default function Peluche() {
	usePageTitle("Peluche - Mundo 1");
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	// Una opción guardada que no es una letra de Mundo 1 (por ejemplo "palabras") dejaba la pantalla en blanco.
	const [letra] = useState(() => (["a", "l", "m", "s", "t"].includes(readMenuOption()) ? readMenuOption() : "a"));
	const [rondas] = useState(() => crearRondas(letra));
	const largoResaltado = letra === "a" ? 1 : 2;
	const { activity, activityIndex, acertada, vibrating, premio, pista, esperandoConsigna, elegir, escucharPalabra, repetirConsigna } = usePeluchesJuego({
		runtime,
		letra,
		rondas,
		consignaAudio: audioSonidoMundo1,
		palabraAudio: audioPalabraPeluche,
		startTalking,
		stopTalking
	});

	useEffect(() => {
		preloadImages(rondas.flatMap((ronda) => ronda.options.flatMap((option) => [
			imagenPeluche(option.id),
			imagenPelucheRespaldo(option.id)
		])));
	}, [rondas]);

	return (
		<div className={`page activity-page page-peluche${esperandoConsigna ? " peluches-esperando" : ""}`}>
			<BackButton />
			<FullscreenButton toggle />
			<main className="initials-activity">
				<section className={`initials-grid${activity.options.length > 2 ? " initials-grid--tres" : ""}`} aria-label="Imágenes para elegir">
					{activity.options.map((option, optionIndex) => {
						const classNames = ["initials-option", "opcion-peluche"];
						if (acertada === option.id) {
							classNames.push("correct");
						}
						if (vibrating.has(option.id)) {
							classNames.push("vibrating");
						}
						if (pista && option.correct) {
							classNames.push("pista-correcta");
						}
						return (
							<div className="initials-item" key={`${activityIndex}-${option.id}`}>
								<div className="initials-display">
									<img
										className="initials-pedestal"
										src={img(`peluches/${option.id.length > 7 ? "basetortaLarga" : "basetorta"}.png`)}
										alt=""
										aria-hidden="true"
									/>
									<button
										type="button"
										className={classNames.join(" ")}
										onClick={() => elegir(option)}
										aria-label={option.id}
									>
										<img
											src={imagenPeluche(option.id)}
											alt={option.id}
											onError={(event) => {
												event.currentTarget.onerror = null;
												event.currentTarget.src = imagenPelucheRespaldo(option.id);
											}}
										/>
									</button>
									<button
										type="button"
										className={`initials-name color-${(activityIndex * 3 + optionIndex) % 4}`}
										onClick={() => escucharPalabra(option.id)}
										aria-label={`Escuchar ${option.id}`}
									>
										<span className="palabra-parlante"><IconoParlante /></span>
										<span className="requested-sound">{option.id.slice(0, largoResaltado)}</span>
										{option.id.slice(largoResaltado)}
									</button>
								</div>
							</div>
						);
					})}
				</section>
			</main>
			<Character character={character} mouth={mouth} onClick={repetirConsigna} label="Repetir consigna" />
			<PremioComida premio={premio} />
		</div>
	);
}
