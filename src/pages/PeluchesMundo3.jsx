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
import { elegirSinRepetir, opcionesDeRonda, ordenDeConsignas, ubicarOpciones } from "../lib/peluchesRondas";
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
// 2 rondas de dos dibujos y el resto de tres: los soportes (hamacas o cofres) son piezas sueltas
// sobre un fondo sin soportes, así que se ponen dos o tres según la ronda.
const CON_TRES = true;

// Centro de cada soporte (en % del ancho del escenario) según cuántos dibujos tiene la ronda, todo a
// la derecha del lugar del personaje (hasta el 26.5%). El tamaño sale del alto buscado (fracción del
// alto del escenario), con un ancho máximo para que no se toquen.
const POSICIONES = { 2: [41, 71.5], 3: [37.5, 60, 82.5] };
const ALTOS = { 2: 0.74, 3: 0.62 };
const ANCHOS_MAXIMOS = { 2: 0.27, 3: 0.205 };
const PROPORCION_ESCENARIO = 1600 / 883;
const COFRE_CAIDA_MS = 3000;
const BURBUJAS_ESTELA = Array.from({ length: 24 }, (_, indice) => ({
	y: `${3 + indice * 3}%`,
	lateral: [-0.38, 0.12, 0.42, -0.16, 0.3, -0.46][indice % 6],
	ancho: `${3.2 + (indice % 5) * 0.8}%`,
	retraso: `${Math.round(indice * COFRE_CAIDA_MS / (24 - 1))}ms`
}));

// Hamaca de Mundo 3. Medidas en fracciones de su imagen (recortada a su contorno): proporción
// alto / ancho, caja del dibujo apoyado en el asiento y cartel del frente donde va la palabra.
const HAMACA_M3 = {
	tipo: "hamaca",
	imagen: "hamaca.png",
	proporcion: 1181 / 600,
	objeto: { abajo: 0.22, alto: 0.46, ancho: 0.62 },
	placa: { y: 0.86, alto: 0.1, ancho: 0.76 }
};

// 6 rondas, cada sonido al menos una vez. Un sonido con una sola palabra (LLU: lluvia) se pide una
// vez: repetirlo era acertar de memoria. Se prefieren palabras nuevas y de hasta 3 sílabas. El error
// es del mismo grupo pero de otro sonido; un par fijo (MOÑO / MONO) manda sobre el sorteo, porque
// es el contraste que se quiere enseñar. El correcto se reparte entre los lugares (ubicarOpciones).
function crearRondas(grupo, pares = {}, conTres = CON_TRES) {
	const consignas = Object.keys(grupo);
	const orden = ordenDeConsignas(consignas, { maximo: (consigna) => grupo[consigna].length });
	const usadas = new Set();
	return ubicarOpciones(orden.map((consigna, indice) => {
		const [correcta] = elegirSinRepetir(preferirCortas(grupo[consigna]), usadas, 1);
		const distractores = preferirCortas(consignas.filter((otra) => otra !== consigna).flatMap((otra) => grupo[otra]));
		const cantidad = opcionesDeRonda(indice, conTres) - 1;
		const fijo = pares[correcta] ? [pares[correcta]] : [];
		fijo.forEach((palabra) => usadas.add(palabra));
		const sorteadas = elegirSinRepetir(distractores.filter((palabra) => !fijo.includes(palabra)), usadas, cantidad - fijo.length);
		return { consigna, correcta, incorrectas: [...fijo, ...sorteadas] };
	}));
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
			soporte={HAMACA_M3}
		/>
	);
}

