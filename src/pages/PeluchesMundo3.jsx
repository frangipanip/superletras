import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import Character from "../components/Character";
import FullscreenButton from "../components/FullscreenButton";
import PremioComida from "../components/PremioComida";
import { useActivityMenuOption } from "../hooks/useActivityMenuOption";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePeluchesJuego } from "../hooks/usePeluchesJuego";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { img, MUNDO3_MOUTH_IMAGES, preloadImages } from "../lib/assets";
import { shuffle } from "../lib/shuffle";
import "./actividad.css";
import { preferirCortas } from "../lib/palabrasCortas";
import "./PeluchesMundo3.css";

// Palabras de Mundo 3 por grupo y sonido, tal como vienen clasificadas (el sonido puede estar al
// comienzo o en el medio: no se deduce separando en sílabas). Los grupos no se mezclan entre sí.
// Imagen: peluches/MUNDO3/<id>.png. Audio: sonido/<personaje>/peluche/MUNDO3/<id>.mp3.
const GRUPOS = {
	// R fuerte
	r: {
		ra: ["raton", "raqueta", "rayo"],
		re: ["reloj", "regalo", "regla"],
		ri: ["rinoceronte", "rio", "risa"],
		ro: ["robot", "roca", "rosa"],
		ru: ["rueda", "ruleta", "rubi"]
	},
	rr: {
		rra: ["jarra", "guitarra", "cigarra"],
		rre: ["torre", "barrera", "carreta"],
		rri: ["parrilla", "barril", "barrilete"],
		rro: ["perro", "gorro", "burro"],
		rru: ["serrucho", "carrusel", "carruaje"]
	},
	// R suave (en el menú de Mundo 3 es "AR")
	ar: {
		ra: ["pera", "cara", "pirata"],
		re: ["sirena", "cereza", "titere"],
		ri: ["mariposa", "gorila", "nariz"],
		ro: ["aro", "loro", "corona"],
		ru: ["oruga", "piruleta", "ciruela"]
	},
	// Sin YI: no hay palabras para ese sonido.
	y: {
		ya: ["yacare", "yate"],
		ye: ["yema", "yeso"],
		yo: ["yoyo", "yoga"],
		yu: ["yudo", "yunque"]
	},
	ll: {
		lla: ["llama", "llave"],
		lle: ["ballena", "galleta"],
		lli: ["gallina", "pollito"],
		llo: ["gallo", "llorar"],
		llu: ["lluvia"]
	}
};
const ACENTOS = {
	raton: "ratón",
	rio: "río",
	rubi: "rubí",
	titere: "títere",
	yacare: "yacaré",
	yoyo: "yoyó"
};
const AUDIOS_R_SUAVE = {
	ra: "ra suave.mp3",
	re: "re suave.mp3",
	ri: "ri suave.mp3",
	ro: "ro suave.mp3",
	ru: "ru suave.mp3"
};
// Cada sonido se pide dos veces (con imágenes distintas), como en los otros mundos.
const VUELTAS = 2;


// Lado (0 izquierda, 1 derecha) del correcto en cada ronda: mitad y mitad, sin más de dos seguidos.
function ladosAlternados(cantidad) {
	const lados = [];
	for (let index = 0; index < cantidad; index += 1) {
		const repetido = index >= 2 && lados[index - 1] === lados[index - 2];
		const izquierdas = lados.filter((lado) => lado === 0).length;
		const derechas = index - izquierdas;
		if (repetido) {
			lados.push(1 - lados[index - 1]);
		} else if (izquierdas - derechas >= 1) {
			lados.push(1);
		} else if (derechas - izquierdas >= 1) {
			lados.push(0);
		} else {
			lados.push(Math.random() < 0.5 ? 0 : 1);
		}
	}
	return lados;
}

function crearRondas(grupo) {
	const consignas = Object.keys(grupo);
	const usadas = new Set();
	const sinOrden = [];
	for (let vuelta = 0; vuelta < VUELTAS; vuelta += 1) {
		let orden = shuffle(consignas);
		// Que no se repita el mismo sonido entre el final de una vuelta y el comienzo de la otra.
		if (orden.length > 1 && orden[0] === sinOrden[sinOrden.length - 1]?.consigna) {
			orden = [...orden.slice(1), orden[0]];
		}
		orden.forEach((consigna) => {
			// Se prefieren palabras que todavía no aparecieron (ni como acierto ni como error).
			const opciones = grupo[consigna];
			// Un sonido con una sola palabra (LLU: lluvia) se pide una vez: repetirlo era acertar de memoria.
			if (vuelta >= opciones.length) {
				return;
			}
			// Se prefieren palabras de hasta 3 sílabas.
			const nuevas = preferirCortas(opciones.filter((palabra) => !usadas.has(palabra)));
			const correcta = shuffle(nuevas.length ? nuevas : opciones)[0];
			usadas.add(correcta);
			// El error es del mismo grupo pero de otro sonido.
			const distractores = consignas.filter((otra) => otra !== consigna).flatMap((otra) => grupo[otra]);
			const noUsados = preferirCortas(distractores.filter((palabra) => !usadas.has(palabra)));
			const incorrecta = shuffle(noUsados.length ? noUsados : distractores)[0];
			usadas.add(incorrecta);
			sinOrden.push({ consigna, correcta, incorrecta });
		});
	}
	const lados = ladosAlternados(sinOrden.length);
	return sinOrden.map(({ consigna, correcta, incorrecta }, index) => {
		const opciones = [{ id: correcta, correct: true }, { id: incorrecta, correct: false }];
		return { consigna, options: lados[index] === 0 ? opciones : opciones.reverse() };
	});
}

