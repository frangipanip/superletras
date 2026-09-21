import { readStorage, STORAGE_KEYS } from "./storage";

// Texto en español que reemplaza cada audio grabado, para decirlo con TTS local
// (window.speechSynthesis) en vez de reproducir el archivo. La transcripción es una
// inferencia a partir del nombre de archivo y de cómo lo usa cada pantalla: no hay
// forma de escuchar los .wav/.m4a originales, así que si algo suena distinto a lo
// grabado, se ajusta acá.
//
// "aleteo.mp3" queda afuera a propósito: es un efecto (aleteo de mariposa), no hay
// texto que lo represente, y sigue reproduciéndose como archivo real.
export const SPEECH_TEXT = {
	// Vocales cortas
	"A.wav": "a",
	"E.wav": "e",
	"I.wav": "i",
	"O.wav": "o",
	"U.wav": "u",

	// Vocales alargadas (paso "largo" de la presentación de Mundo 1)
	"Alargo.m4a": "aaaa",
	"Elargo.m4a": "eeee",
	"Ilargo.m4a": "iiii",
	"Olargo.m4a": "oooo",
	"Ulargo.m4a": "uuuu",

	// Sílabas con L
	"la.wav": "la",
	"le.wav": "le",
	"li.wav": "li",
	"lo.wav": "lo",
	"lu.wav": "lu",
	"LAlargo.m4a": "laaaa",
	"LElargo.m4a": "leeee",
	"LIlargo.m4a": "liiii",
	"LOlargo.m4a": "loooo",
	"LUlargo.m4a": "luuuu",

	// Sílabas con M
	"ma.wav": "ma",
	"me.wav": "me",
	"mi.wav": "mi",
	"mo.wav": "mo",
	"mu.wav": "mu",

	// Sílabas con S
	"SA.m4a": "sa",
	"SE.m4a": "se",
	"SI.m4a": "si",
	"SO.m4a": "so",
	"SU.m4a": "su",

	// Sílabas con T
	"TA.m4a": "ta",
	"TE2.m4a": "te",
	"TI.m4a": "ti",
	"TO.m4a": "to",
	"TU.m4a": "tu",

	// Nombres de letras
	"Ele.m4a": "ele",
	"Eme.m4a": "eme",
	"Ese.m4a": "ese",
	"Te.m4a": "te",

	// Secuencias del tren (modo vocales)
	"Oe.m4a": "oe",
	"Ea.m4a": "ea",
	"Aa.m4a": "aa",
	"Oia.m4a": "oia",
	"Uau.m4a": "uau",
	"Vagones.m4a": "¡Vagones!",

	// Celebración y feedback
	"Fabuloso.m4a": "¡Fabuloso!",
	"Felicitaciones.m4a": "¡Felicitaciones!",
	"correcto.mp3": "¡Correcto!",
	"error.mp3": "¡Uy!",

	// Consignas e instrucciones
	"Presion.m4a": "Ahora presioná cada una",
	"Mezclarvocales.m4a": "Vamos a mezclarlas",
	"yahoraconmovimiento.mp4": "Y ahora con movimiento",
	"Pulsavocal.m4a": "Pulsá la vocal",
	"Pulsa silaba.m4a": "Pulsá la sílaba",
	"Pulsa.m4a": "Pulsá",
	"EstaEsLaLetra.m4a": "Esta es la letra",
	"ConLasVocales.m4a": "con las vocales",
	"SilabasA.m4a": "Estas son las vocales",
	"Vocales.m4a": "Vocales",
	"Inicio Mundos.mp4": "¡Bienvenido a Mundo uno! Elegí una letra para empezar a jugar."
};

export function textForSoundFile(fileName) {
	return SPEECH_TEXT[fileName] || null;
}

// ~13 caracteres por segundo a velocidad de habla normal; sirve para simular
// "duration"/"currentTime" del audio, que algunas pantallas usan para sincronizar
// la boca del personaje mientras habla.
function estimateSpeechDuration(text) {
	return Math.max(0.35, text.length / 13);
}

