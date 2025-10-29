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
