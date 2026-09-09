import { Navigate, Route, Routes } from "react-router-dom";
import { RotateOverlay } from "./components/RotateOverlay.jsx";
import { useImmersive } from "./hooks/useImmersive.js";
import Home from "./screens/Home.jsx";
import Mundos from "./screens/Mundos.jsx";
import Mundo1 from "./screens/Mundo1.jsx";
import SilabasA from "./screens/SilabasA.jsx";

export default function App() {
	useImmersive();

	return (
		<>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/mundos" element={<Mundos />} />
				<Route path="/mundo1" element={<Mundo1 />} />
				<Route path="/mundo1/silabas-a" element={<SilabasA />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			<RotateOverlay />
		</>
	);
}