// El personaje elegido (ver useSelectedCharacter) decide qué voz usar: supernena
// habla con voz femenina, supernene con voz masculina.
const CHARACTER_VOICE_GENDER = {
	supernena: "female",
	supernene: "male"
};

// SpeechSynthesisVoice no trae un campo de género estandarizado: se adivina por
// nombres típicos de voces en español de Windows/Edge, macOS/iOS y Android/Chrome.
const VOICE_NAME_HINTS = {
	female: [
		"mujer", "female", "femenin",
		"sabina", "helena", "laura", "elvira", "dalia", "ximena", "paulina",
		"monica", "mónica", "lucia", "lucía", "conchita", "esperanza", "paloma",
		"marisol", "catalina", "isabela", "valentina", "victoria", "camila",
		"zira", "carmen", "rocio", "rocío", "carla"
	],
	male: [
		"hombre", "male", "masculin",
		"pablo", "raul", "raúl", "alonso", "jorge", "alvaro", "álvaro",
		"juan", "diego", "carlos", "enrique", "fernando", "miguel", "andres",
		"andrés", "tomas", "tomás", "eduardo", "gonzalo"
	]
};

// La supernena habla más rápido que el supernene, siempre, sea cual sea la voz
// que termine usando cada una.
const RATE_BY_GENDER = {
	female: 1.15,
	male: 0.88
};

// La supernena siempre habla con el tono un poco más agudo (menos grave), sea cual
// sea la voz que termine usando.
const FEMALE_PITCH = 1.25;

// Tono de respaldo para el varón cuando no hay dos voces distintas para diferenciar:
// bastante marcado a propósito, porque el pitch de las voces "de red" (las
// "Google español" que da Chrome) a veces se aplica muy débil.
const FALLBACK_MALE_PITCH = 0.7;

let cachedSpanishVoices = null;
let cachedNamedVoiceByGender = new Map();
let cachedVoice;
let cachedVoicesKnown = false;

function spanishVoices() {
	if (cachedSpanishVoices) {
		return cachedSpanishVoices;
	}
	const voices = window.speechSynthesis.getVoices();
	if (voices.length === 0) {
		return [];
	}
	cachedSpanishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("es"));
	return cachedSpanishVoices;
}

// Voz con nombre reconocible del género pedido (ver VOICE_NAME_HINTS).
function pickNamedVoiceForGender(gender) {
	if (cachedNamedVoiceByGender.has(gender)) {
		return cachedNamedVoiceByGender.get(gender);
	}
	const hints = VOICE_NAME_HINTS[gender] || [];
	const match = spanishVoices().find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint)));
	cachedNamedVoiceByGender.set(gender, match);
	return match;
}

// Cuando hay dos o más voces en español pero ninguna trae un nombre reconocible,
// se les asigna una voz distinta a cada género (ordenadas por nombre, siempre igual)
// para que al menos timbre real sea distinto, no solo el tono simulado.
function pickDistinctVoiceForGender(gender) {
	const voices = spanishVoices();
	if (voices.length < 2) {
		return undefined;
	}
	const sorted = [...voices].sort((a, b) => a.name.localeCompare(b.name));
	return gender === "female" ? sorted[sorted.length - 1] : sorted[0];
}

function pickSpanishVoice() {
	if (typeof window === "undefined" || !window.speechSynthesis) {
		return undefined;
	}
	const voices = window.speechSynthesis.getVoices();
	if (voices.length === 0) {
		return cachedVoice;
	}
	if (!cachedVoicesKnown) {
		const byLang = (lang) => voices.find((voice) => voice.lang?.toLowerCase() === lang);
		cachedVoice =
			byLang("es-ar") ||
			byLang("es-419") ||
			byLang("es-es") ||
			voices.find((voice) => voice.lang?.toLowerCase().startsWith("es"));
		cachedVoicesKnown = true;
	}
	return cachedVoice;
}

