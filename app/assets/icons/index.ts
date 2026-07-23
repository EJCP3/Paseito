/**
 * Registro único de íconos SVG del proyecto.
 * Cada valor es el contenido interno (paths/lines/circles) de un ícono de 24x24,
 * pensado para heredar `stroke="currentColor"` desde <Icon>. Los íconos de marca
 * (colores fijos: Google, Instagram, X) llevan su propio `fill` explícito.
 *
 * Convención: cualquier ícono nuevo (SVG o reemplazo de emoji) se agrega acá como
 * una key nueva — nunca pegado suelto en un componente ni como emoji.
 */
export const icons: Record<string, string> = {
  // --- Genéricos / UI ---
  close: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  search: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>',
  pencil: '<path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  camera: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>',
  menu: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>',
  filterLines: '<line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>',
  // Barras del toggle de filtro (ProductSession): las clases bar-top/bar-mid/bar-bot
  // las anima GSAP directamente, deben preservarse.
  menuMorph: '<line class="bar bar-top" x1="2" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line class="bar bar-mid" x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line class="bar bar-bot" x1="2" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  tag: '<path d="M7.859 6h-2.834a2 2 0 0 0 -2 2v3.675c0 .53 .211 1.04 .586 1.414l7.9 7.9a2.121 2.121 0 0 0 3 0l5.526 -5.526a2.121 2.121 0 0 0 0 -3l-7.9 -7.9a2 2 0 0 0 -1.414 -.586z"/><path d="M17.5 10.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"/>',
  heart: '<path d="M19.5 13.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/>',
  heartFilled: '<path fill="currentColor" stroke="none" d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z"/>',

  // --- Alertas / estados ---
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  // Solo el signo, sin círculo propio (para usar dentro de un badge que ya es redondo)
  exclamationMark: '<path d="M12 8v4"/><path d="M12 16h.01"/>',
  alertTriangle: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  shieldCheck: '<path d="M9 12l2 2l4 -4"/><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',

  // --- Marca Paseito ---
  footsteps: '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 16.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5"/><path d="M15 18.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5"/><path d="M8.52 12h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496"/><path d="M19.52 14h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496"/>',
  footstepsSolid: '<path fill="currentColor" stroke="none" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z"/>',

  // --- Marcas externas (colores fijos) ---
  instagram: '<path fill="currentColor" stroke="none" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>',
  brandX: '<path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  googleLogo: '<path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.63H1.29A11.98 11.98 0 000 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09z"/><path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z"/>',

  // --- Tipos de anuncio ---
  building: '<path d="M3 21l18 0"/><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"/><path d="M9 7l1 0"/><path d="M9 11l1 0"/><path d="M9 15l1 0"/><path d="M14 7l1 0"/><path d="M14 11l1 0"/><path d="M14 15l1 0"/>',
  home: '<path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>',
  villa: '<path d="M3 21l18 0"/><path d="M4 21v-11l8 -6l8 6v11"/><path d="M9 21v-5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v5"/><path d="M8 10l0 .01"/><path d="M16 10l0 .01"/>',
  car: '<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/>',

  // --- Specs de listado ---
  bed: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  bath: '<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',

  // --- Tour 360° / hotspots ---
  panorama: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18"/><path d="M12.5 3a17 17 0 0 1 0 18"/>',
  link: '<path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"/>',
  infoCircle: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="12" y1="7" x2="12.01" y2="7"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>',
  expand: '<path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>',
  collapse: '<path d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>',
  dragHorizontal: '<path d="M18 8l4 4l-4 4"/><path d="M6 8l-4 4l4 4"/><path d="M2 12l20 0"/>',

  // --- Spinner ---
  spinner: '<path d="M12 3a9 9 0 1 0 9 9"/>',

  // --- Puntos de interés cercanos ---
  mapPin: '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/>',
  shoppingCart: '<path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17h-11v-14h-2"/><path d="M6 5l14 1l-1 7h-13"/>',
  buildingStore: '<path d="M3 21l18 0"/><path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4"/><path d="M5 21l0 -10.15"/><path d="M19 21l0 -10.15"/><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"/>',
  medicalCross: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  school: '<path d="M22 9l-10 -4l-10 4l10 4l10 -4v6"/><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"/>',
  bus: '<rect x="3" y="6" width="18" height="10" rx="2"/><path d="M3 12h18"/><path d="M7 16v2"/><path d="M17 16v2"/><circle cx="7.5" cy="18.5" r="1"/><circle cx="16.5" cy="18.5" r="1"/>',
  buildingBank: '<path d="M3 21l18 0"/><path d="M3 10l18 0"/><path d="M5 6l7 -3l7 3"/><path d="M4 10l0 11"/><path d="M20 10l0 11"/><path d="M8 14l0 3"/><path d="M12 14l0 3"/><path d="M16 14l0 3"/>',
}
