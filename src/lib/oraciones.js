export const ORACIONES = [
	{ id: "la-mula-salta", texto: "LA MULA SALTA", audio: "la mula salta" },
	{ id: "el-sol-sale", texto: "EL SOL SALE", audio: "el sol sale" },
	{ id: "lola-toma-te", texto: "LOLA TOMA TÉ", audio: "lola toma te" },
	{ id: "el-oso-sale", texto: "EL OSO SALE", audio: "el oso sale" },
	{ id: "tito-toma-mate", texto: "TITO TOMA MATE", audio: "tito toma mate" },
	{ id: "mami-ama-a-lola", texto: "MAMI AMA A LOLA", audio: "mami ama a lola" }
];

export function archivoPalabra(palabra) {
	const nombre = palabra.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	return `oraciones/palabra-${nombre}.mp3`;
}
