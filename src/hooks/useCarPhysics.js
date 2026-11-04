import { useEffect } from "react";

// Física de los carros de Mundo 3 (fase 3, "ahora con movimiento"): cada carro maneja solo,
// dobla de a poco, choca contra los otros, contra los bordes del piso y contra los obstáculos
// (personaje, bloques del fondo) y rebota, como autitos de verdad. La imagen no gira. Entre carros
// choca solo la "huella" sobre el piso (la mitad de abajo), así el que está más atrás puede
// quedar tapado hasta la mitad por el de adelante (se dibuja adelante el de más abajo).
// Las posiciones se escriben directo en el DOM (left/top) para no re-renderizar 60 veces por
// segundo; transform queda libre para las animaciones de CSS (sacudida al equivocarse, salida
// al acertar).

// Caja de choque relativa al botón (cuadrado): el carro ocupa casi todo el ancho y ~84% del alto.
const BOX_WIDTH = 0.88;
const BOX_HEIGHT = 0.74;
// El piso del fondo empieza más o menos al 22% del alto; arriba está el cielo.
const FLOOR_TOP = 0.22;
// Rebote: 1 = choque perfecto, menos = se frenan un poco al chocar.
const RESTITUTION = 0.75;
// Qué tan rápido el motor vuelve a la velocidad de crucero después de un choque (1/s).
const ACCELERATION = 1.4;
// En el piso en perspectiva, ir "hacia el fondo" se ve más lento que ir de costado.
const VERTICAL_SCALE = 0.7;
const MAX_TURN_RATE = 0.9;

function randomBetween(min, max) {
	return min + Math.random() * (max - min);
}

function boxOf(car) {
	return {
		cx: car.x + car.w / 2,
		cy: car.y + car.h / 2 + car.h * 0.04,
		hw: (car.w * BOX_WIDTH) / 2,
		hh: (car.h * BOX_HEIGHT) / 2
	};
}

// Huella sobre el piso: la mitad de abajo de la caja. Dos carros chocan recién cuando se pisan
// las huellas, o sea que de frente/atrás se pueden solapar hasta media caja.
function footprintOf(car) {
	const box = boxOf(car);
	return { cx: box.cx, cy: box.cy + box.hh / 2, hw: box.hw, hh: box.hh / 2 };
}

function pointInward(car, axis, sign) {
	// Gira el rumbo para que apunte hacia adentro después de tocar una pared.
	const cos = Math.cos(car.angle);
	const sin = Math.sin(car.angle);
	if (axis === "x" && Math.sign(cos) !== sign) {
		car.angle = Math.atan2(sin, -cos);
	}
	if (axis === "y" && Math.sign(sin) !== sign) {
		car.angle = Math.atan2(-sin, cos);
	}
	car.turnRate = -car.turnRate;
}

function headingFromVelocity(car) {
	if (Math.hypot(car.vx, car.vy) > 8) {
		car.angle = Math.atan2(car.vy / VERTICAL_SCALE, car.vx);
	}
}

function collideCars(a, b) {
	const boxA = footprintOf(a);
	const boxB = footprintOf(b);
	const dx = boxB.cx - boxA.cx;
	const dy = boxB.cy - boxA.cy;
	const overlapX = boxA.hw + boxB.hw - Math.abs(dx);
	const overlapY = boxA.hh + boxB.hh - Math.abs(dy);
	if (overlapX <= 0 || overlapY <= 0) {
		return;
	}
	// Se separan por el eje donde menos se pisan y se intercambian la velocidad de ese eje
	// (masas iguales), con un poco de pérdida para que el choque se sienta "pesado".
	const axis = overlapX < overlapY ? "x" : "y";
	const sign = (axis === "x" ? dx : dy) >= 0 ? 1 : -1;
	const push = (axis === "x" ? overlapX : overlapY) / 2;
	const velocity = axis === "x" ? "vx" : "vy";
	if (axis === "x") {
		a.x -= push * sign;
		b.x += push * sign;
	} else {
		a.y -= push * sign;
		b.y += push * sign;
	}
	const va = a[velocity];
	const vb = b[velocity];
	if ((vb - va) * sign < 0) {
		a[velocity] = ((1 - RESTITUTION) * va + (1 + RESTITUTION) * vb) / 2;
		b[velocity] = ((1 + RESTITUTION) * va + (1 - RESTITUTION) * vb) / 2;
		headingFromVelocity(a);
		headingFromVelocity(b);
	}
}

