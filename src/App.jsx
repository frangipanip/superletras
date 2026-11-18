import { Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { ReiniciarPaginaContext } from "./hooks/useReiniciarPagina";
import { pantalla, precargarPantallas } from "./lib/pantallas";
import Inicio from "./pages/Inicio";

// La portada va en el archivo principal; el resto se baja aparte (src/lib/pantallas.js).
const Mundos = pantalla(() => import("./pages/Mundos"));
const Mundo1 = pantalla(() => import("./pages/Mundo1"));
const Mundo2 = pantalla(() => import("./pages/Mundo2"));
const Mundo3 = pantalla(() => import("./pages/Mundo3"));
const Mundo4 = pantalla(() => import("./pages/Mundo4"));
const Mundo5 = pantalla(() => import("./pages/Mundo5"));
const Mundo6 = pantalla(() => import("./pages/Mundo6"));
const InicioActividad = pantalla(() => import("./pages/InicioActividad"));
const Silabas = pantalla(() => import("./pages/Silabas"));
const Mariposas = pantalla(() => import("./pages/Mariposas"));
const Tren = pantalla(() => import("./pages/Tren"));
const Flores = pantalla(() => import("./pages/Flores"));
const CriaturasSilabas = pantalla(() => import("./pages/CriaturasSilabas"));
const Oraciones = pantalla(() => import("./pages/Oraciones"));
const Peluche = pantalla(() => import("./pages/Iniciales"));
const PeluchesMundo2 = pantalla(() => import("./pages/PeluchesMundo2"));
const PeluchesMundo3 = pantalla(() => import("./pages/PeluchesMundo3"));
const PeluchesMundo4 = pantalla(() => import("./pages/PeluchesMundo4"));
const PeluchesMundo5 = pantalla(() => import("./pages/PeluchesMundo5"));
const PeluchesMundo6 = pantalla(() => import("./pages/PeluchesMundo6"));
const ElegirLetra = pantalla(() => import("./pages/ElegirLetra"));
const Dibujar = pantalla(() => import("./pages/Dibujar"));
const Monstruo = pantalla(() => import("./pages/Monstruo"));
const Laboratorio = pantalla(() => import("./pages/Laboratorio"));
const Barcos = pantalla(() => import("./pages/Barcos"));
const Decora = pantalla(() => import("./pages/Decora"));
const Pastel = pantalla(() => import("./pages/Pastel"));
const Puzzle = pantalla(() => import("./pages/Puzzle"));
const Escribir = pantalla(() => import("./pages/Escribir"));
const PlaceholderActivity = pantalla(() => import("./pages/PlaceholderActivity"));
const Prueba = pantalla(() => import("./pages/Prueba"));

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

// /peluches es una sola ruta: Mundos 2 a 6 (state.world) tienen su propia actividad.
function PeluchesRuta() {
	const location = useLocation();
	const world = location.state?.world;
	if (world === 2) return <PeluchesMundo2 />;
	if (world === 3) return <PeluchesMundo3 />;
	if (world === 4) return <PeluchesMundo4 />;
	if (world === 5) return <PeluchesMundo5 />;
	if (world === 6) return <PeluchesMundo6 />;
	return <Peluche />;
}

// /mariposas y /flores: Mundos 5 y 6 usan CriaturasSilabas (robots, mariposas y flores unicornio).
function ActividadSilabasRuta({ actividad }) {
	const location = useLocation();
	const world = location.state?.world;
	if (world === 5 || world === 6) return <CriaturasSilabas key={`${world}-${actividad}`} actividad={actividad} mundo={world} />;
	return actividad === "mariposas" ? <Mariposas /> : <Flores />;
}

export default function App() {
	// Cambiar la key vuelve a montar la pantalla actual (ver useReiniciarPagina).
	const [vuelta, setVuelta] = useState(0);
	const reiniciarPagina = useCallback(() => setVuelta((actual) => actual + 1), []);

	useEffect(() => {
		precargarPantallas();
	}, []);

	return (
		<ReiniciarPaginaContext.Provider value={reiniciarPagina}>
			{/* Mientras llega el archivo de la pantalla, PageLoader ve la marca y espera. */}
			<Suspense fallback={<div data-ruta-cargando="" />}>
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
					<Route path="/mariposas" element={<ActividadSilabasRuta actividad="mariposas" />} />
					<Route path="/tren" element={<Tren />} />
					<Route path="/flores" element={<ActividadSilabasRuta actividad="flores" />} />
					<Route path="/dibujar" element={<Dibujar />} />
					<Route path="/monstruo" element={<Monstruo />} />
					<Route path="/laboratorio" element={<Laboratorio />} />
					<Route path="/barcos" element={<Barcos />} />
					<Route path="/decora" element={<Decora />} />
					<Route path="/pastel" element={<Pastel />} />
					<Route path="/puzzle" element={<Puzzle />} />
					<Route path="/escribir" element={<Escribir />} />
					<Route path="/prueba" element={<Prueba />} />
					<Route path="/globos" element={<PlaceholderActivity key="globos" title="Globos" />} />
					<Route path="/iniciales" element={<Navigate to="/peluches" replace />} />
					<Route path="/peluches" element={<PeluchesRuta />} />
					<Route path="/elegir" element={<ElegirLetra />} />
					<Route path="/oraciones" element={<Oraciones />} />
					{Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
						<Route key={from} path={from} element={<Navigate to={to} replace />} />
					))}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Suspense>
		</ReiniciarPaginaContext.Provider>
	);
}