// Devuelve la voz a usar y el pitch/rate a aplicar para el género pedido. La
// velocidad depende siempre del género (la supernena habla más rápido) y la
// supernena siempre suma su tono más agudo; la voz prioriza, en orden: una con
// nombre reconocible > una distinta a la del otro género > la voz genérica de
// siempre con el tono de respaldo del varón bien marcado.
function voiceStyleForGender(gender) {
	if (typeof window === "undefined" || !window.speechSynthesis || !gender) {
		return { voice: undefined, pitch: undefined, rate: undefined };
	}
	const rate = RATE_BY_GENDER[gender];
	const pitch = gender === "female" ? FEMALE_PITCH : undefined;
	const namedVoice = pickNamedVoiceForGender(gender);
	if (namedVoice) {
		return { voice: namedVoice, pitch, rate };
	}
	const distinctVoice = pickDistinctVoiceForGender(gender);
	if (distinctVoice) {
		return { voice: distinctVoice, pitch, rate };
	}
	return { voice: pickSpanishVoice(), pitch: pitch ?? FALLBACK_MALE_PITCH, rate };
}

function currentCharacterGender() {
	return CHARACTER_VOICE_GENDER[readStorage(STORAGE_KEYS.character)] || null;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
	window.speechSynthesis.addEventListener?.("voiceschanged", () => {
		cachedVoicesKnown = false;
		cachedSpanishVoices = null;
		cachedNamedVoiceByGender = new Map();
	});
}

// Imita la porción de la API de <audio> que usan las pantallas (play/pause,
// currentTime, duration, onended, ontimeupdate) pero hablando el texto en vez de
// reproducir un archivo. Cada .play() genera una nueva alocución: los elementos de
// audio en esta app se reproducen varias veces a lo largo de su vida.
export function createSpeechElement(text, { rate = 0.95, pitch = 1.05 } = {}) {
	const duration = estimateSpeechDuration(text);
	const target = new EventTarget();
	let currentTime = 0;
	let paused = true;
	let ended = false;
	let progressTimer = null;
	let onendedHandler = null;
	let ontimeupdateHandler = null;

	function stopProgress() {
		if (progressTimer !== null) {
			window.clearInterval(progressTimer);
			progressTimer = null;
		}
	}

	function finish() {
		stopProgress();
		paused = true;
		ended = true;
		currentTime = duration;
		ontimeupdateHandler?.();
		target.dispatchEvent(new Event("ended"));
		onendedHandler?.();
	}

	const element = {
		get currentTime() {
			return currentTime;
		},
		set currentTime(value) {
			currentTime = value;
			if (value === 0) {
				ended = false;
			}
		},
		get duration() {
			return duration;
		},
		get paused() {
			return paused;
		},
		get ended() {
			return ended;
		},
		get onended() {
			return onendedHandler;
		},
		set onended(handler) {
			onendedHandler = handler;
		},
		get ontimeupdate() {
			return ontimeupdateHandler;
		},
		set ontimeupdate(handler) {
			ontimeupdateHandler = handler;
		},
		addEventListener: target.addEventListener.bind(target),
		removeEventListener: target.removeEventListener.bind(target),
		play() {
			window.speechSynthesis.cancel();
			stopProgress();
			paused = false;
			ended = false;
			currentTime = 0;
			const utterance = new window.SpeechSynthesisUtterance(text);
			utterance.lang = "es-AR";
			const gender = currentCharacterGender();
			const style = voiceStyleForGender(gender);
			const voice = style.voice || pickSpanishVoice();
			if (voice) {
				utterance.voice = voice;
			}
			utterance.rate = style.rate ?? rate;
			utterance.pitch = style.pitch ?? pitch;
			const startedAt = Date.now();
			progressTimer = window.setInterval(() => {
				currentTime = Math.min((Date.now() - startedAt) / 1000, duration);
				ontimeupdateHandler?.();
			}, 60);
			utterance.onend = finish;
			utterance.onerror = finish;
			window.speechSynthesis.speak(utterance);
			return Promise.resolve();
		},
		pause() {
			stopProgress();
			if (!paused) {
				paused = true;
				window.speechSynthesis.cancel();
				target.dispatchEvent(new Event("pause"));
			}
		}
	};

	return element;
}
