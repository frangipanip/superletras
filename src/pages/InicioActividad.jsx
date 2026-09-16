import BackButton from "../components/BackButton";
import FullscreenButton from "../components/FullscreenButton";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageRuntime } from "../hooks/usePageRuntime";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import { useTalkingMouth } from "../hooks/useTalkingMouth";
import { CHARACTERS, sound } from "../lib/assets";
import "./actividad.css";
import "./InicioActividad.css";

const VOWELS = ["A", "E", "I", "O", "U"];

export default function InicioActividad() {
	usePageTitle("Inicio - Mundo 1");
	const location = useLocation();
	const runtime = usePageRuntime();
	const [character] = useSelectedCharacter();
	const { mouth, startTalking, stopTalking } = useTalkingMouth(runtime);
	const [audios] = useState(() => ({
		syllables: runtime.audio(sound("SilabasA.m4a"), { preload: true }),
		pressure: runtime.audio(sound("Presion.m4a"), { preload: true }),
		vowelsLong: Object.fromEntries(VOWELS.map((vowel) => [vowel, runtime.audio(sound(`${vowel}largo.m4a`), { preload: true })])),
		vowelsShort: Object.fromEntries(VOWELS.map((vowel) => [vowel, runtime.audio(sound(`${vowel}.wav`), { preload: true })]))
	}));
	const [activeVowel, setActiveVowel] = useState(null);
	const sequenceTimer = useRef(0);
	const menuOption = location.state?.menuOption;

	function playVowel(vowel) {
		runtime.clearTimeout(sequenceTimer.current);
		audios.syllables.onended = null;
		audios.syllables.pause();
		audios.pressure.onended = null;
		audios.pressure.pause();
		[...Object.values(audios.vowelsLong), ...Object.values(audios.vowelsShort)].forEach((vowelAudio) => {
			vowelAudio.onended = null;
			vowelAudio.pause();
			vowelAudio.currentTime = 0;
		});
		const vowelAudio = audios.vowelsShort[vowel];
		setActiveVowel(vowel);
		startTalking();
		vowelAudio.onended = () => {
			vowelAudio.onended = null;
			setActiveVowel(null);
			stopTalking();
		};
		vowelAudio.play().catch(() => {
			vowelAudio.onended = null;
			setActiveVowel(null);
			stopTalking();
		});
	}

	useEffect(() => {
		if (menuOption !== "a") {
			return undefined;
		}
		let vowelIndex = 0;

		function playNextVowel() {
			if (vowelIndex >= VOWELS.length) {
				setActiveVowel(null);
				stopTalking();
				return;
			}
			const vowel = VOWELS[vowelIndex];
			const vowelAudio = audios.vowelsLong[vowel];
			vowelIndex += 1;
			setActiveVowel(vowel);
			startTalking();
			vowelAudio.currentTime = 0;
			vowelAudio.onended = () => {
				vowelAudio.onended = null;
				stopTalking();
				setActiveVowel(null);
				sequenceTimer.current = runtime.setTimeout(() => {
					if (vowel === "U") {
						audios.pressure.currentTime = 0;
						audios.pressure.onended = stopTalking;
						startTalking();
						audios.pressure.play().catch(stopTalking);
						return;
					}
					playNextVowel();
				}, 180);
			};
			vowelAudio.play().catch(() => {
				vowelAudio.onended = null;
				stopTalking();
				setActiveVowel(null);
			});
		}

		audios.syllables.onended = playNextVowel;
		audios.syllables.currentTime = 0;
		startTalking();
		audios.syllables.play().catch(() => {
			stopTalking();
		});
		return () => {
			runtime.clearTimeout(sequenceTimer.current);
			audios.syllables.onended = null;
			audios.syllables.pause();
			audios.syllables.currentTime = 0;
			audios.pressure.onended = null;
			audios.pressure.pause();
			audios.pressure.currentTime = 0;
			[...Object.values(audios.vowelsLong), ...Object.values(audios.vowelsShort)].forEach((vowelAudio) => {
				vowelAudio.onended = null;
				vowelAudio.pause();
				vowelAudio.currentTime = 0;
			});
			setActiveVowel(null);
			stopTalking();
		};
	}, [audios, menuOption]);

	return (
		<div className="page activity-page page-inicio-actividad">
			<BackButton />
			<FullscreenButton toggle />
			<main className="inicio-activity-panel">
				<div className="inicio-vowels" aria-label="Vocales">
					{VOWELS.map((vowel) => (
						<button
							key={vowel}
							className={`inicio-vowel-button inicio-vowel-${vowel.toLowerCase()}${activeVowel === vowel ? " active" : ""}`}
							type="button"
							aria-label={`Reproducir vocal ${vowel}`}
							onClick={() => playVowel(vowel)}
						>
							{vowel}
						</button>
					))}
				</div>
				{character && (
					<div className="inicio-activity-character" aria-label="Personaje seleccionado">
						<img src={CHARACTERS[character].image} alt={CHARACTERS[character].alt} />
						<img
							className={mouth.shifted ? "inicio-activity-mouth shifted-mouth" : "inicio-activity-mouth"}
							src={mouth.src}
							alt=""
							hidden={!mouth.visible}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