function collideObstacle(car, obstacle) {
	const box = boxOf(car);
	const dx = box.cx - obstacle.cx;
	const dy = box.cy - obstacle.cy;
	const overlapX = box.hw + obstacle.hw - Math.abs(dx);
	const overlapY = box.hh + obstacle.hh - Math.abs(dy);
	if (overlapX <= 0 || overlapY <= 0) {
		return;
	}
	if (overlapX < overlapY) {
		const sign = dx >= 0 ? 1 : -1;
		car.x += overlapX * sign;
		if (car.vx * sign < 0) {
			car.vx = -car.vx * RESTITUTION;
		}
		pointInward(car, "x", sign);
	} else {
		const sign = dy >= 0 ? 1 : -1;
		car.y += overlapY * sign;
		if (car.vy * sign < 0) {
			car.vy = -car.vy * RESTITUTION;
		}
		pointInward(car, "y", sign);
	}
}

function keepInside(car, bounds) {
	const box = boxOf(car);
	const minY = bounds.height * FLOOR_TOP;
	if (box.cx - box.hw < 0) {
		car.x += box.hw - box.cx;
		car.vx = Math.abs(car.vx) * RESTITUTION;
		pointInward(car, "x", 1);
	} else if (box.cx + box.hw > bounds.width) {
		car.x -= box.cx + box.hw - bounds.width;
		car.vx = -Math.abs(car.vx) * RESTITUTION;
		pointInward(car, "x", -1);
	}
	if (box.cy - box.hh < minY) {
		car.y += minY - (box.cy - box.hh);
		car.vy = Math.abs(car.vy) * RESTITUTION;
		pointInward(car, "y", 1);
	} else if (box.cy + box.hh > bounds.height) {
		car.y -= box.cy + box.hh - bounds.height;
		car.vy = -Math.abs(car.vy) * RESTITUTION;
		pointInward(car, "y", -1);
	}
}

function obstacleFrom(element, containerRect, inset) {
	const rect = element.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) {
		return null;
	}
	return {
		cx: rect.left - containerRect.left + rect.width / 2,
		cy: rect.top - containerRect.top + rect.height / 2,
		hw: (rect.width * (1 - inset)) / 2,
		hh: (rect.height * (1 - inset)) / 2
	};
}

/**
 * @param runtime        usePageRuntime() (el bucle usa runtime.requestAnimationFrame).
 * @param active         mientras sea true, los carros manejan solos.
 * @param itemRefs       ref a un Map item -> elemento del carro.
 * @param stoppedRef     ref a un Set con los items que ya salieron (no chocan más).
 * @param obstacleRefs   refs a elementos que los carros esquivan (el personaje).
 * @param background     cosas dibujadas en el fondo que están "adelante" y no se pueden pisar:
 *                       { width, height, rects: [[x1, y1, x2, y2], ...] } en píxeles de la imagen,
 *                       que se pinta centrada con background-size: cover sobre el contenedor.
 */
