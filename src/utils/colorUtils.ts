/**
 * Convierte un color hexadecimal a formato rgba
 * Compatible con html2canvas para exportación correcta
 * @param hex - Color en formato #RRGGBB o #RGB
 * @param alpha - Valor de opacidad entre 0 y 1
 * @returns String en formato rgba(r, g, b, alpha)
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determina si un color es claro u oscuro basado en su luminancia
 * Útil para contraste automático de texto
 * @param hex - Color en formato #RRGGBB o #RGB
 * @returns true si el color es claro, false si es oscuro
 */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(normalized.substr(0, 2), 16);
  const g = parseInt(normalized.substr(2, 2), 16);
  const b = parseInt(normalized.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

/**
 * Convierte un color hex a hex con opacidad
 * Útil para evitar problemas con html2canvas y opacity inline
 * @param hex - Color en formato #RRGGBB o #RGB
 * @param opacity - Opacidad entre 0 y 1
 * @returns Color en formato #RRGGBBAA
 */
export function addOpacityToHex(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${alpha}`;
}

/**
 * Oscurece un color hex en un porcentaje dado (0-1)
 * Útil para mejorar contraste de badges sobre fondos similares
 */
export function darkenHex(hex: string, amount: number = 0.15): string {
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(normalized.substr(0, 2), 16);
  const g = parseInt(normalized.substr(2, 2), 16);
  const b = parseInt(normalized.substr(4, 2), 16);

  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r * (1 - amount));
  const ng = clamp(g * (1 - amount));
  const nb = clamp(b * (1 - amount));

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

