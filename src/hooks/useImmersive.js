import { useEffect } from "react";
import { keepImmersive } from "../lib/immersive.js";

// Mantiene la app en pantalla completa y en horizontal mientras esta montada.
export function useImmersive() {
	useEffect(() => keepImmersive(), []);
}
