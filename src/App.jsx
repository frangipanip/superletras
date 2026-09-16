import { Navigate, Route, Routes } from "react-router";
import Inicio from "./pages/Inicio";
import Mundos from "./pages/Mundos";
import Mundo1 from "./pages/Mundo1";
import InicioActividad from "./pages/InicioActividad";
import Silabas from "./pages/Silabas";
import Mariposas from "./pages/Mariposas";
import Tren from "./pages/Tren";
import Flores from "./pages/Flores";
import Peluche from "./pages/Iniciales";
import PlaceholderActivity from "./pages/PlaceholderActivity";

// Las URLs viejas (*.html) redirigen a las rutas nuevas para no romper accesos guardados.
const LEGACY_REDIRECTS = {
	"/index.html": "/",
	"/mundos.html": "/mundos",
	"/mundo1.html": "/mundo1",
	"/SILABASAM1.html": "/silabas",
	"/mariposas.html": "/mariposas",
	"/tren.html": "/tren",
	"/flores.html": "/flores",
	"/globos.html": "/globos",
	"/iniciales.html": "/peluches",
	"/peluches.html": "/peluches"
};

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Inicio />} />
			<Route path="/mundos" element={<Mundos />} />
			<Route path="/mundo1" element={<Mundo1 />} />
			<Route path="/inicio" element={<InicioActividad />} />
			<Route path="/silabas" element={<Silabas />} />
			<Route path="/mariposas" element={<Mariposas />} />
			<Route path="/tren" element={<Tren />} />
			<Route path="/flores" element={<Flores />} />
			<Route path="/globos" element={<PlaceholderActivity key="globos" title="Globos" />} />
			<Route path="/iniciales" element={<Navigate to="/peluches" replace />} />
			<Route path="/peluches" element={<Peluche />} />
			{Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
				<Route key={from} path={from} element={<Navigate to={to} replace />} />
			))}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
