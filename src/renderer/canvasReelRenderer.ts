import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";
import { REEL_TEMPLATES, applyGradientIntensity } from "@/utils/reelTemplates";
import elGestorLogo from "@/assets/el-gestor-logo.png";

// Dimensiones fijas del canvas para reels
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

// Cache de imágenes cargadas
const imageCache = new Map<string, HTMLImageElement>();

// Cargar imagen con cache
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Solo aplicar crossOrigin para recursos externos
    try {
      const url = new URL(src, window.location.href);
      if (url.origin !== window.location.origin) {
        img.crossOrigin = "anonymous";
      }
    } catch (e) {
      // Si falla el parsing, es probablemente un path relativo (mismo origen)
    }
    
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (error) => {
      console.warn(`[canvasReelRenderer] Error loading image: ${src}`, error);
      reject(error);
    };
    img.src = src;
  });
};

// Pre-cargar todas las imágenes necesarias
export const preloadImages = async (
  photos: string[],
  aliadoLogo: string,
  includeElGestorLogo = true
): Promise<void> => {
  const imagesToLoad = [...photos, aliadoLogo];
  if (includeElGestorLogo) {
    imagesToLoad.push(elGestorLogo);
  }
  
  await Promise.all(imagesToLoad.map(src => loadImage(src).catch(() => null)));
};

// Dibujar imagen con modo cover (similar a object-fit: cover)
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = x;
  let offsetY = y;
  
  if (imgRatio > canvasRatio) {
    // Imagen más ancha - recortar lados
    drawWidth = height * imgRatio;
    offsetX = x - (drawWidth - width) / 2;
  } else {
    // Imagen más alta - recortar arriba/abajo
    drawHeight = width / imgRatio;
    offsetY = y - (drawHeight - height) / 2;
  }
  
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

// Dibujar rectángulo con bordes redondeados
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Dibujar gradiente negro estilo DOM
const drawGradient = (
  ctx: CanvasRenderingContext2D,
  direction: 'top' | 'bottom' | 'both' | 'none',
  intensity: number,
  width: number,
  height: number
) => {
  if (direction === 'none' || intensity === 0) return;

  // Calcular alpha igual que en el DOM: (intensity / 100) * 0.7
  const alpha = (intensity / 100) * 0.7;
  
  if (direction === 'top' || direction === 'both') {
    // Gradiente superior: negro a transparente (60% de altura)
    const gradientTop = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    gradientTop.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    gradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradientTop;
    ctx.fillRect(0, 0, width, height * 0.6);
  }
  
  if (direction === 'bottom' || direction === 'both') {
    // Gradiente inferior: transparente a negro (desde 40% hasta abajo)
    const gradientBottom = ctx.createLinearGradient(0, height * 0.4, 0, height);
    gradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientBottom.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    
    ctx.fillStyle = gradientBottom;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);
  }
};

// Convertir nombre de color Tailwind a valor hex
const getColorFromName = (name: string, shade: string): string => {
  const colors: Record<string, Record<string, string>> = {
    blue: { '900': '#1e3a8a' },
    purple: { '900': '#581c87' },
    gray: { '900': '#111827' },
    amber: { '900': '#78350f' },
    rose: { '900': '#881337' }
  };
  
  return colors[name]?.[shade] || '#000000';
};

// Convertir hex a RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Dibujar texto con métricas precisas
const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number
) => {
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
};

// Dibujar texto con letter-spacing (tracking-wider equivalente a ~0.05em)
const drawSpacedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number
) => {
  let currentX = x;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.fillText(char, currentX, y);
    const charWidth = ctx.measureText(char).width;
    currentX += charWidth + letterSpacingPx;
  }
};

