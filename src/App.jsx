import { useCallback, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { ReiniciarPaginaContext } from "./hooks/useReiniciarPagina";
import Inicio from "./pages/Inicio";
import Mundos from "./pages/Mundos";
import Mundo1 from "./pages/Mundo1";
import Mundo2 from "./pages/Mundo2";
import Mundo3 from "./pages/Mundo3";
import Mundo4 from "./pages/Mundo4";
import Mundo5 from "./pages/Mundo5";
import Mundo6 from "./pages/Mundo6";
import InicioActividad from "./pages/InicioActividad";
import Silabas from "./pages/Silabas";
import Mariposas from "./pages/Mariposas";
import Tren from "./pages/Tren";
import Flores from "./pages/Flores";
import Peluche from "./pages/Iniciales";
import PeluchesMundo2 from "./pages/PeluchesMundo2";
import Dibujar from "./pages/Dibujar";
import Memotest from "./pages/Memotest";
import Monstruo from "./pages/Monstruo";
import Barcos from "./pages/Barcos";
import Decora from "./pages/Decora";
import Pastel from "./pages/Pastel";
import Puzzle from "./pages/Puzzle";
import Escribir from "./pages/Escribir";
import PlaceholderActivity from "./pages/PlaceholderActivity";
import Prueba from "./pages/Prueba";

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

// /peluches es una sola ruta: Mundo 2 (state.world === 2) tiene su propia actividad.
function PeluchesRuta() {
	const location = useLocation();
	return location.state?.world === 2 ? <PeluchesMundo2 /> : <Peluche />;
}

export default function App() {
	// Cambiar la key vuelve a montar la pantalla actual (ver useReiniciarPagina).
	const [vuelta, setVuelta] = useState(0);
	const reiniciarPagina = useCallback(() => setVuelta((actual) => actual + 1), []);

	return (
		<ReiniciarPaginaContext.Provider value={reiniciarPagina}>
			<Routes key={vuelta}>
				<Route path="/" element={<Inicio />} />
				<Route path="/mundos" element={<Mundos />} />
				<Route path="/mundo1" element={<Mundo1 />} />
				<Route path="/mundo2" element={<Mundo2 />} />
				<Route path="/mundo3" element={<Mundo3 />} />
				<Route path="/mundo4" element={<Mundo4 />} />
				<Route path="/mundo5" element={<Mundo5 />} />
				<Route path="/mundo6" element={<Mundo6 />} />
				<Route path="/inicio" element={<InicioActividad />} />
				<Route path="/silabas" element={<Silabas />} />
				<Route path="/mariposas" element={<Mariposas />} />
				<Route path="/tren" element={<Tren />} />
				<Route path="/flores" element={<Flores />} />
				<Route path="/dibujar" element={<Dibujar />} />
				<Route path="/memotest" element={<Memotest />} />
				<Route path="/monstruo" element={<Monstruo />} />
				<Route path="/barcos" element={<Barcos />} />
				<Route path="/decora" element={<Decora />} />
				<Route path="/pastel" element={<Pastel />} />
				<Route path="/puzzle" element={<Puzzle />} />
				<Route path="/escribir" element={<Escribir />} />
				<Route path="/prueba" element={<Prueba />} />
				<Route path="/globos" element={<PlaceholderActivity key="globos" title="Globos" />} />
				<Route path="/iniciales" element={<Navigate to="/peluches" replace />} />
				<Route path="/peluches" element={<PeluchesRuta />} />
				{Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
					<Route key={from} path={from} element={<Navigate to={to} replace />} />
				))}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</ReiniciarPaginaContext.Provider>
	);
}
