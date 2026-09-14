
		const selectedOption = (localStorage.getItem("superletras-mundo1-menu-option") || "a").toLowerCase();
		const field = document.querySelector("#butterfly-field");
		const title = document.querySelector("#activity-title");
		const targetLine = document.querySelector("#target-line");
		const targetToken = document.querySelector("#target-token");
		const restartButton = document.querySelector("#restart-button");
		const butterflyImages = [
			"assets/imagenes/MARIPOSA.svg",
			"assets/imagenes/MARIPOSA1.svg",
			"assets/imagenes/MARIPOSA2.svg"
		];
		const vowels = ["A", "E", "I", "O", "U"];
		const syllables = ["LA", "LE", "LI", "LO", "LU", "MA", "ME", "MI", "MO", "MU"];
		const targetVowel = "A";
		const targetSyllable = "LA";
		let currentMode = selectedOption === "l" ? "l" : "a";
		let targetValue = currentMode === "l" ? targetSyllable : targetVowel;
		let butterflies = [];
		let correctClicked = 0;
		let totalCorrect = 5;

		function shuffle(items) {
			const clone = [...items];
			for (let index = clone.length - 1; index > 0; index -= 1) {
				const randomIndex = Math.floor(Math.random() * (index + 1));
				[clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
			}
			return clone;
		}

		function buildButterflies() {
			field.replaceChildren();
			correctClicked = 0;
			const array = [];
			if (currentMode === "l") {
				title.textContent = "Mariposas";
				targetLine.innerHTML = `Pulsar las mariposas con la sílaba <span class="target-token" id="target-token">${targetValue}</span>`;
				const targetElement = document.querySelector("#target-token");
				targetElement.textContent = targetValue;
				for (let index = 0; index < totalCorrect; index += 1) {
					array.push({ syllable: targetValue, vowel: targetValue[0], image: butterflyImages[index % butterflyImages.length] });
				}
				for (let index = totalCorrect; index < 10; index += 1) {
					const other = shuffle(syllables.filter((syllable) => syllable !== targetValue))[0];
					array.push({ syllable: other, vowel: other[0], image: butterflyImages[index % butterflyImages.length] });
				}
			} else {
				title.textContent = "Mariposas";
				targetLine.innerHTML = `Pulsar las mariposas con la vocal <span class="target-token" id="target-token">${targetValue}</span>`;
				const targetElement = document.querySelector("#target-token");
				targetElement.textContent = targetValue;
				for (let index = 0; index < totalCorrect; index += 1) {
					array.push({ vowel: targetValue, syllable: targetValue, image: butterflyImages[index % butterflyImages.length] });
				}
				for (let index = totalCorrect; index < 10; index += 1) {
					const otherVowel = shuffle(vowels.filter((vowel) => vowel !== targetValue))[0];
					array.push({ vowel: otherVowel, syllable: "LA", image: butterflyImages[index % butterflyImages.length] });
				}
			}

			butterflies = shuffle(array);
			const positions = [
				[12, 22], [21, 30], [30, 21], [40, 34], [50, 26], [60, 37], [69, 24], [78, 34], [30, 50], [58, 52]
			];

			butterflies.forEach((butterfly, index) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = currentMode === "l" ? "butterfly-button l-butterfly" : "butterfly-button a-butterfly";
				btn.dataset.correct = String(currentMode === "l" ? butterfly.syllable === targetValue : butterfly.vowel === targetValue);
				btn.dataset.value = currentMode === "l" ? butterfly.syllable : butterfly.vowel;
				btn.style.left = `${positions[index][0]}vw`;
				btn.style.top = `${positions[index][1]}vh`;
				btn.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 18 - 9}deg)`;
				const img = document.createElement("img");
				img.src = butterfly.image;
				img.alt = currentMode === "l" ? `Mariposa con sílaba ${butterfly.syllable}` : `Mariposa con vocal ${butterfly.vowel}`;
				const badge = document.createElement("span");
				badge.className = "badge";
				badge.textContent = currentMode === "l" ? butterfly.syllable : butterfly.vowel;
				btn.appendChild(img);
				btn.appendChild(badge);
				btn.addEventListener("click", () => handleButterflyClick(btn, butterfly));
				field.appendChild(btn);
			});
		}

		function handleButterflyClick(button, butterfly) {
			const isCorrect = currentMode === "l" ? butterfly.syllable === targetValue : butterfly.vowel === targetValue;
			if (!isCorrect) {
				button.classList.add("vibration");
				button.animate([
					{ transform: "translate(-50%, -50%) translateX(0)" },
					{ transform: "translate(-50%, -50%) translateX(-8px)" },
					{ transform: "translate(-50%, -50%) translateX(8px)" },
					{ transform: "translate(-50%, -50%) translateX(0)" }
				], { duration: 300, iterations: 1 });
				window.setTimeout(() => button.classList.remove("vibration"), 300);
				return;
			}

			correctClicked += 1;
			button.classList.add("flying", "correct");
			button.disabled = true;
			button.animate([
				{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
				{ transform: "translate(-50%, -50%) scale(0.7)", opacity: 0.7 },
				{ transform: "translate(-34vw, -60vh) scale(0.2)", opacity: 0 }
			], { duration: 780, iterations: 1, easing: "ease-out" });
			window.setTimeout(() => {
				button.remove();
				if (correctClicked >= totalCorrect) {
					finishRound();
				}
			}, 860);
		}

		function nextTargetValue() {
			const targetPool = currentMode === "l" ? syllables : vowels;
			const currentIndex = targetPool.indexOf(targetValue);
			return targetPool[(currentIndex + 1) % targetPool.length];
		}

		function finishRound() {
			const remaining = Array.from(field.querySelectorAll(".butterfly-button:not(.correct)"));
			remaining.forEach((button) => {
				button.animate([
					{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
					{ transform: "translate(-50%, -50%) scale(0.82)", opacity: 0.86 },
					{ transform: "translate(12vw, -12vh) scale(0.2)", opacity: 0 }
				], { duration: 620, iterations: 1, easing: "ease-out" });
				window.setTimeout(() => button.remove(), 640);
			});

			window.setTimeout(() => {
				targetValue = nextTargetValue();
				buildButterflies();
			}, 740);
		}

		restartButton.addEventListener("click", () => {
			buildButterflies();
		});

		buildButterflies();
	
