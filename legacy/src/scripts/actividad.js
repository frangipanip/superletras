const selectedCharacter = localStorage.getItem("superletras-character");
const characterImages = {
	supernena: "assets/imagenes/supernena.png",
	supernene: "assets/imagenes/supernene.png"
};
const characterButton = document.querySelector("#selected-character");
const characterImage = document.querySelector("#selected-character-image");
const imageSource = characterImages[selectedCharacter];

function requestFullscreen() {
	const root = document.documentElement;
	const enterFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
	const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;

	if (document.fullscreenElement || document.webkitFullscreenElement) {
		if (exitFullscreen) {
			exitFullscreen.call(document).catch?.(() => {});
		}
		return;
	}

	if (enterFullscreen) {
		Promise.resolve(enterFullscreen.call(root)).catch(() => {});
	}
}

if (imageSource) {
	characterImage.src = imageSource;
	characterImage.alt = selectedCharacter === "supernena" ? "Supernena" : "Supernene";
	characterButton.hidden = false;
}

const fullscreenButton = document.querySelector("#fullscreen-button");
if (fullscreenButton) {
	fullscreenButton.addEventListener("click", requestFullscreen);
	document.addEventListener("fullscreenchange", () => {
		fullscreenButton.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement || document.webkitFullscreenElement)));
	});
}

document.querySelector(".corner-button").addEventListener("click", () => {
		window.history.back();
});