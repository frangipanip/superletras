import { version } from "../../package.json";

export default function AppVersion() {
	return <div className="app-version">v{version}</div>;
}
