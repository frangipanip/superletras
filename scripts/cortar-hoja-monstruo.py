# Corta una hoja de 6 cuadros de un monstruo (3 columnas x 2 filas, generada con ChatGPT) en los
# archivos monstruo-<letra>[-nivel2]-<cuadro>.webp de public/assets/imagenes/monstruos.
# ChatGPT deja el fondo con un alfa bajo (un velo, a veces blanco con alfa ~150): se limpia con un
# umbral que se calcula en cada hoja a partir de los bordes de las celdas. Los 6 cuadros se
# recortan con la misma caja (la unión de los contornos, relativa a cada celda), así el monstruo
# no salta de lugar ni cambia de tamaño al pasar de un cuadro a otro.
# Uso: python scripts/cortar-hoja-monstruo.py <hoja.png> <letra> <1|2> [--vista salida.png]
import sys
from pathlib import Path
from PIL import Image

ALFA_FONDO_MINIMO = 120   # por debajo: fondo (velo y halo de ChatGPT)
ALFA_LLENO = 245          # por encima: opaco
ALTO_FINAL = 520     # alto de cada cuadro (los de Mundo 1 rondan 490)
MARGEN = 0.04


def alfa_del_fondo(imagen):
	# Lo más opaco que aparece en una franja de 24 px en el borde de cada celda (ahí no hay monstruo).
	a = imagen.getchannel("A")
	ancho, alto = imagen.size[0] // 3, imagen.size[1] // 2
	maximo = 0
	for f in range(2):
		for c in range(3):
			x0, y0 = c * ancho, f * alto
			for caja in [(x0, y0, x0 + ancho, y0 + 24), (x0, y0 + alto - 24, x0 + ancho, y0 + alto), (x0, y0, x0 + 24, y0 + alto), (x0 + ancho - 24, y0, x0 + ancho, y0 + alto)]:
				maximo = max(maximo, a.crop(caja).getextrema()[1])
	return maximo


def limpiar_alfa(imagen):
	fondo = max(ALFA_FONDO_MINIMO, min(alfa_del_fondo(imagen) + 15, 225))
	r, g, b, a = imagen.split()
	a = a.point(lambda v: 0 if v <= fondo else 255 if v >= ALFA_LLENO else round((v - fondo) * 255 / (ALFA_LLENO - fondo)))
	print(f"umbral del fondo: {fondo}")
	return Image.merge("RGBA", (r, g, b, a))


def main():
	hoja, letra, nivel = sys.argv[1], sys.argv[2], sys.argv[3]
	vista = sys.argv[sys.argv.index("--vista") + 1] if "--vista" in sys.argv else None
	imagen = limpiar_alfa(Image.open(hoja).convert("RGBA"))
	ancho, alto = imagen.size[0] // 3, imagen.size[1] // 2
	celdas = [imagen.crop((c * ancho, f * alto, (c + 1) * ancho, (f + 1) * alto)) for f in range(2) for c in range(3)]
	cajas = [celda.getchannel("A").point(lambda v: 255 if v > 60 else 0).getbbox() for celda in celdas]
	union = (min(c[0] for c in cajas), min(c[1] for c in cajas), max(c[2] for c in cajas), max(c[3] for c in cajas))
	margen = round(max(union[2] - union[0], union[3] - union[1]) * MARGEN)
	caja = (max(0, union[0] - margen), max(0, union[1] - margen), min(ancho, union[2] + margen), min(alto, union[3] + margen))
	archivo = "gdieresis" if letra == "gü" else letra
	destino = Path("public/assets/imagenes/monstruos")
	cuadros = []
	for indice, celda in enumerate(celdas, start=1):
		cuadro = celda.crop(caja)
		escala = ALTO_FINAL / cuadro.height
		cuadro = cuadro.resize((round(cuadro.width * escala), ALTO_FINAL), Image.LANCZOS)
		sufijo = "nivel2-" if nivel == "2" else ""
		cuadro.save(destino / f"monstruo-{archivo}-{sufijo}{indice}.webp", "WEBP", quality=88, method=6)
		cuadros.append(cuadro)
	print(f"{letra} nivel {nivel}: caja {caja}, cuadros de {cuadros[0].size}")
	if vista:
		lienzo = Image.new("RGBA", (cuadros[0].width * 6, cuadros[0].height), (30, 30, 50, 255))
		for indice, cuadro in enumerate(cuadros):
			lienzo.alpha_composite(cuadro, (indice * cuadro.width, 0))
		lienzo.convert("RGB").resize((lienzo.width // 2, lienzo.height // 2)).save(vista)


if __name__ == "__main__":
	main()