// Sonido de la palabra dentro del grupo (puede estar en el medio: "guitaRRA", "ciRUela").
function sonidoDe(grupo, id) {
	return Object.keys(grupo).find((consigna) => grupo[consigna].includes(id));
}

// Palabra con el sonido resaltado. Las tildes no cambian el largo, así que el índice sirve en el texto.
function PalabraResaltada({ grupo, id, texto }) {
	const sonido = sonidoDe(grupo, id);
	const inicio = sonido ? id.indexOf(sonido) : -1;
	if (inicio < 0) {
		return texto;
	}
	const fin = inicio + sonido.length;
	return (
		<>
			{texto.slice(0, inicio)}
			<span className="requested-sound">{texto.slice(inicio, fin)}</span>
			{texto.slice(fin)}
		</>
	);
}

export default function PeluchesMundo3() {
	return (
		<PeluchesPlataformas
			titulo="Peluches - Mundo 3"
			grupos={GRUPOS}
			acentos={ACENTOS}
			carpeta="MUNDO3"
			letraPorDefecto="r"
			mouthImages={MUNDO3_MOUTH_IMAGES}
			consignaAudio={(letra, consigna) => (letra === "ar" ? AUDIOS_R_SUAVE[consigna] : `${consigna}.mp3`)}
			usaContiene={(letra) => letra === "rr" || letra === "ar"}
		/>
	);
}

// Escenario de dos plataformas con un dibujo cada una (Mundos 3 y 4): cada mundo pone sus grupos
// de palabras, su carpeta (imagenes/peluches/<carpeta>/ con fondo.jpg y sonido/<personaje>/peluche/<carpeta>/)
// y si la consigna es "contiene" (el sonido puede estar en el medio de la palabra).
export function PeluchesPlataformas({ titulo, grupos, acentos = {}, carpeta, letraPorDefecto, mouthImages, consignaAudio, usaContiene, className = "" }) {
	usePageTitle(titulo);
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const menuOption = useActivityMenuOption();
	const [letra] = useState(() => (Object.prototype.hasOwnProperty.call(grupos, menuOption || "") ? menuOption : letraPorDefecto));
	const grupo = grupos[letra];
	const [rondas] = useState(() => crearRondas(grupo));
	const textoDe = (id) => acentos[id] || id;
	const imagenDe = (id) => img(`peluches/${carpeta}/${id}.png`);
	const FONDO = img(`peluches/${carpeta}/fondo.jpg`);
	const { activity, activityIndex, acertada, vibrating, premio, pista, elegir, escucharPalabra, repetirConsigna } = usePeluchesJuego({
		runtime,
		letra,
		rondas,
		consignaAudio: (consigna) => consignaAudio(letra, consigna),
		palabraAudio: (id) => `peluche/${carpeta}/${id}.mp3`,
		instructionAudioFile: usaContiene(letra) ? "pulsacontiene.mp3" : undefined,
		startTalking,
		stopTalking
	});

	useEffect(() => {
		preloadImages([FONDO, ...rondas.flatMap((ronda) => ronda.options.map((option) => imagenDe(option.id)))]);
	}, [rondas]);

	return (
		<div className={`page activity-page page-peluches-m3 ${className}`.trim()}>
			<BackButton />
			<FullscreenButton toggle />
			{/* Escenario con las proporciones del fondo (1600x883): todo se ubica en % sobre él. */}
			<main className="pm3-stage" style={{ backgroundImage: `url("${FONDO}")` }}>
				<div className="pm3-sign" key={`cartel-${activityIndex}`} aria-live="polite">
					<span>{activity.consigna.toUpperCase()}</span>
				</div>
				{activity.options.map((option, optionIndex) => {
					const texto = textoDe(option.id);
					const classNames = ["pm3-option", `pm3-side-${optionIndex + 1}`];
					if (acertada === option.id) {
						classNames.push("correct");
					} else if (acertada) {
						classNames.push("dimmed");
					}
					if (vibrating.has(option.id)) {
						classNames.push("vibrating");
					}
					if (pista && option.correct) {
						classNames.push("pista-correcta");
					}
					return [
						<button
							key={`${activityIndex}-${option.id}`}
							type="button"
							className={classNames.join(" ")}
							onClick={() => elegir(option)}
							aria-label={texto}
						>
							<img src={imagenDe(option.id)} alt={texto} draggable={false} />
						</button>,
						<button
							key={`${activityIndex}-${option.id}-nombre`}
							type="button"
							className={`pm3-name pm3-side-${optionIndex + 1}`}
							style={{ "--letras": Math.max(texto.length, 4) }}
							onClick={() => escucharPalabra(option.id)}
							aria-label={`Escuchar ${texto}`}
						>
							<PalabraResaltada grupo={grupo} id={option.id} texto={texto} />
						</button>
					];
				})}
			</main>
			<Character character={character} mouth={mouth} onClick={repetirConsigna} label="Repetir consigna" />
			<PremioComida premio={premio} />
		</div>
	);
}
