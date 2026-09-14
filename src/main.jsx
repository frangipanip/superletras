import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import AppVersion from "./components/AppVersion";
import RotateDevice from "./components/RotateDevice";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<App />
		<AppVersion />
		<RotateDevice />
	</BrowserRouter>
);
