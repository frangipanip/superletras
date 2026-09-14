import BackButton from "../components/BackButton";
import Character from "../components/Character";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSelectedCharacter } from "../hooks/useSelectedCharacter";
import "./actividad.css";

// Actividades todavia sin contenido (globos, iniciales, peluches).
export default function PlaceholderActivity({ title }) {
	usePageTitle(`${title} - Mundo 1`);
	const [character] = useSelectedCharacter();

	return (
		<div className="page activity-page">
			<BackButton />
			<h1 className="activity-title">{title}</h1>
			<Character character={character} />
		</div>
	);
}
