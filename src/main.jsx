import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import AppBanners from "./components/AppBanners";
import AppVersion from "./components/AppVersion";
import PageLoader from "./components/PageLoader";
import RotateDevice from "./components/RotateDevice";
import { startPwa } from "./lib/pwa";
import { startRecompensas } from "./lib/recompensas";
import { startSinZoom } from "./lib/sinZoom";
import "./styles/global.css";

startPwa();
startRecompensas();
startSinZoom();

createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<App />
		<AppBanners />
		<AppVersion />
		<RotateDevice />
		<PageLoader />
	</BrowserRouter>
);
