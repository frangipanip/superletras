import { useEffect } from "react";
import { useNavigate } from "react-router";
import UserNav from "../components/UserNav";
import { usePageTitle } from "../hooks/usePageTitle";
import { img, preloadImages } from "../lib/assets";
import { writeStorage, STORAGE_KEYS } from "../lib/storage";
import { MUNDO1_IMAGES } from "./Mundo1";
import { MUNDO2_IMAGES } from "./Mundo2";
import { MUNDO3_IMAGES } from "./Mundo3";
import { MUNDO4_IMAGES } from "./Mundo4";
import "./Mundos.css";

const LEVEL_ROUTES = { 1: "/mundo1", 2: "/mundo2", 3: "/mundo3", 4: "/mundo4" };
const WORLDS = [1, 2, 3, 4, 5, 6];

export default function Mundos() {
	usePageTitle("Superletras - Mundos");
	const navigate = useNavigate();

	useEffect(() => {
		preloadImages([
			...WORLDS.map((world) => img(`mundo${world}.png`)),
			...MUNDO1_IMAGES,
			...MUNDO2_IMAGES,
			...MUNDO3_IMAGES,
			...MUNDO4_IMAGES
		]);
	}, []);

	return (
		<div className="page page-mundos">
			<UserNav />

			<main className="worlds-row" aria-label="Selección de mundo">
				<svg className="journey-path" viewBox="0 0 1000 562" preserveAspectRatio="none" aria-hidden="true">
					<path className="journey-path-shadow" d="M164 152 H450 H735 C875 183 880 335 735 416 H450 H164" />
					<path className="journey-path-line" d="M164 152 H450 H735 C875 183 880 335 735 416 H450 H164" />
					<path className="journey-arrow" d="M-8 -8 L8 0 L-8 8 Z" transform="translate(307 152)" />
					<path className="journey-arrow" d="M-8 -8 L8 0 L-8 8 Z" transform="translate(593 152)" />
					<path className="journey-arrow" d="M-8 -8 L8 0 L-8 8 Z" transform="translate(868 286) rotate(90)" />
					<path className="journey-arrow" d="M-8 -8 L8 0 L-8 8 Z" transform="translate(593 416) rotate(180)" />
					<path className="journey-arrow" d="M-8 -8 L8 0 L-8 8 Z" transform="translate(307 416) rotate(180)" />
				</svg>

				{WORLDS.map((world) => (
					<button
						key={world}
						className={`world-button world-button-${world}`}
						type="button"
						disabled={!LEVEL_ROUTES[world]}
						aria-label={`Mundo ${world}${LEVEL_ROUTES[world] ? "" : " (próximamente)"}`}
						onClick={LEVEL_ROUTES[world] ? () => {
							writeStorage(STORAGE_KEYS.selectedWorld, world);
							navigate(LEVEL_ROUTES[world]);
						} : undefined}
					>
						<img src={img(`mundo${world}.png`)} alt="" />
					</button>
				))}
			</main>
		</div>
	);
}