// Formatear precio
const formatPrice = (value?: string): string => {
  if (!value) return '';
  const num = parseInt(value.replace(/\D/g, ''));
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Pre-carga las fuentes necesarias para garantizar renderizado consistente
 */
const preloadFonts = async (): Promise<void> => {
  if (!document.fonts || !document.fonts.load) {
    console.warn('Font loading API no disponible');
    return;
  }
  
  try {
    await Promise.all([
      // Poppins (usado en precios y badges)
      document.fonts.load('900 48px Poppins'),
      document.fonts.load('700 24px Poppins'),
      document.fonts.load('600 20px Poppins'),
      document.fonts.load('600 18px Poppins'),
      
      // Inter (tipografía secundaria)
      document.fonts.load('900 48px Inter'),
      document.fonts.load('700 24px Inter'),
      document.fonts.load('600 20px Inter')
    ]);
    
    console.log('✅ Fuentes pre-cargadas correctamente');
  } catch (error) {
    console.warn('⚠️ Error pre-cargando fuentes:', error);
  }
};

/**
 * Funciones de easing para animaciones suaves
 */
const easing = {
  easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number): number => t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elasticOut: (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

/**
 * Interfaz para transformaciones del logo
 */
interface LogoTransform {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

/**
 * Calcula las transformaciones de entrada del logo basadas en el tiempo transcurrido
 * AHORA SIMPLIFICADO: Solo soporta fade-in de 0.5 segundos
 */
const calculateLogoEntranceTransform = (
  elapsedTime: number
): LogoTransform => {
  const entranceDuration = 0.5; // Duración fija de 0.5 segundos
  
  // Si la animación ya terminó
  if (elapsedTime >= entranceDuration) {
    return { opacity: 1, scale: 1, translateX: 0, translateY: 0, rotation: 0 };
  }

  const progress = Math.min(elapsedTime / entranceDuration, 1);
  
  // Fade-in simple y robusto
  return { 
    opacity: easing.easeOut(progress), 
    scale: 1, 
    translateX: 0, 
    translateY: 0, 
    rotation: 0 
  };
};

// Dibujar logo con fondo
const drawLogoWithBackground = async (
  ctx: CanvasRenderingContext2D,
  logoUrl: string,
  settings: LogoSettings,
  aliadoConfig: AliadoConfig,
  width: number,
  height: number,
  elapsedTime?: number // Tiempo transcurrido para animación
) => {
  const sizes = { small: 80, medium: 90, large: 100 };
  const logoSize = sizes[settings.size];
  const margin = 20;
  
  // Calcular transformación de entrada automática (0.5s fade-in)
  const entranceTransform = elapsedTime !== undefined
    ? calculateLogoEntranceTransform(elapsedTime)
    : { opacity: 1, scale: 1, translateX: 0, translateY: 0, rotation: 0 };
  
  const animatedOpacity = (settings.opacity / 100) * entranceTransform.opacity;
  
  // Posición con desplazamiento de entrada
  let x = settings.position === 'top-left' ? margin : width - logoSize - margin;
  let y = margin;
  
  x += entranceTransform.translateX;
  y += entranceTransform.translateY;
  
  // Cargar logo
  const logoImg = await loadImage(logoUrl).catch(() => null);
  if (!logoImg) return;

  // Dibujar fondo según configuración
  if (settings.background !== 'none') {
    ctx.save();
    
    // Configurar sombra para fondo elevado
    if (settings.background === 'elevated') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
    }
    
    // Determinar radio de borde según shape
    let radius = 12;
    if (settings.shape === 'square') radius = 0;
    if (settings.shape === 'circle') radius = logoSize / 2;
    if (settings.shape === 'squircle') radius = logoSize * 0.3;
    
    // Dibujar fondo
    roundRect(ctx, x, y, logoSize, logoSize, radius);
    
    if (settings.background === 'frosted') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    } else if (settings.background === 'glow') {
      const rgb = hexToRgb(aliadoConfig.colorPrimario);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
    } else if (settings.background === 'elevated') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    }
    
    ctx.fill();
    ctx.restore();
  }
  
  // Dibujar logo con transformaciones de entrada
  ctx.save();
  ctx.globalAlpha = animatedOpacity;
  
  // Aplicar transformaciones desde el centro del logo
  const centerX = x + logoSize / 2;
  const centerY = y + logoSize / 2;
  ctx.translate(centerX, centerY);
  
  if (entranceTransform.rotation !== 0) {
    ctx.rotate((entranceTransform.rotation * Math.PI) / 180);
  }
  if (entranceTransform.scale !== 1) {
    ctx.scale(entranceTransform.scale, entranceTransform.scale);
  }
  
  ctx.translate(-centerX, -centerY);
  
  // Clip para forma del logo
  const radius = settings.shape === 'square' ? 0 :
                 settings.shape === 'circle' ? logoSize / 2 :
                 settings.shape === 'squircle' ? logoSize * 0.3 : 12;
  
  roundRect(ctx, x + 5, y + 5, logoSize - 10, logoSize - 10, radius);
  ctx.clip();
  
  ctx.drawImage(logoImg, x + 5, y + 5, logoSize - 10, logoSize - 10);
  ctx.restore();
};

