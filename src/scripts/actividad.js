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

const fullscreenButton = document.querySelector("#fullscreen-button");
if (fullscreenButton) {
	fullscreenButton.addEventListener("click", requestFullscreen);
}

document.querySelector(".corner-button").addEventListener("click", () => {
		window.history.back();
});