import { useNavigate } from "react-router-dom";

export function BackButton() {
	const navigate = useNavigate();

	return (
		<button
			className="corner-button back-button"
			type="button"
			aria-label="Volver"
			onClick={() => {
				navigate(-1);
			}}
		>
			<img src="/assets/imagenes/volverbtn.png" alt="Volver" />
		</button>
	);
}
