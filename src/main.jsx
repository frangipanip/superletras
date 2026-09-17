import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import AppBanners from "./components/AppBanners";
import AppVersion from "./components/AppVersion";
import RotateDevice from "./components/RotateDevice";
import { startPwa } from "./lib/pwa";
import "./styles/global.css";

startPwa();

createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<App />
		<AppBanners />
		<AppVersion />
		<RotateDevice />
	</BrowserRouter>
);