// Escenario de Peluches de Mundos 3 a 6: un soporte suelto por dibujo (hamaca colgada de la viga o
// cofre en la arena) sobre un fondo sin soportes. Cada mundo pone sus grupos de palabras, su carpeta
// (imagenes/peluches/<carpeta>/ con fondo.jpg y la imagen del soporte, y sonido/<personaje>/peluche/<carpeta>/),
// el soporte con sus medidas y si la consigna es "contiene" (el sonido puede estar en el medio).
export function PeluchesPlataformas({ titulo, grupos, acentos = {}, pares = {}, carpeta, letraPorDefecto, mouthImages, consignaAudio, usaContiene, soporte, className = "" }) {
	usePageTitle(titulo);
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime, mouthImages);
	const menuOption = useActivityMenuOption();
	const [letra] = useState(() => (Object.prototype.hasOwnProperty.call(grupos, menuOption || "") ? menuOption : letraPorDefecto));
	const grupo = grupos[letra];
	const [rondas] = useState(() => crearRondas(grupo, pares));
	const textoDe = (id) => acentos[id] || id;
	const imagenDe = (id) => img(`peluches/${carpeta}/${id}.png`);
	const FONDO = img(`peluches/${carpeta}/fondo.jpg`);
	const IMAGEN_SOPORTE = img(`peluches/${carpeta}/${soporte.imagen}`);
	const IMAGEN_SOPORTE_INICIAL = soporte.imagenInicial ? img(`peluches/${carpeta}/${soporte.imagenInicial}`) : null;
	const IMAGEN_BURBUJA = IMAGEN_SOPORTE_INICIAL ? img("burbuja.png") : null;
	const [soportesAbiertos, setSoportesAbiertos] = useState(() => new Set());
	const [rondaVisible, setRondaVisible] = useState(() => (IMAGEN_SOPORTE_INICIAL ? -1 : undefined));
	const { activity, activityIndex, acertada, vibrating, premio, pista, elegir, escucharPalabra, repetirConsigna } = usePeluchesJuego({
		runtime,
		letra,
		rondas,
		consignaAudio: (consigna) => consignaAudio(letra, consigna),
		palabraAudio: (id) => `peluche/${carpeta}/${id}.mp3`,
		instructionAudioFile: usaContiene(letra) ? "pulsacontiene.mp3" : undefined,
		startTalking,
		stopTalking,
		rondaVisible
	});

	useEffect(() => {
		preloadImages([FONDO, IMAGEN_SOPORTE, IMAGEN_SOPORTE_INICIAL, IMAGEN_BURBUJA, ...rondas.flatMap((ronda) => ronda.options.map((option) => imagenDe(option.id)))].filter(Boolean));
	}, [rondas]);

	const cantidad = activity.options.length === 3 ? 3 : 2;
	const soportesListos = !IMAGEN_SOPORTE_INICIAL || soportesAbiertos.size >= cantidad;
	const actividadLista = soportesListos && (rondaVisible === undefined || rondaVisible === activityIndex);
	useEffect(() => {
		if (soportesListos && IMAGEN_SOPORTE_INICIAL) {
			setRondaVisible(activityIndex);
		}
	}, [activityIndex, soportesListos]);

	const posiciones = soporte.posiciones?.[cantidad] || POSICIONES[cantidad];
	const alto = soporte.altos?.[cantidad] || ALTOS[cantidad];
	// Medidas del soporte para el CSS (fracciones de su imagen y del escenario).
	const medidas = {
		"--pm3-ancho": Math.min(alto / (PROPORCION_ESCENARIO * soporte.proporcion), soporte.anchosMaximos?.[cantidad] || ANCHOS_MAXIMOS[cantidad]),
		"--pm3-prop": soporte.proporcion,
		// Las hamacas cuelgan de la viga (borde de arriba); los cofres se apoyan en la arena (borde de abajo).
		"--pm3-sop-arriba": `${soporte.arriba ?? 12.5}%`,
		"--pm3-sop-abajo": `${soporte.abajo ?? 6}%`,
		"--pm3-obj-abajo": soporte.objeto.abajo,
		"--pm3-obj-alto": soporte.objeto.alto,
		"--pm3-obj-ancho": soporte.objeto.ancho,
		"--pm3-placa-y": soporte.placa.y,
		"--pm3-placa-alto": soporte.placa.alto,
		"--pm3-placa-ancho": soporte.placa.ancho,
		"--pm3-frente": soporte.frente || 0
	};

	return (
		<div className={`page activity-page page-peluches-m3 ${className}`.trim()}>
			<BackButton />
			<FullscreenButton toggle />
			{/* Escenario con las proporciones del fondo (1600x883): todo se ubica en % sobre él. */}
			<main className={`pm3-stage pm3-con-${cantidad}${actividadLista ? "" : " pm3-esperando-cofres"}`} style={{ backgroundImage: `url("${FONDO}")`, ...medidas }}>
				<div className="pm3-sign" key={`cartel-${activityIndex}`} aria-live="polite">
					<span>{activity.consigna.toUpperCase()}</span>
				</div>
				{IMAGEN_SOPORTE_INICIAL ? activity.options.map((_, optionIndex) => (
					<div key={`estela-cofre-${optionIndex}`} className="pm3-cofre-estela" aria-hidden="true">
						{BURBUJAS_ESTELA.map((burbuja, indice) => (
							<img
								key={indice}
								className="pm3-cofre-burbuja"
								src={IMAGEN_BURBUJA}
								alt=""
								draggable={false}
								style={{
									"--pm3-burbuja-x": `${posiciones[optionIndex] + burbuja.lateral * medidas["--pm3-ancho"] * 100}%`,
									"--pm3-burbuja-y": burbuja.y,
									"--pm3-burbuja-ancho": burbuja.ancho,
									"--pm3-burbuja-retraso": burbuja.retraso
								}}
							/>
						))}
					</div>
				)) : null}
				{activity.options.map((option, optionIndex) => {
					const texto = textoDe(option.id);
					const classNames = ["pm3-option", "opcion-peluche"];
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
					const cofreAbierto = !IMAGEN_SOPORTE_INICIAL || soportesAbiertos.has(optionIndex);
					const cofreCayendo = Boolean(IMAGEN_SOPORTE_INICIAL && !cofreAbierto);
					// El soporte queda montado entre rondas (al pasar de dos a tres se corre a su lugar nuevo);
					// lo de adentro se vuelve a montar en cada ronda para que se balancee con el dibujo nuevo.
					return (
						<div
							key={`soporte-${optionIndex}`}
							className={`pm3-soporte pm3-soporte-${soporte.tipo}${IMAGEN_SOPORTE_INICIAL ? " pm3-soporte-cofre-inicial" : ""}${cofreCayendo ? " pm3-soporte-cayendo" : ""}`}
							style={{ "--pm3-x": `${posiciones[optionIndex]}%`, "--pm3-caida-duracion": `${COFRE_CAIDA_MS}ms` }}
							onAnimationEnd={(event) => {
								if (event.target !== event.currentTarget || event.animationName !== "pm3-cofre-caida") {
									return;
								}
								setSoportesAbiertos((abiertos) => new Set(abiertos).add(optionIndex));
							}}
						>
							<div key={`ronda-${activityIndex}-${actividadLista}`} className="pm3-vaiven">
								<img className="pm3-soporte-img" src={cofreAbierto ? IMAGEN_SOPORTE : IMAGEN_SOPORTE_INICIAL} alt="" draggable={false} />
								{/* Cofre: la pared de adelante va otra vez por encima del dibujo, que así sale de adentro. */}
								{soporte.frente && cofreAbierto ? <img className="pm3-soporte-img pm3-soporte-frente" src={IMAGEN_SOPORTE} alt="" draggable={false} /> : null}
								<button
									type="button"
									className={classNames.join(" ")}
									onClick={() => elegir(option)}
									aria-label={texto}
									disabled={!actividadLista}
								>
									<img src={imagenDe(option.id)} alt={texto} draggable={false} />
								</button>
								<button
									type="button"
									className="pm3-name"
									style={{ "--letras": Math.max(texto.length, 4) }}
									onClick={() => escucharPalabra(option.id)}
									aria-label={`Escuchar ${texto}`}
									disabled={!actividadLista}
								>
										<PalabraResaltada grupo={grupo} id={option.id} texto={texto} />
								</button>
							</div>
						</div>
					);
				})}
			</main>
			<Character character={character} mouth={mouth} onClick={repetirConsigna} label="Repetir consigna" />
			<PremioComida premio={premio} />
		</div>
	);
}
