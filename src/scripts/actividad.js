const selectedCharacter = localStorage.getItem("superletras-character");
const characterImages = {
	supernena: "assets/imagenes/supernena.png",
	supernene: "assets/imagenes/supernene.png"
};
const characterButton = document.querySelector("#selected-character");
const characterImage = document.querySelector("#selected-character-image");
const imageSource = characterImages[selectedCharacter];

if (imageSource) {
	characterImage.src = imageSource;
	characterImage.alt = selectedCharacter === "supernena" ? "Supernena" : "Supernene";
	characterButton.hidden = false;
}

document.querySelector(".corner-button").addEventListener("click", () => {
		window.history.back();
});