export function useCarPhysics(runtime, { active, itemRefs, stoppedRef, obstacleRefs = [], background = null }) {
	useEffect(() => {
		if (!active) {
			return undefined;
		}
		const elements = [...itemRefs.current.entries()];
		const container = elements[0]?.[1].offsetParent;
		if (!container) {
			return undefined;
		}
		let running = true;
		let bounds = { width: container.clientWidth, height: container.clientHeight };
		let obstacles = [];
		const cars = elements.map(([item, element]) => ({
			item,
			element,
			x: element.offsetLeft,
			y: element.offsetTop,
			w: element.offsetWidth,
			h: element.offsetHeight,
			vx: 0,
			vy: 0,
			angle: randomBetween(0, Math.PI * 2),
			turnRate: randomBetween(-MAX_TURN_RATE, MAX_TURN_RATE) / 2,
			cruise: randomBetween(0.075, 0.11)
		}));

		function measure() {
			bounds = { width: container.clientWidth, height: container.clientHeight };
			const containerRect = container.getBoundingClientRect();
			obstacles = obstacleRefs
				.map((ref) => ref.current)
				.filter((element) => element && getComputedStyle(element).opacity !== "0")
				.map((element) => obstacleFrom(element, containerRect, 0.1))
				.filter(Boolean);
			if (background) {
				// Misma cuenta que background-size: cover + background-position: center.
				const scale = Math.max(bounds.width / background.width, bounds.height / background.height);
				const offsetX = (bounds.width - background.width * scale) / 2;
				const offsetY = (bounds.height - background.height * scale) / 2;
				background.rects.forEach(([x1, y1, x2, y2]) => {
					obstacles.push({
						cx: offsetX + ((x1 + x2) / 2) * scale,
						cy: offsetY + ((y1 + y2) / 2) * scale,
						hw: ((x2 - x1) / 2) * scale,
						hh: ((y2 - y1) / 2) * scale
					});
				});
			}
			cars.forEach((car) => {
				car.w = car.element.offsetWidth;
				car.h = car.element.offsetHeight;
			});
		}

		measure();
		// El personaje puede aparecer con una transición; se vuelve a medir cuando ya terminó.
		const measureTimer = runtime.setTimeout(measure, 600);
		window.addEventListener("resize", measure);

		let last = performance.now();
		function step() {
			if (!running) {
				return;
			}
			const now = performance.now();
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const moving = cars.filter((car) => !stoppedRef.current.has(car.item));
			const cruiseBase = Math.max(bounds.width, 320);

			moving.forEach((car) => {
				// Volante: el giro cambia de a poco, así las curvas son suaves.
				car.turnRate += randomBetween(-1, 1) * 1.6 * dt;
				car.turnRate = Math.max(-MAX_TURN_RATE, Math.min(MAX_TURN_RATE, car.turnRate));
				car.angle += car.turnRate * dt;
				// Motor: la velocidad se acerca a la de crucero en la dirección del rumbo.
				const cruise = car.cruise * cruiseBase;
				const targetX = Math.cos(car.angle) * cruise;
				const targetY = Math.sin(car.angle) * cruise * VERTICAL_SCALE;
				const pull = Math.min(1, ACCELERATION * dt);
				car.vx += (targetX - car.vx) * pull;
				car.vy += (targetY - car.vy) * pull;
				car.x += car.vx * dt;
				car.y += car.vy * dt;
			});

			// Varias pasadas para que los choques entre tres carros también queden resueltos.
			for (let pass = 0; pass < 3; pass += 1) {
				for (let i = 0; i < moving.length; i += 1) {
					for (let j = i + 1; j < moving.length; j += 1) {
						collideCars(moving[i], moving[j]);
					}
				}
				moving.forEach((car) => {
					obstacles.forEach((obstacle) => collideObstacle(car, obstacle));
					keepInside(car, bounds);
				});
			}

			moving.forEach((car) => {
				car.element.style.left = `${car.x}px`;
				car.element.style.top = `${car.y}px`;
				// El de más abajo queda adelante (está más cerca en el piso en perspectiva).
				car.element.style.zIndex = String(Math.round(car.y));
			});
			runtime.requestAnimationFrame(step);
		}
		runtime.requestAnimationFrame(step);

		return () => {
			running = false;
			runtime.clearTimeout(measureTimer);
			window.removeEventListener("resize", measure);
			cars.forEach(({ element }) => {
				element.style.left = "";
				element.style.top = "";
				element.style.zIndex = "";
			});
		};
	}, [active, runtime]);
}
