"""Genera los assets del río de chocolate animado de fondopalabras.png (1933x1080).

Uso (desde la raíz del repo, requiere numpy, scipy y Pillow):
	python scripts/generar-rio-chocolate.py public/assets/imagenes/fondopalabras.png public/assets/imagenes src/components/rioChocolateDatos.js [carpeta-previews]

Genera:
- rio-chocolate-base.jpg: la pintura del propio río, sin las burbujas pintadas,
  enderezada al cauce promedio y repetible sin costura en x (TILE_BASE).
- rio-chocolate-brillos.png: brillos crema nítidos (estilo dibujo animado), repetibles en x (TILE_BRILLOS).
- rio-chocolate-mascara.png / rio-chocolate-orillas.png: recorte al agua (sin pisar la
  orilla) y la sombra fija de los bordes.
- rio-chocolate-parche.png: tapa las burbujas pintadas del pozo, que no se desplaza.
- rioChocolateDatos.js: contornos y bordes que usa el canvas (burbujas, cascada, salpicaduras).

src/components/RioChocolate.css depende de RIO_*, TILE_BASE, TILE_BRILLOS y PARCHE_*.
Con carpeta-previews guarda una composición estática sobre el fondo para revisar.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

FONDO, SALIDA, DATOS = sys.argv[1], sys.argv[2], sys.argv[3]
PREVIEW = sys.argv[4] if len(sys.argv) > 4 else None

# Caja del río en coordenadas de la imagen (incluye todo el agua de x=180 en adelante).
RIO_X, RIO_Y, RIO_W, RIO_H = 180, 580, 1753, 188
TILE_BASE = 1200
SOLAPE_BASE = 180
ORIGEN_BASE = 520
TILE_BRILLOS = 1024
PARCHE_X, PARCHE_Y, PARCHE_W, PARCHE_H = 420, 596, 110, 128

CREMA = (255, 238, 214)

# Pozo bajo la cascada: el borde detectado solo sirve desde x=430.
# Arriba va por debajo de la corona de la cascada (lo que salpica no es pozo).
POZO_ARRIBA = [(190, 708), (215, 672), (260, 662), (300, 658), (340, 655), (380, 648), (410, 634), (425, 614)]
POZO_ABAJO = [(420, 745), (380, 740), (320, 735), (260, 727), (215, 716)]

# Labio por donde se vuelca el chorro: el borde de arriba de los rulos claros pintados.
# Ahí empieza la caída; entre el glaseado y el labio el chocolate todavía baja por la ladera.
LABIO = [(196, 456), (205, 455), (222, 457), (240, 455), (262, 453), (278, 446), (292, 445), (305, 436), (318, 440), (332, 447), (346, 453)]

# Burbujas pintadas del río: (centro x, centro y, radio x, radio y).
BURBUJAS_PINTADAS = [
	(508, 610, 8, 7), (604, 678, 14, 10), (468, 702, 18, 12), (500, 694, 10, 9), (442, 710, 8, 7),
	(722, 677, 10, 8), (747, 641, 6, 6), (775, 641, 8, 8), (802, 642, 28, 18), (852, 645, 7, 6),
	(890, 647, 6, 5), (1180, 723, 11, 8), (1672, 670, 11, 9), (1710, 673, 20, 14)
]


def smoothstep(a, b, x):
	t = np.clip((x - a) / (b - a), 0, 1)
	return t * t * (3 - 2 * t)


def cargar():
	return np.asarray(Image.open(FONDO).convert("RGB"), float)


# ---------------------------------------------------------------- bordes del agua

def detectar_agua(a):
	"""Arriba: la línea oscura de sombra bajo la orilla. Abajo: el último píxel de agua."""
	R, B = a[..., 0], a[..., 2]
	xs = np.arange(430, a.shape[1])

	def tope(x):
		for y in range(582, 665):
			if B[y, x] < 26 and R[y, x] < 118 and (B[y:y + 8, x] < 62).all():
				return y
		return np.nan

	def fondo(x):
		for y in range(775, 700, -1):
			r, b = R[y, x], B[y, x]
			if b < 62 and r < 165 and r - b > 60:
				return y
		return np.nan

	def limpiar(v):
		idx = np.arange(len(v))
		ok = ~np.isnan(v)
		v = v.copy()
		v[~ok] = np.interp(idx[~ok], idx[ok], v[ok])
		# Saltos bruscos = contorno de la orilla en vez del agua (p. ej. junto a la roca del pozo).
		ok = np.abs(v - ndi.median_filter(v, 121, mode="nearest")) <= 6
		v[~ok] = np.interp(idx[~ok], idx[ok], v[ok])
		v = ndi.median_filter(v, 15, mode="nearest")
		return ndi.gaussian_filter1d(v, 4, mode="nearest")

	return xs, limpiar(np.array([tope(x) for x in xs], float)), limpiar(np.array([fondo(x) for x in xs], float))


def contorno_agua(xs, arriba, abajo, paso=12):
	sel = list(range(0, len(xs), paso)) + [len(xs) - 1]
	borde_arriba = [(float(xs[i]), float(arriba[i])) for i in sel]
	borde_abajo = [(float(xs[i]), float(abajo[i])) for i in sel]
	fin = (1975.0, borde_arriba[-1][1]), (1975.0, borde_abajo[-1][1])
	return POZO_ARRIBA + borde_arriba + [fin[0], fin[1]] + borde_abajo[::-1] + POZO_ABAJO


def rasterizar(puntos, x0, y0, w, h, f=4):
	img = Image.new("L", (w * f, h * f), 0)
	ImageDraw.Draw(img).polygon([((x - x0) * f, (y - y0) * f) for x, y in puntos], fill=255)
	return np.asarray(img.resize((w, h), Image.LANCZOS), float) / 255


# ---------------------------------------------------------------- borrar burbujas pintadas

def borrar_burbujas(a):
	"""Rellena cada burbuja por difusión desde su borde (el chocolate es liso)."""
	a = a.copy()
	tapado = np.zeros(a.shape[:2], bool)
	ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
	for cx, cy, rx, ry in BURBUJAS_PINTADAS:
		x0, x1, y0, y1 = cx - rx - 8, cx + rx + 9, cy - ry - 8, cy + ry + 9
		zona = ((xs[y0:y1, x0:x1] - cx) / (rx + 2)) ** 2 + ((ys[y0:y1, x0:x1] - cy) / (ry + 2)) ** 2 <= 1
		trozo = a[y0:y1, x0:x1].copy()
		media = trozo[~zona].mean(0)
		trozo[zona] = media
		for _ in range(400):
			prom = (np.roll(trozo, 1, 0) + np.roll(trozo, -1, 0) + np.roll(trozo, 1, 1) + np.roll(trozo, -1, 1)) / 4
			trozo[zona] = prom[zona]
		a[y0:y1, x0:x1] = trozo
		tapado[y0:y1, x0:x1] |= zona
	return a, tapado


# ---------------------------------------------------------------- base del río

def base_rio(a, xs, arriba, abajo):
	"""Columnas del río original remapeadas al cauce promedio, con costura cruzada."""
	ancho = TILE_BASE + SOLAPE_BASE
	cols = np.arange(ORIGEN_BASE, ORIGEN_BASE + ancho)
	i = cols - xs[0]
	t_med, b_med = arriba[i].mean(), abajo[i].mean()
	y = RIO_Y + np.arange(RIO_H)[:, None]
	rel = (y - t_med) / (b_med - t_med)
	# Fuera del cauce medio se refleja el interior (repetir el borde deja rayas verticales).
	rel = np.where(rel < 0, -rel, np.where(rel > 1, 2 - rel, rel))
	# Un poco hacia adentro: en el borde exacto el muestreo mezcla la orilla clara.
	ini, fin = arriba[i] + 1.5, abajo[i] - 2.5
	y_src = ini[None, :] + rel * (fin - ini)[None, :]
	x_src = np.broadcast_to(cols[None, :], y_src.shape).astype(float)
	tira = np.stack([ndi.map_coordinates(a[..., c], [y_src, x_src], order=1) for c in range(3)], -1)
	w = smoothstep(0, SOLAPE_BASE, np.arange(SOLAPE_BASE))[None, :, None]
	tile = tira[:, :TILE_BASE].copy()
	tile[:, :SOLAPE_BASE] = tira[:, TILE_BASE:] * (1 - w) + tira[:, :SOLAPE_BASE] * w
	return tile, t_med, b_med


# ---------------------------------------------------------------- brillos

def brillos(ancho, alto, carril, rng):
	"""Brillos de dibujo animado: trazo crema afinado en las puntas, a veces con un
	puntito detrás, sobre un halo suave. Periódicos en x."""
	f = 3
	halo = Image.new("L", (ancho * f, alto * f), 0)
	nucleo = Image.new("L", (ancho * f, alto * f), 0)
	dh, dn = ImageDraw.Draw(halo), ImageDraw.Draw(nucleo)
	for _ in range(15):
		largo = rng.uniform(45, 150)
		grosor = rng.uniform(2.4, 4.6)
		x0 = rng.uniform(0, ancho)
		y0 = rng.uniform(*carril)
		curva = rng.uniform(-3.5, 3.5)
		t = np.linspace(0, 1, 40)
		px = x0 + t * largo
		py = y0 + curva * np.sin(np.pi * t) - curva * 0.5 * t
		g = grosor * np.sin(np.pi * np.clip(t * 1.08, 0, 1)) ** 0.55
		con_punto = rng.random() < 0.6
		for desp in (-ancho, 0, ancho):
			arriba = [((x + desp) * f, (y - w / 2) * f) for x, y, w in zip(px, py, g)]
			abajo = [((x + desp) * f, (y + w / 2) * f) for x, y, w in zip(px[::-1], py[::-1], g[::-1])]
			dn.polygon(arriba + abajo, fill=255)
			ah = [((x + desp) * f, (y - w * 1.6) * f) for x, y, w in zip(px, py, g)]
			bh = [((x + desp) * f, (y + w * 1.6) * f) for x, y, w in zip(px[::-1], py[::-1], g[::-1])]
			dh.polygon(ah + bh, fill=255)
			if con_punto:
				r = grosor * 0.55
				cx, cy = px[-1] + desp + grosor * 2.6, py[-1] - curva * 0.2
				dn.ellipse([(cx - r) * f, (cy - r) * f, (cx + r) * f, (cy + r) * f], fill=255)
	halo = halo.filter(ImageFilter.GaussianBlur(2.2 * f))
	nucleo = nucleo.filter(ImageFilter.GaussianBlur(0.35 * f))
	alfa = np.maximum(np.asarray(nucleo, float) / 255 * 0.92, np.asarray(halo, float) / 255 * 0.2)
	rgba = np.zeros(alfa.shape + (4,), float)
	rgba[..., :3] = CREMA
	rgba[..., 3] = alfa * 255
	return Image.fromarray(rgba.astype(np.uint8), "RGBA").resize((ancho, alto), Image.LANCZOS)


# ---------------------------------------------------------------- cascada

def silueta_cascada(a):
	"""Chocolate del canal bajo el glaseado y del chorro, como un intervalo por columna."""
	X0, Y0, X1, Y1 = 60, 370, 440, 670
	r, g, b = [a[Y0:Y1, X0:X1, i] for i in range(3)]
	mx = np.maximum(np.maximum(r, g), b)
	mn = np.minimum(np.minimum(r, g), b)
	sat = (mx - mn) / np.maximum(mx, 1)
	m = (r > g) & (g > b - 5) & (sat > 0.42) & (mx < 235) & ((g - b) > 12) & (r > 70)
	m = ndi.binary_opening(ndi.binary_closing(m, iterations=2), iterations=1)
	ys, xs = np.mgrid[Y0:Y1, X0:X1]
	m &= ~((xs < 186) & (ys > 442))   # sombra bajo el glaseado de la izquierda
	m &= ~((xs < 205) & (ys > 560))   # sombra de la roca a la izquierda del pozo
	m &= ys < 616                      # más abajo empiezan la corona y el pozo
	lab, n = ndi.label(m)
	m = ndi.binary_fill_holes(lab == 1 + np.argmax(ndi.sum(m, lab, range(1, n + 1))))
	cols = []
	for c in range(m.shape[1]):
		yy = np.where(m[:, c])[0]
		if len(yy):
			tramo = max(np.split(yy, np.where(np.diff(yy) > 1)[0] + 1), key=len)
			cols.append((c + X0, tramo[0] + Y0, tramo[-1] + Y0))
	return np.array(cols, float)


# ---------------------------------------------------------------- datos para el canvas

def tabla(desde, paso, valores):
	return "{ desde: %d, paso: %d, valores: [%s] }" % (desde, paso, ", ".join("%.1f" % v for v in valores))


def puntos(lista):
	return "[%s]" % ", ".join("[%.1f, %.1f]" % p for p in lista)


def escribir_datos(agua, xs, arriba, abajo, cols):
	paso = 6
	sel = slice(0, None, paso)
	x_c = cols[:, 0]
	cascada = [(x, t) for x, t, _ in cols[::3]] + [(x, b + 1) for x, _, b in cols[::-3]]
	glaseado = cols[(x_c >= 186) & (x_c <= 345)]
	canal = cols[x_c <= 186]
	labio_x, labio_y = zip(*LABIO)
	labio = np.interp(np.arange(labio_x[0], labio_x[-1] + 1), labio_x, labio_y)
	texto = f"""// Generado por scripts/generar-rio-chocolate.py: no editar a mano.
