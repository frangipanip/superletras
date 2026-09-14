import { useState } from "react";
import { CHARACTERS } from "../lib/assets";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";

function readCharacter() {
	const saved = readStorage(STORAGE_KEYS.character);
	return CHARACTERS[saved] ? saved : null;
}

export function useSelectedCharacter() {
	const [character, setCharacter] = useState(readCharacter);

	function selectCharacter(next) {
		setCharacter(next);
		writeStorage(STORAGE_KEYS.character, next);
	}

	return [character, selectCharacter];
}
