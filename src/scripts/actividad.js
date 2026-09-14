const selectedCharacter = localStorage.getItem("superletras-character");
const characterImages = {
	supernena: "assets/imagenes/supernena.png",
	supernene: "assets/imagenes/supernene.png"
};
const characterButton = document.querySelector("#selected-character");
const characterImage = document.querySelector("#selected-character-image");
const imageSource = characterImages[selectedCharacter];

function requestFullscreen() {
	if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
		document.documentElement.requestFullscreen().catch(() => {});
	}
}

if (imageSource) {
	characterImage.src = imageSource;
	characterImage.alt = selectedCharacter === "supernena" ? "Supernena" : "Supernene";
	characterButton.hidden = false;
}

window.addEventListener("load", requestFullscreen, { once: true });
document.addEventListener("pointerdown", requestFullscreen, { once: true });
document.addEventListener("touchstart", requestFullscreen, { once: true, passive: true });

document.querySelector(".corner-button").addEventListener("click", () => {
		window.history.back();
});