// Dibujar slide de foto
export const drawSlide = async (
  ctx: CanvasRenderingContext2D,
  options: {
    photoUrl: string;
    propertyData: PropertyData;
    aliadoConfig: AliadoConfig;
    logoSettings: LogoSettings;
    textComposition: TextCompositionSettings;
    visualLayers: VisualLayers;
    photoIndex: number;
    elapsedTime?: number; // Tiempo transcurrido en segundos
  }
) => {
  const { photoUrl, propertyData, aliadoConfig, logoSettings, textComposition, visualLayers, photoIndex, elapsedTime } = options;
  
  // Habilitar suavizado de alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Pre-cargar fuentes para garantizar renderizado consistente
  await preloadFonts();
  
  // Limpiar canvas
  ctx.clearRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
  
  // 1. Dibujar foto de fondo
  if (visualLayers.showPhoto) {
    const photoImg = await loadImage(photoUrl).catch(() => null);
    if (photoImg) {
      drawImageCover(ctx, photoImg, 0, 0, REEL_WIDTH, REEL_HEIGHT);
    }
  }
  
  // 2. Aplicar gradiente negro estilo DOM
  const gradientDirection = propertyData.gradientDirection || 'both';
  const gradientIntensity = propertyData.gradientIntensity ?? 100;
  
  drawGradient(
    ctx,
    gradientDirection,
    gradientIntensity,
    REEL_WIDTH,
    REEL_HEIGHT
  );
  
  // 3. Dibujar logo del aliado con animación
  if (visualLayers.showAllyLogo) {
    const logoUrl = aliadoConfig.logo; // Siempre logo regular
    
    await drawLogoWithBackground(ctx, logoUrl, logoSettings, aliadoConfig, REEL_WIDTH, REEL_HEIGHT, elapsedTime);
  }
  
  // 4. Calcular escala de texto
  const typographyScale = 1 + (textComposition.typographyScale / 100);
  const badgeScale = 1 + (textComposition.badgeScale / 100);
  
  // 5. Layout inferior izquierdo estilo DOM
  const bottomPadding = 48; // bottom-12 = 3rem = 48px
  const leftPadding = 16; // p-4 = 1rem = 16px
  const rightPadding = 80; // pr-20 = 5rem = 80px para evitar logo El Gestor
  let currentY = REEL_HEIGHT - bottomPadding;
  
  ctx.textAlign = 'left';
  
  // 5a. Ubicación (más abajo)
  if (propertyData.ubicacion) {
    ctx.save();
    ctx.font = `bold ${Math.round(18 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`; // text-lg
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'bottom';
    
    // Sombra fuerte
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const locationText = `📍 ${propertyData.ubicacion}`;
    drawText(ctx, locationText, leftPadding, currentY, REEL_WIDTH - leftPadding - rightPadding);
    
    currentY -= Math.round(18 * typographyScale) + 16; // 18px tamaño + mb-4
    ctx.restore();
  }
  
  // 5b. Título (tipo de propiedad) arriba de ubicación
  const tipoText = propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1);
  ctx.save();
  ctx.font = `900 ${Math.round(32 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`; // text-3xl font-black
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'bottom';
  
  // Sombra fuerte
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  drawText(ctx, tipoText, leftPadding, currentY, REEL_WIDTH - leftPadding - rightPadding);
  currentY -= Math.round(32 * typographyScale) + 6; // 32px tamaño + mb-1.5
  ctx.restore();
  
  // 5c. Precio en píldora con fondo de color estilo DOM
  if (visualLayers.showPrice) {
    const priceValue = propertyData.modalidad === 'venta' 
      ? formatPrice(propertyData.valorVenta)
      : formatPrice(propertyData.canon);
    
    const modalidadLabel = propertyData.modalidad === 'venta' ? 'VENTA' : 'ARRIENDO';
    
    ctx.save();
    
    // Medir textos
    ctx.font = `600 ${Math.round(10 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`;
    const labelWidth = ctx.measureText(modalidadLabel).width;
    
    ctx.font = `900 ${Math.round(32 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`;
    const priceWidth = ctx.measureText(priceValue).width;
    
    const basePadding = 40 * typographyScale;
    const baseHeight = 60 * typographyScale;
    const pillWidth = Math.max(labelWidth, priceWidth) + basePadding; // padding px-5 = 20px cada lado
    const pillHeight = baseHeight; // Suficiente para label + precio
    const pillX = leftPadding;
    const pillY = currentY - pillHeight;
    
    // Dibujar píldora con color del aliado
    const rgb = hexToRgb(aliadoConfig.colorPrimario);
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`;
    
    // Borde blanco translúcido
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Sombra suave
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    
    roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 16);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowColor = 'transparent';
    
    // Texto blanco
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    // Label pequeño arriba con letter-spacing (tracking-wider)
    const padX = Math.round(20 * typographyScale);
    const labelTop = Math.round(10 * typographyScale);
    const priceBottom = Math.round(8 * typographyScale);

    ctx.font = `600 ${Math.round(10 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    const labelLetterSpacing = Math.round(10 * typographyScale * 0.05); // 0.05em equivalente
    drawSpacedText(ctx, modalidadLabel, pillX + padX, pillY + labelTop, labelLetterSpacing);
    
    // Precio grande abajo
    ctx.font = `900 ${Math.round(32 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'bottom';
    drawText(ctx, priceValue, pillX + padX, pillY + pillHeight - priceBottom);
    
    currentY = pillY - 12; // Espacio entre precio y badge
    ctx.restore();
  }
  
  // 5d. Badge/subtítulo opcional arriba del precio
  if (visualLayers.showBadge && propertyData.subtitulos && propertyData.subtitulos[photoIndex]) {
    const subtitle = propertyData.subtitulos[photoIndex];
    
    ctx.save();
    ctx.font = `600 ${Math.round(18 * badgeScale)}px Poppins, Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#111827';
    ctx.textBaseline = 'bottom';
    
    const subtitleWidth = ctx.measureText(subtitle).width + 40;
    const subtitleHeight = 44;
    const subtitleX = leftPadding;
    const subtitleY = currentY - subtitleHeight;
    
    // Fondo del badge
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    
    roundRect(ctx, subtitleX, subtitleY, subtitleWidth, subtitleHeight, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    drawText(ctx, subtitle, subtitleX + 20, subtitleY + subtitleHeight / 2 + 8, subtitleWidth - 40);
    ctx.restore();
  }
  
  
  // 6. Dibujar características/iconos (centrados arriba del contenido)
  if (visualLayers.showIcons) {
    const features: string[] = [];
    
    if (propertyData.habitaciones) features.push(`🛏️ ${propertyData.habitaciones}`);
    if (propertyData.banos) features.push(`🚿 ${propertyData.banos}`);
    if (propertyData.parqueaderos) features.push(`🚗 ${propertyData.parqueaderos}`);
    if (propertyData.area) features.push(`📐 ${propertyData.area}m²`);
    
    ctx.save();
    ctx.font = '600 18px Poppins, Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const iconSize = Math.round(54 * typographyScale);
    const iconSpacing = Math.round(20 * typographyScale);
    const totalWidth = features.length * iconSize + (features.length - 1) * iconSpacing;
    const startX = (REEL_WIDTH - totalWidth) / 2;
    const iconY = REEL_HEIGHT - 450;
    
    features.forEach((feature, index) => {
      const x = startX + index * (iconSize + iconSpacing);
      
      // Fondo del icono
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 12;
      
      roundRect(ctx, x, iconY, iconSize, iconSize, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = aliadoConfig.colorSecundario;
      ctx.font = `600 ${Math.round(16 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`;
      drawText(ctx, feature, x + iconSize / 2, iconY + iconSize / 2);
    });
    
    ctx.restore();
  }
  
  
  // 7. Logo de El Gestor (siempre visible, abajo derecha como DOM)
  try {
    const elGestorImg = await loadImage(elGestorLogo);
    
    // h-10 = 40px, calcular ancho proporcional
    const gestorHeight = 40;
    const gestorWidth = (elGestorImg.width / elGestorImg.height) * gestorHeight;
    
    // right-4 = 16px, bottom-12 = 48px
    const gestorX = REEL_WIDTH - gestorWidth - 16;
    const gestorY = REEL_HEIGHT - gestorHeight - 48;
    
    ctx.save();
    
    // Sombra drop-shadow equivalente
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.drawImage(elGestorImg, gestorX, gestorY, gestorWidth, gestorHeight);
    ctx.restore();
    
    console.log('[canvasReelRenderer] El Gestor logo rendered:', {
      loaded: true,
      size: `${gestorWidth.toFixed(0)}x${gestorHeight}`,
      pos: `(${gestorX.toFixed(0)}, ${gestorY.toFixed(0)})`
    });
  } catch (error) {
    console.warn('[canvasReelRenderer] Failed to load El Gestor logo:', error);
    
    // Fallback: dibujar texto "El Gestor"
    ctx.save();
    ctx.font = 'bold 24px Poppins, Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText('El Gestor', REEL_WIDTH - 16, REEL_HEIGHT - 48);
    ctx.restore();
  }
};

// Dibujar slide de resumen
export const drawSummarySlide = async (
  ctx: CanvasRenderingContext2D,
  options: {
    propertyData: PropertyData;
    aliadoConfig: AliadoConfig;
    logoSettings: LogoSettings;
    textComposition: TextCompositionSettings;
    backgroundStyle: 'solid' | 'blur' | 'mosaic';
    photos: string[];
    elapsedTime?: number;
  }
) => {
  const { propertyData, aliadoConfig, logoSettings, textComposition, backgroundStyle, photos, elapsedTime } = options;
  
  // Habilitar suavizado de alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Limpiar canvas
  ctx.clearRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
  
  // 1. Dibujar fondo según estilo
  if (backgroundStyle === 'solid') {
    ctx.fillStyle = aliadoConfig.colorPrimario;
    ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
  } else if (backgroundStyle === 'blur' || backgroundStyle === 'mosaic') {
    // Para blur/mosaic, dibujar la primera foto y aplicar efecto
    if (photos.length > 0) {
      const bgImg = await loadImage(photos[0]).catch(() => null);
      if (bgImg) {
        drawImageCover(ctx, bgImg, 0, 0, REEL_WIDTH, REEL_HEIGHT);
        
        // Aplicar overlay oscuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
      }
    }
  }
  
  // 2. Contenido del resumen
  ctx.save();
  
  // Título principal
  ctx.font = 'bold 56px Poppins, Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const mainTitle = propertyData.modalidad === 'venta' ? '¡Tu nueva propiedad!' : '¡Tu nuevo hogar!';
  drawText(ctx, mainTitle, REEL_WIDTH / 2, 300);
  
  // Precio grande
  const priceText = propertyData.modalidad === 'venta'
    ? formatPrice(propertyData.valorVenta)
    : formatPrice(propertyData.canon);
  
  ctx.font = 'bold 72px Poppins, Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  drawText(ctx, priceText, REEL_WIDTH / 2, 450);
  
  // Ubicación
  if (propertyData.ubicacion) {
    ctx.font = '600 32px Poppins, Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    drawText(ctx, `📍 ${propertyData.ubicacion}`, REEL_WIDTH / 2, 570);
  }
  
  // Características resumidas
  const features: string[] = [];
  if (propertyData.habitaciones) features.push(`${propertyData.habitaciones} hab`);
  if (propertyData.banos) features.push(`${propertyData.banos} baños`);
  if (propertyData.area) features.push(`${propertyData.area}m²`);
  
  if (features.length > 0) {
    ctx.font = '600 28px Poppins, Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    drawText(ctx, features.join(' • '), REEL_WIDTH / 2, 680);
  }
  
  // CTA
  ctx.font = 'bold 36px Poppins, Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  drawText(ctx, '¡Agenda tu visita hoy!', REEL_WIDTH / 2, 900);
  
  // WhatsApp
  ctx.font = '600 32px Poppins, Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  drawText(ctx, `📱 ${aliadoConfig.whatsapp}`, REEL_WIDTH / 2, 1000);
  
  // Nombre del aliado
  ctx.font = 'bold 28px Poppins, Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  drawText(ctx, aliadoConfig.nombre, REEL_WIDTH / 2, 1150);
  
  ctx.restore();
  
  // 3. Logo del aliado (centrado) con soporte para fade-in
  const logoUrl = aliadoConfig.logo; // Siempre logo regular
  const logoImg = await loadImage(logoUrl).catch(() => null);
  if (logoImg) {
    const logoSize = 180;
    const logoX = (REEL_WIDTH - logoSize) / 2;
    const logoY = 1300;
    
    ctx.save();
    
    // Aplicar fade-in automático si hay elapsedTime (0.5s fade-in)
    if (typeof elapsedTime === 'number') {
      const transform = calculateLogoEntranceTransform(elapsedTime);
      ctx.globalAlpha = transform.opacity * (logoSettings.opacity / 100);
    } else {
      ctx.globalAlpha = logoSettings.opacity / 100;
    }
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }
  
  // 4. Logo de El Gestor (right-4 bottom-12, h=40 para consistencia)
  try {
    const elGestorImg = await loadImage(elGestorLogo);
    const gestorHeight = 40;
    const gestorWidth = (elGestorImg.width / elGestorImg.height) * gestorHeight;
    const gestorX = REEL_WIDTH - gestorWidth - 16; // right-4
    const gestorY = REEL_HEIGHT - gestorHeight - 48; // bottom-12
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(elGestorImg, gestorX, gestorY, gestorWidth, gestorHeight);
    ctx.restore();
    
    console.log('[canvasReelRenderer/summary] El Gestor logo rendered:', {
      loaded: true,
      size: `${gestorWidth.toFixed(0)}x${gestorHeight}`,
      pos: `(${gestorX.toFixed(0)}, ${gestorY.toFixed(0)})`
    });
  } catch (error) {
    console.warn('[canvasReelRenderer/summary] Failed to load El Gestor logo:', error);
  }
};
