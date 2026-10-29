// Opciones del formulario. Las usan el navegador (src/js/form.js) y el
// servidor (lib/lead.js), así que las etiquetas solo se cambian aquí.

export const SERVICIOS = [
  { id: 'redes', label: 'Gestión de redes sociales' },
  { id: 'ads', label: 'Meta Ads' },
  { id: 'ambas', label: 'Las dos', long: 'Las dos (redes y Meta Ads)' },
  { id: 'nose', label: 'Aún no lo sé' },
];

export const SECTORES = [
  { id: 'salud', label: 'Salud y bienestar' },
  { id: 'entrenamiento', label: 'Entrenamiento y deporte' },
  { id: 'belleza', label: 'Belleza y estética' },
  { id: 'restauracion', label: 'Restauración' },
  { id: 'motor', label: 'Motor y talleres' },
  { id: 'tienda', label: 'Tienda o e-commerce' },
  { id: 'profesionales', label: 'Servicios profesionales' },
  { id: 'otro', label: 'Otro' },
];

/** Texto de "Necesita" para el Sheet, el correo y WhatsApp. */
export function servicioLabel(id) {
  const s = SERVICIOS.find((x) => x.id === id);
  return s ? s.long || s.label : '';
}

/** Texto de "Negocio": el sector elegido o lo que escribió en "Otro". */
export function negocioLabel(sectorId, otro) {
  if (sectorId === 'otro') return clean(otro, 80);
  const s = SECTORES.find((x) => x.id === sectorId);
  return s ? s.label : '';
}

/** Recorta espacios, quita caracteres de control y limita la longitud. */
export function clean(value, max = 120) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
