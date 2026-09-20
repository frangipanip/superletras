import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { readMenuOption, readSelectedWorld } from "../lib/storage";

export function useActivityMenuOption() {
	const location = useLocation();
	const navigate = useNavigate();
	
	const locationOption = location.state?.menuOption?.toLowerCase();
	const storedOption = readMenuOption();
	const menuOption = locationOption || storedOption;

	useEffect(() => {
		if (!menuOption) {
			const world = readSelectedWorld();
			if (world) {
				navigate(`/mundo${world}`, { replace: true });
			} else {
				navigate("/mundos", { replace: true });
			}
		}
	}, [menuOption, navigate]);

	return menuOption;
}
