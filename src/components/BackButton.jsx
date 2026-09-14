import { useNavigate } from "react-router";
import { img } from "../lib/assets";

export default function BackButton({ className = "corner-button" }) {
	const navigate = useNavigate();
	return (
		<button className={className} type="button" aria-label="Volver" onClick={() => navigate(-1)}>
			<img src={img("volverbtn.png")} alt="Volver" />
		</button>
	);
}
