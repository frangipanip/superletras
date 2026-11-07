import { createContext, useContext } from "react";

/*
 * Reinicia la pantalla actual volviendo a montarla (App cambia la key de <Routes>), sin recargar.
 * Recargar saca al navegador de pantalla completa y en tablets/celulares reaparece la barra de
 * direcciones: los tamaños en vh siguen midiendo la pantalla entera y la actividad se corta abajo.
 * Al desmontar, usePageRuntime corta audios y timers de la vuelta anterior.
 */
export const ReiniciarPaginaContext = createContext(null);

export function useReiniciarPagina() {
	const reiniciar = useContext(ReiniciarPaginaContext);
	return reiniciar || (() => window.location.reload());
}
