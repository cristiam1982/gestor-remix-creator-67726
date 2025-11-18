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
    // Convertir size de string a número (unificado con Reel)
    const logoSizeMap = { small: 60, medium: 70, large: 80, xlarge: 90 };
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
    const badgeScale = 1.0 + (textComposition.badgeScale / 100);
    const subtitleY = videoHeight * 0.15;
    const maxWidth = videoWidth * 0.85;
    const fontSize = 36 * badgeScale;
    
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = splitTextIntoLines(ctx, subtitle, maxWidth);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight + 32 * badgeScale;
    
    const badgeX = videoWidth / 2;
    const badgeY = subtitleY;
    const badgePadding = 44 * badgeScale;
    const badgeWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)) + badgePadding * 2);
    const badgeHeight = totalHeight;

    // Fondo blanco con sombra
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    
    const radius = 16 * badgeScale;
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

  // 4. Footer con información de propiedad (rediseñado con badges modernos)
  const scaleMultiplier = 1.0 + (textComposition.typographyScale / 100);
  const badgeScaleMultiplier = 1.0 + (textComposition.badgeScale / 100);
  const baseSpacing = 16;
  const spacingMap = { compact: -10, normal: 0, spacious: 15 };
  const dynamicSpacing = baseSpacing + (spacingMap[textComposition.verticalSpacing] || 0);
  
  const hasAnyFooterLayer = visualLayers.showPrice || visualLayers.showBadge || visualLayers.showIcons;
  
  if (hasAnyFooterLayer) {
    let currentY = videoHeight - 200;
    
    // Badge de Precio con color del aliado
    if (visualLayers.showPrice) {
      const priceY = currentY;
      const priceFontSize = 48 * badgeScaleMultiplier;
      const pricePadding = 20 * badgeScaleMultiplier;
      
      const precioNumero = typeof propertyData.canon === 'string' 
        ? parseFloat(propertyData.canon.replace(/[^\d]/g, '')) 
        : propertyData.canon;
      const precioFormateado = !isNaN(precioNumero) 
        ? `$${precioNumero.toLocaleString('es-CO')}`
        : `$${propertyData.canon}`;
      
      // Medir texto para dimensionar badge
      ctx.font = `900 ${priceFontSize}px Inter, sans-serif`;
      const priceMetrics = ctx.measureText(precioFormateado);
      const priceWidth = priceMetrics.width + pricePadding * 2;
      const priceHeight = priceFontSize + pricePadding * 1.2;
      const priceX = 40;
      
      // Fondo del badge con color del aliado
      ctx.fillStyle = aliadoConfig.colorPrimario;
      ctx.beginPath();
      ctx.roundRect(priceX, priceY, priceWidth, priceHeight, 12 * badgeScaleMultiplier);
      ctx.fill();
      
      // Border blanco semitransparente
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Texto del precio
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(precioFormateado, priceX + pricePadding, priceY + pricePadding * 0.6);
      
      currentY += priceHeight + dynamicSpacing;
    }
    
    // Título y ubicación (sin badge, solo texto con sombra)
    if (visualLayers.showBadge && propertyData.ubicacion) {
      const titleFontSize = 42 * scaleMultiplier;
      const locationFontSize = 24 * scaleMultiplier;
      
      ctx.font = `700 ${titleFontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#1F2937';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      
      const tipoTexto = propertyData.tipo === 'apartamento' ? 'Apartamento'
        : propertyData.tipo === 'casa' ? 'Casa'
        : propertyData.tipo === 'local' ? 'Local Comercial'
        : propertyData.tipo === 'oficina' ? 'Oficina'
        : propertyData.tipo === 'bodega' ? 'Bodega'
        : propertyData.tipo === 'lote' ? 'Lote'
        : '';
      
      ctx.fillText(tipoTexto, 40, currentY);
      currentY += titleFontSize + dynamicSpacing * 0.5;
      
      ctx.font = `600 ${locationFontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`📍 ${propertyData.ubicacion}`, 40, currentY);
      
      // Resetear sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      currentY += locationFontSize + dynamicSpacing;
    }
    
    // Características con badges blancos circulares individuales
    if (visualLayers.showIcons) {
      let iconX = 40;
      const iconBaseSize = 80 * badgeScaleMultiplier;
      const iconGap = 16;
      const iconY = currentY;
      
      const features = [];
      if (propertyData.habitaciones) features.push({ emoji: '🛏️', value: propertyData.habitaciones });
      if (propertyData.banos) features.push({ emoji: '🚿', value: propertyData.banos });
      if (propertyData.parqueaderos) features.push({ emoji: '🚗', value: propertyData.parqueaderos });
      if (propertyData.area) features.push({ emoji: '📐', value: `${propertyData.area}m²` });
      
      features.forEach((feature) => {
        const iconSize = iconBaseSize;
        
        // Badge circular blanco
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Resetear sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Emoji y número
        const emojiFontSize = 32 * badgeScaleMultiplier;
        const numberFontSize = 36 * badgeScaleMultiplier;
        
        ctx.font = `${emojiFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feature.emoji, iconX + iconSize * 0.35, iconY + iconSize / 2);
        
        ctx.font = `700 ${numberFontSize}px Inter, sans-serif`;
        ctx.fillStyle = '#1F2937';
        ctx.fillText(feature.value.toString(), iconX + iconSize * 0.7, iconY + iconSize / 2);
        
        iconX += iconSize + iconGap;
      });
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
