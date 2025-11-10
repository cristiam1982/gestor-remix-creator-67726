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
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
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

// Dibujar logo con fondo
const drawLogoWithBackground = async (
  ctx: CanvasRenderingContext2D,
  logoUrl: string,
  settings: LogoSettings,
  aliadoConfig: AliadoConfig,
  width: number,
  height: number
) => {
  const sizes = { small: 80, medium: 90, large: 100 };
  const logoSize = sizes[settings.size];
  const margin = 20;
  
  // Posición
  const x = settings.position === 'top-left' ? margin : width - logoSize - margin;
  const y = margin;
  
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
  
  // Dibujar logo con opacidad
  ctx.save();
  ctx.globalAlpha = settings.opacity / 100;
  
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
  }
) => {
  const { photoUrl, propertyData, aliadoConfig, logoSettings, textComposition, visualLayers, photoIndex } = options;
  
  // Habilitar suavizado de alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
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
  
  // 3. Dibujar logo del aliado
  if (visualLayers.showAllyLogo) {
    const logoUrl = logoSettings.background === 'none' 
      ? (aliadoConfig.logoTransparent || aliadoConfig.logo)
      : aliadoConfig.logo;
    
    await drawLogoWithBackground(ctx, logoUrl, logoSettings, aliadoConfig, REEL_WIDTH, REEL_HEIGHT);
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
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const locationText = `📍 ${propertyData.ubicacion}`;
    drawText(ctx, locationText, leftPadding, currentY, REEL_WIDTH - leftPadding - rightPadding);
    
    currentY -= 40; // Espacio entre ubicación y título
    ctx.restore();
  }
  
  // 5b. Título (tipo de propiedad) arriba de ubicación
  const tipoText = propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1);
  ctx.save();
  ctx.font = `900 ${Math.round(32 * typographyScale)}px Poppins, Inter, system-ui, sans-serif`; // text-3xl font-black
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'bottom';
  
  // Sombra fuerte
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  drawText(ctx, tipoText, leftPadding, currentY, REEL_WIDTH - leftPadding - rightPadding);
  currentY -= 60; // Espacio entre título y precio
  ctx.restore();
  
  // 5c. Precio en píldora con fondo de color estilo DOM
  if (visualLayers.showPrice) {
    const priceValue = propertyData.modalidad === 'venta' 
      ? formatPrice(propertyData.valorVenta)
      : formatPrice(propertyData.canon);
    
    const modalidadLabel = propertyData.modalidad === 'venta' ? 'VENTA' : 'ARRIENDO';
    
    ctx.save();
    
    // Medir textos
    ctx.font = '600 10px Poppins, Inter, system-ui, sans-serif';
    const labelWidth = ctx.measureText(modalidadLabel).width;
    
    ctx.font = '900 24px Poppins, Inter, system-ui, sans-serif';
    const priceWidth = ctx.measureText(priceValue).width;
    
    const pillWidth = Math.max(labelWidth, priceWidth) + 40; // padding px-5 = 20px cada lado
    const pillHeight = 60; // Suficiente para label + precio
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
    
    // Label pequeño arriba
    ctx.font = '600 10px Poppins, Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    drawText(ctx, modalidadLabel, pillX + 20, pillY + 10);
    
    // Precio grande abajo
    ctx.font = '900 24px Poppins, Inter, system-ui, sans-serif';
    ctx.textBaseline = 'bottom';
    drawText(ctx, priceValue, pillX + 20, pillY + pillHeight - 8);
    
    currentY = pillY - 16; // Espacio entre precio y badge
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
    
    const iconSize = 54;
    const iconSpacing = 20;
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
      ctx.font = '600 16px Poppins, Inter, system-ui, sans-serif';
      drawText(ctx, feature, x + iconSize / 2, iconY + iconSize / 2);
    });
    
    ctx.restore();
  }
  
  
  // 7. Logo de El Gestor (más pequeño, abajo derecha como DOM)
  const elGestorImg = await loadImage(elGestorLogo).catch(() => null);
  if (elGestorImg) {
    ctx.save();
    
    // h-10 = 40px, calcular ancho proporcional
    const gestorHeight = 40;
    const gestorWidth = (elGestorImg.width / elGestorImg.height) * gestorHeight;
    
    // right-4 = 16px, bottom-12 = 48px
    const gestorX = REEL_WIDTH - gestorWidth - 16;
    const gestorY = REEL_HEIGHT - gestorHeight - 48;
    
    // Sombra drop-shadow equivalente
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.drawImage(elGestorImg, gestorX, gestorY, gestorWidth, gestorHeight);
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
  }
) => {
  const { propertyData, aliadoConfig, logoSettings, textComposition, backgroundStyle, photos } = options;
  
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
  
  // 3. Logo del aliado (centrado)
  const logoUrl = aliadoConfig.logoTransparent || aliadoConfig.logo;
  const logoImg = await loadImage(logoUrl).catch(() => null);
  if (logoImg) {
    const logoSize = 180;
    const logoX = (REEL_WIDTH - logoSize) / 2;
    const logoY = 1300;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }
  
  // 4. Logo de El Gestor (abajo)
  const elGestorImg = await loadImage(elGestorLogo).catch(() => null);
  if (elGestorImg) {
    const gestorSize = 120;
    const gestorX = (REEL_WIDTH - gestorSize) / 2;
    const gestorY = REEL_HEIGHT - gestorSize - 40;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.drawImage(elGestorImg, gestorX, gestorY, gestorSize, gestorSize);
    ctx.restore();
  }
};