// Coordenadas en píxeles de fondopalabras.png (1933x1080).

// Contorno del agua (pozo + río), sin la orilla.
export const AGUA = {puntos(agua)};

// Bordes del agua por columna, desde x={int(xs[0])}.
export const AGUA_ARRIBA = {tabla(xs[0], paso, arriba[sel])};
export const AGUA_ABAJO = {tabla(xs[0], paso, abajo[sel])};

// Contorno del chocolate de la cascada (canal bajo el glaseado + chorro).
export const CASCADA = {puntos(cascada)};

// Borde del glaseado de donde sale el chorro (y por columna).
export const CASCADA_ORIGEN = {tabla(glaseado[0, 0], 1, glaseado[:, 1])};

// Labio por donde se vuelca el chorro (y por columna): ahí empieza la caída.
export const CASCADA_LABIO = {tabla(labio_x[0], 1, labio)};

// Canal bajo el glaseado: borde de arriba y de abajo por columna.
export const CANAL_ARRIBA = {tabla(canal[0, 0], 2, canal[::2, 1])};
export const CANAL_ABAJO = {tabla(canal[0, 0], 2, canal[::2, 2])};
"""
	with open(DATOS, "w", encoding="utf-8", newline="\n") as f:
		f.write(texto)


# ---------------------------------------------------------------- todo

def main():
	a = cargar()
	xs, arriba, abajo = detectar_agua(a)
	agua = contorno_agua(xs, arriba, abajo)
	limpio, tapado = borrar_burbujas(a)

	tile, t_med, b_med = base_rio(limpio, xs, arriba, abajo)
	Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8), "RGB").save(f"{SALIDA}/rio-chocolate-base.jpg", quality=90)

	carril = (t_med - RIO_Y + 10, b_med - RIO_Y - 10)
	brillo = brillos(TILE_BRILLOS, RIO_H, carril, np.random.default_rng(4))
	brillo.save(f"{SALIDA}/rio-chocolate-brillos.png", optimize=True)

	# Máscara: el agua tal cual, con el pozo fundiéndose hacia la caída de la cascada.
	m = rasterizar(agua, RIO_X, RIO_Y, RIO_W, RIO_H)
	m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), float) / 255
	m *= smoothstep(330, 480, np.arange(RIO_W) + RIO_X)[None, :]
	mascara = np.zeros((RIO_H, RIO_W, 4), np.uint8)
	mascara[..., :3] = 255
	mascara[..., 3] = np.round(m * 255)
	Image.fromarray(mascara, "RGBA").save(f"{SALIDA}/rio-chocolate-mascara.png", optimize=True)

	# Orillas: la línea de sombra bajo la orilla de arriba y el borde de abajo, en su lugar real.
	filas = (np.arange(RIO_H) + RIO_Y)[:, None]
	x_caja = np.arange(RIO_W) + RIO_X
	arr = np.interp(x_caja, xs, arriba)[None, :]
	aba = np.interp(x_caja, xs, abajo)[None, :]
	d_arr = np.clip(filas - arr, 0, None)
	d_aba = np.clip(aba - filas, 0, None)
	alfa = 0.75 * np.exp(-d_arr / 4) + 0.18 * np.exp(-d_arr / 18) + 0.45 * np.exp(-d_aba / 2.5)
	orillas = np.zeros((RIO_H, RIO_W, 4), np.uint8)
	orillas[..., :3] = (70, 24, 4)
	orillas[..., 3] = np.round(np.clip(alfa, 0, 0.85) * 255)
	Image.fromarray(orillas, "RGBA").save(f"{SALIDA}/rio-chocolate-orillas.png", optimize=True)

	# Parche fijo sobre las burbujas pintadas del pozo (ahí el río no se desplaza).
	sl = (slice(PARCHE_Y, PARCHE_Y + PARCHE_H), slice(PARCHE_X, PARCHE_X + PARCHE_W))
	alfa_parche = ndi.gaussian_filter(ndi.binary_dilation(tapado[sl], iterations=2).astype(float), 1.2)
	parche = np.zeros((PARCHE_H, PARCHE_W, 4), np.uint8)
	parche[..., :3] = np.clip(limpio[sl], 0, 255).astype(np.uint8)
	parche[..., 3] = np.round(np.clip(alfa_parche, 0, 1) * 255)
	Image.fromarray(parche, "RGBA").save(f"{SALIDA}/rio-chocolate-parche.png", optimize=True)

	cols = silueta_cascada(a)
	escribir_datos(agua, xs, arriba, abajo, cols)

	if PREVIEW:
		vista = a.copy()
		vista[sl] = vista[sl] * (1 - alfa_parche[..., None]) + limpio[sl] * alfa_parche[..., None]
		for desp, nombre in ((0, "0"), (500, "1")):
			v = vista.copy()
			reps = np.concatenate([tile] * 3, 1)
			ini = (TILE_BASE - desp % TILE_BASE) % TILE_BASE
			sup = reps[:, ini:ini + RIO_W]
			b = np.asarray(brillo, float)
			breps = np.concatenate([b] * 3, 1)
			bi = (TILE_BRILLOS - int(desp * 1.3) % TILE_BRILLOS) % TILE_BRILLOS
			bb = breps[:, bi:bi + RIO_W]
			sup = sup * (1 - bb[..., 3:] / 255) + bb[..., :3] * bb[..., 3:] / 255
			o = orillas.astype(float)
			sup = sup * (1 - o[..., 3:] / 255) + o[..., :3] * o[..., 3:] / 255
			zona = v[RIO_Y:RIO_Y + RIO_H, RIO_X:RIO_X + RIO_W]
			zona[:] = zona * (1 - m[..., None]) + sup * m[..., None]
			img = Image.fromarray(np.clip(v, 0, 255).astype(np.uint8))
			img.crop((150, 560, 1933, 780)).save(f"{PREVIEW}/vista-{nombre}.png")
			img.crop((380, 570, 1100, 780)).resize((1440, 420), Image.LANCZOS).save(f"{PREVIEW}/vista-zoom-{nombre}.png")
	print("ok", "cauce medio", round(t_med, 1), round(b_med, 1))


main()
