import { PropertyData, AliadoConfig } from "@/types/property";
import { MultiVideoVisualSettings } from "@/types/multiVideo";

/**
 * Función unificada para dibujar overlays en videos multi-video
 * Usada tanto en el preview estático como en la generación final del video
 */
export async function drawOverlays(
  ctx: CanvasRenderingContext2D,
  videoWidth: number,
  videoHeight: number,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  visualSettings: MultiVideoVisualSettings,
  subtitle?: string,
  allyLogo?: HTMLImageElement,
  elGestorLogo?: HTMLImageElement
) {
  const { gradientDirection, gradientIntensity, logoSettings, textComposition, visualLayers } = visualSettings;

  // 1. Aplicar gradientes según dirección e intensidad
  if (gradientDirection !== 'none') {
    const opacity = gradientIntensity / 100;

    if (gradientDirection === 'top' || gradientDirection === 'both') {
      const gradientTop = ctx.createLinearGradient(0, 0, 0, videoHeight * 0.4);
      gradientTop.addColorStop(0, `rgba(0, 0, 0, ${opacity * 0.7})`);
      gradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradientTop;
      ctx.fillRect(0, 0, videoWidth, videoHeight * 0.4);
    }

    if (gradientDirection === 'bottom' || gradientDirection === 'both') {
      const gradientBottom = ctx.createLinearGradient(0, videoHeight * 0.6, 0, videoHeight);
      gradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradientBottom.addColorStop(1, `rgba(0, 0, 0, ${opacity * 0.7})`);
      ctx.fillStyle = gradientBottom;
      ctx.fillRect(0, videoHeight * 0.6, videoWidth, videoHeight * 0.4);
    }
  }

  // 2. Dibujar logo del aliado si está habilitado
  if (visualLayers.showAllyLogo && allyLogo && allyLogo.complete) {
    // Convertir size de string a número
    const logoSizeMap = { small: 50, medium: 60, large: 70, xlarge: 80 };
    const logoSize = typeof logoSettings.size === 'number' 
      ? logoSettings.size 
      : logoSizeMap[logoSettings.size as keyof typeof logoSizeMap] || 70;
    const logoOpacity = (logoSettings.opacity ?? 100) / 100;
    
    ctx.save();
    ctx.globalAlpha = logoOpacity;

    let logoX = 40;
    let logoY = 40;

    // Calcular posición según configuración
    if (logoSettings.position === 'top-right') {
      logoX = videoWidth - logoSize - 40;
      logoY = 40;
    }

    // Fondo del logo si no es 'none'
    if (logoSettings.background && logoSettings.background !== 'none') {
      const padding = 10;
      const bgSize = logoSize + padding * 2;
      const bgX = logoX - padding;
      const bgY = logoY - padding;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      
      if (logoSettings.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(bgX + bgSize / 2, bgY + bgSize / 2, bgSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const radius = 12;
        ctx.beginPath();
        ctx.moveTo(bgX + radius, bgY);
        ctx.lineTo(bgX + bgSize - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
        ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
        ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
        ctx.lineTo(bgX + radius, bgY + bgSize);
        ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Dibujar logo con forma
    ctx.save();
    if (logoSettings.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(allyLogo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    ctx.restore();
  }

  // 3. Dibujar subtítulo si está presente y habilitado
  if (subtitle && visualLayers.showBadge) {
    const subtitleY = videoHeight * 0.15;
    const maxWidth = videoWidth * 0.85;
    const fontSize = 36;
    
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = splitTextIntoLines(ctx, subtitle, maxWidth);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight + 32;
    
    const badgeX = videoWidth / 2;
    const badgeY = subtitleY;
    const badgePadding = 44;
    const badgeWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)) + badgePadding * 2);
    const badgeHeight = totalHeight;

    // Fondo blanco con sombra
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    
    const radius = 16;
    const x = badgeX - badgeWidth / 2;
    const y = badgeY - badgeHeight / 2;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + badgeWidth - radius, y);
    ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + radius);
    ctx.lineTo(x + badgeWidth, y + badgeHeight - radius);
    ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight);
    ctx.lineTo(x + radius, y + badgeHeight);
    ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Texto del subtítulo
    ctx.fillStyle = '#1F2937';
    const startY = badgeY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, badgeX, startY + index * lineHeight);
    });
  }

  // 4. Footer con información de propiedad (CONDICIONAL)
  const hasAnyFooterLayer = visualLayers.showPrice || visualLayers.showBadge || visualLayers.showIcons;
  
  if (hasAnyFooterLayer) {
    const footerY = videoHeight - 310;
    
    // Fondo blanco del footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, footerY, videoWidth, 310);

    ctx.textAlign = 'left';

    // Precio (condicional)
    if (visualLayers.showPrice) {
      // Modalidad
      const modalidadTexto = propertyData.modalidad === 'arriendo' ? '💰 Arriendo Mensual' : '💵 Venta';
      ctx.font = '600 32px Inter, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(modalidadTexto, 40, footerY + 55);

      // Canon/Precio formateado correctamente
      const precioNumero = typeof propertyData.canon === 'string' 
        ? parseFloat(propertyData.canon.replace(/[^\d]/g, '')) 
        : propertyData.canon;
      const precioFormateado = !isNaN(precioNumero) 
        ? `$${precioNumero.toLocaleString('es-CO')}`
        : `$${propertyData.canon}`;
      
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText(precioFormateado, 40, footerY + 110);
    }

    // Ubicación y tipo (condicional - showBadge)
    if (visualLayers.showBadge) {
      // Ubicación
      ctx.font = '600 32px Inter, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(propertyData.ubicacion || 'Ubicación', 40, footerY + 155);

      // Tipo de inmueble
      const tipoTexto = propertyData.tipo === 'apartamento' ? '🏢 Apartamento'
        : propertyData.tipo === 'casa' ? '🏠 Casa'
        : propertyData.tipo === 'local' ? '🏪 Local Comercial'
        : propertyData.tipo === 'oficina' ? '🏢 Oficina'
        : propertyData.tipo === 'bodega' ? '🏭 Bodega'
        : propertyData.tipo === 'lote' ? '🌳 Lote'
        : '';
      
      ctx.font = '600 32px Inter, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText(tipoTexto || '', 40, footerY + 205);
    }

    // Atributos (condicional)
    if (visualLayers.showIcons) {
      let atributos = '';
      if (propertyData.habitaciones) atributos += `🛏 ${propertyData.habitaciones} Hab  `;
      if (propertyData.banos) atributos += `🚿 ${propertyData.banos} Baños  `;
      if (propertyData.parqueaderos) atributos += `🚗 ${propertyData.parqueaderos} Parq  `;
      if (propertyData.area) atributos += `📐 ${propertyData.area}m²`;
      
      ctx.font = '600 30px Inter, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(atributos, 40, footerY + 260);
    }
  }

  // 5. Logo "El Gestor" (condicional según showCTA)
  if (visualLayers.showCTA && elGestorLogo && elGestorLogo.complete) {
    const elGestorSize = 80;
    const elGestorX = videoWidth - elGestorSize - 40;
    const elGestorY = videoHeight - elGestorSize - 48;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(elGestorLogo, elGestorX, elGestorY, elGestorSize, elGestorSize);
    ctx.restore();
  }
}

/**
 * Divide texto en líneas que caben dentro del ancho máximo
 */
function splitTextIntoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
