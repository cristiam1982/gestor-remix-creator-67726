import html2canvas from "html2canvas";
// @ts-ignore - gif.js doesn't have TypeScript definitions
import GIF from "gif.js";
import { waitForNextFrame } from "./imageUtils";
import FFmpegManager from "./ffmpegManager";
import { PropertyData } from '@/types/property';
import { AliadoConfig } from '@/types/property';
import logoRubyMorales from '@/assets/logo-ruby-morales.png';
import elGestorLogoImg from '@/assets/el-gestor-logo.png';

/**
 * Detecta si es iOS o Safari
 */
const isIOSOrSafari = (): boolean => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
};

/**
 * Detecta si un canvas es probablemente negro muestreando 5 puntos
 */
const isCanvasLikelyBlack = (canvas: HTMLCanvasElement): boolean => {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const w = canvas.width;
    const h = canvas.height;
    const margin = 10;

    // Muestrear 5 puntos: centro y 4 esquinas
    const points = [
      [w / 2, h / 2],          // Centro
      [margin, margin],         // Top-left
      [w - margin, margin],     // Top-right
      [margin, h - margin],     // Bottom-left
      [w - margin, h - margin]  // Bottom-right
    ];

    let totalBrightness = 0;
    for (const [x, y] of points) {
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / points.length;
    return avgBrightness < 5; // Umbral más tolerante
  } catch (e) {
    // Si hay SecurityError (canvas tainted), asumimos que no es negro
    return false;
  }
};

/**
 * Obtiene el mejor MIME type soportado por el navegador para grabación de video
 */
const getSupportedMimeType = (): string => {
  const types = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'video/webm'; // Fallback
};

/**
 * Carga una imagen y devuelve HTMLImageElement
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Dibuja un rectángulo con bordes redondeados
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
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
}

/**
 * Renderiza un frame directamente en el canvas sin usar html2canvas
 */
async function renderFrameDirectToCanvas(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  logos: { aliado: HTMLImageElement, elGestor: HTMLImageElement }
): Promise<void> {
  const width = 1080;
  const height = 1920;

  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Dibujar foto de fondo (cover)
  const photoAspect = photo.width / photo.height;
  const canvasAspect = width / height;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (photoAspect > canvasAspect) {
    drawHeight = height;
    drawWidth = photo.width * (height / photo.height);
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = width;
    drawHeight = photo.height * (width / photo.width);
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(photo, offsetX, offsetY, drawWidth, drawHeight);

  // 2. Gradiente oscuro (top y bottom)
  const gradientTop = ctx.createLinearGradient(0, 0, 0, height * 0.3);
  gradientTop.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  gradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradientTop;
  ctx.fillRect(0, 0, width, height * 0.3);

  const gradientBottom = ctx.createLinearGradient(0, height * 0.6, 0, height);
  gradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradientBottom.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = gradientBottom;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  // 3. Logo aliado (top-left con borde blanco)
  const logoSize = 160;
  const logoX = 48;
  const logoY = 80;
  
  // Borde blanco redondo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Logo circular con clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logos.aliado, logoX, logoY, logoSize, logoSize);
  ctx.restore();

  // 4. Información inferior
  const bottomY = height - 420;
  
  // Tipo de propiedad (título)
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  const propertyTypeText = propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1);
  ctx.fillText(propertyTypeText, 48, bottomY);
  ctx.shadowBlur = 0;

  // Ubicación con icono
  ctx.font = '36px Inter, sans-serif';
  ctx.fillStyle = '#E0E0E0';
  const locationY = bottomY + 48;
  ctx.fillText(`📍 ${propertyData.ubicacion}`, 48, locationY);

  // Precio con fondo de color
  const priceY = locationY + 80;
  const priceText = `$${propertyData.canon?.toLocaleString() || 'Consultar'}`;
  ctx.font = 'bold 56px Inter, sans-serif';
  
  const priceMetrics = ctx.measureText(priceText);
  const priceWidth = priceMetrics.width + 48;
  const priceHeight = 80;
  
  // Fondo con color del aliado
  ctx.fillStyle = aliadoConfig.colorPrimario;
  roundRect(ctx, 48, priceY - 60, priceWidth, priceHeight, 16);
  ctx.fill();
  
  // Texto del precio
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText(priceText, 72, priceY - 12);

  // Badges de atributos
  const badgesY = priceY + 60;
  let badgeX = 48;
  
  const badges = [];
  if (propertyData.habitaciones) badges.push(`🛏️ ${propertyData.habitaciones}`);
  if (propertyData.banos) badges.push(`🚿 ${propertyData.banos}`);
  if (propertyData.parqueaderos) badges.push(`🚗 ${propertyData.parqueaderos}`);
  if (propertyData.area) badges.push(`📐 ${propertyData.area}m²`);

  ctx.font = '32px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  
  badges.forEach(badge => {
    const badgeMetrics = ctx.measureText(badge);
    const badgeWidth = badgeMetrics.width + 32;
    const badgeHeight = 52;
    
    // Fondo del badge
    roundRect(ctx, badgeX, badgesY, badgeWidth, badgeHeight, 12);
    ctx.fill();
    
    // Texto del badge
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badge, badgeX + 16, badgesY + 36);
    
    badgeX += badgeWidth + 16;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  });

  // 5. Logo El Gestor (bottom-right)
  const elGestorWidth = 140;
  const elGestorHeight = (elGestorWidth / logos.elGestor.width) * logos.elGestor.height;
  const elGestorX = width - elGestorWidth - 48;
  const elGestorY = height - elGestorHeight - 48;
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.drawImage(logos.elGestor, elGestorX, elGestorY, elGestorWidth, elGestorHeight);
  ctx.shadowBlur = 0;
}

/**
 * Renderiza el slide de resumen directamente en canvas
 */
async function renderSummarySlideToCanvas(
  ctx: CanvasRenderingContext2D,
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  logos: { aliado: HTMLImageElement, elGestor: HTMLImageElement }
): Promise<void> {
  const width = 1080;
  const height = 1920;

  // Fondo con color del aliado
  ctx.fillStyle = aliadoConfig.colorPrimario;
  ctx.fillRect(0, 0, width, height);

  // Logo aliado centrado arriba
  const logoSize = 200;
  const logoX = (width - logoSize) / 2;
  const logoY = 200;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logos.aliado, logoX, logoY, logoSize, logoSize);
  ctx.restore();

  // Título
  ctx.font = 'bold 72px Inter, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 8;
  
  const propertyTypeText = propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1);
  ctx.fillText(propertyTypeText, width / 2, 520);

  // Ubicación
  ctx.font = '48px Inter, sans-serif';
  ctx.fillText(`📍 ${propertyData.ubicacion}`, width / 2, 620);

  // Precio grande
  ctx.font = 'bold 96px Inter, sans-serif';
  const priceText = `$${propertyData.canon?.toLocaleString() || 'Consultar'}`;
  ctx.fillText(priceText, width / 2, 780);

  // Atributos
  ctx.font = '52px Inter, sans-serif';
  let attrY = 920;
  
  if (propertyData.habitaciones) {
    ctx.fillText(`🛏️ ${propertyData.habitaciones} Habitaciones`, width / 2, attrY);
    attrY += 80;
  }
  if (propertyData.banos) {
    ctx.fillText(`🚿 ${propertyData.banos} Baños`, width / 2, attrY);
    attrY += 80;
  }
  if (propertyData.area) {
    ctx.fillText(`📐 ${propertyData.area}m²`, width / 2, attrY);
    attrY += 80;
  }

  // CTA
  ctx.font = 'bold 56px Inter, sans-serif';
  ctx.fillText('¡Contáctanos ahora!', width / 2, attrY + 80);
  
  ctx.font = '44px Inter, sans-serif';
  ctx.fillText(aliadoConfig.whatsapp, width / 2, attrY + 160);

  // Logo El Gestor abajo
  const elGestorWidth = 160;
  const elGestorHeight = (elGestorWidth / logos.elGestor.width) * logos.elGestor.height;
  const elGestorX = (width - elGestorWidth) / 2;
  const elGestorY = height - elGestorHeight - 100;
  
  ctx.shadowBlur = 0;
  ctx.drawImage(logos.elGestor, elGestorX, elGestorY, elGestorWidth, elGestorHeight);
}

export interface VideoGenerationProgress {
  stage: "initializing" | "capturing" | "encoding" | "complete" | "error";
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  message: string;
  estimatedTimeLeft?: number;
}

const captureFrame = async (
  elementId: string,
  hideLogoOnError = false
): Promise<HTMLCanvasElement> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Elemento no encontrado");

  // Si se solicita ocultar el logo, hacerlo temporalmente
  let logoElement: HTMLElement | null = null;
  let originalDisplay = "";
  
  if (hideLogoOnError) {
    logoElement = element.querySelector('[data-ally-logo]') as HTMLElement;
    if (logoElement) {
      originalDisplay = logoElement.style.display;
      logoElement.style.display = "none";
    }
  }

  try {
    // Esperar a que las fuentes estén cargadas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Configuración base optimizada para 1080x1920
    const baseOptions = {
      scale: 1,
      backgroundColor: "#000000",
      logging: false,
      width: 1080,
      height: 1920,
      scrollX: 0,
      scrollY: 0,
      removeContainer: false,
      windowWidth: 1080,
      windowHeight: 1920,
      onclone: (clonedDoc: Document) => {
        // Hacer visible el elemento capturado en el documento clonado
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          const htmlElement = clonedElement as HTMLElement;
          htmlElement.style.opacity = '1';
          htmlElement.style.visibility = 'visible';
        }
        
        // Asegurar que todas las imágenes son visibles
        const imgs = clonedDoc.querySelectorAll('img');
        imgs.forEach(img => {
          const imgElement = img as HTMLImageElement;
          imgElement.style.opacity = '1';
          imgElement.style.display = 'block';
          if (!imgElement.complete || imgElement.naturalHeight === 0) {
            const originalSrc = imgElement.src;
            imgElement.src = '';
            imgElement.src = originalSrc;
          }
        });
      }
    };

    let canvas: HTMLCanvasElement | null = null;
    
    // INTENTO 1: Modo estándar con CORS
    try {
      console.log('📸 Intento 1: Captura estándar...');
      canvas = await html2canvas(element, {
        ...baseOptions,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 30000,
        foreignObjectRendering: false,
      });
      
      if (isCanvasLikelyBlack(canvas)) {
        console.warn('⚠️ Canvas negro detectado en intento 1');
        canvas = null;
      }
    } catch (e) {
      console.warn('❌ Intento 1 falló:', e);
      canvas = null;
    }

    // INTENTO 2: Con foreignObjectRendering
    if (!canvas) {
      try {
        console.log('📸 Intento 2: Con foreignObjectRendering...');
        canvas = await html2canvas(element, {
          ...baseOptions,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 30000,
          foreignObjectRendering: true,
        });
        
        if (isCanvasLikelyBlack(canvas)) {
          console.warn('⚠️ Canvas negro detectado en intento 2');
          canvas = null;
        }
      } catch (e) {
        console.warn('❌ Intento 2 falló:', e);
        canvas = null;
      }
    }

    // INTENTO 3: Sin CORS (allowTaint) - remover crossOrigin temporalmente
    if (!canvas) {
      console.log('📸 Intento 3: Sin CORS (allowTaint)...');
      
      // Remover crossOrigin de todas las imágenes
      const allImages = element.querySelectorAll('img');
      const originalCrossOrigins: (string | null)[] = [];
      allImages.forEach(img => {
        originalCrossOrigins.push(img.getAttribute('crossorigin'));
        img.removeAttribute('crossorigin');
      });

      try {
        canvas = await html2canvas(element, {
          ...baseOptions,
          useCORS: false,
          allowTaint: true,
          imageTimeout: 45000,
          foreignObjectRendering: true,
        });
        
        if (isCanvasLikelyBlack(canvas)) {
          console.warn('⚠️ Canvas negro incluso en intento 3');
        }
      } finally {
        // Restaurar crossOrigin
        allImages.forEach((img, idx) => {
          const original = originalCrossOrigins[idx];
          if (original !== null) {
            img.setAttribute('crossorigin', original);
          }
        });
      }
    }

    if (!canvas) {
      throw new Error('No se pudo capturar el frame después de 3 intentos');
    }

    // Log de diagnóstico con brillo del centro
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(canvas.width/2, canvas.height/2, 1, 1);
        const brightness = (imageData.data[0] + imageData.data[1] + imageData.data[2]) / 3;
        console.log(`✅ Frame capturado exitosamente: ${canvas.width}x${canvas.height}, brillo centro: ${brightness.toFixed(1)}`);
      }
    } catch (e) {
      console.log(`✅ Frame capturado exitosamente: ${canvas.width}x${canvas.height}`);
    }
    
    return canvas;
    
  } catch (error) {
    // Si es un error de CORS y no hemos intentado ocultar el logo, reintentar
    if (
      error instanceof Error &&
      (error.message.includes("tainted") || error.message.includes("cross-origin")) &&
      !hideLogoOnError
    ) {
      console.warn("Error de CORS persistente, reintentando sin logo del aliado...");
      return captureFrame(elementId, true);
    }
    throw error;
  } finally {
    // Restaurar el logo si se ocultó
    if (logoElement && originalDisplay !== undefined) {
      logoElement.style.display = originalDisplay;
    }
  }
};

export const generateReelVideo = async (
  photos: string[],
  elementId: string,
  onProgress: (progress: VideoGenerationProgress) => void,
  onPhotoChange: (index: number) => Promise<void>
): Promise<Blob> => {
  const startTime = Date.now();
  let corsRetryAttempted = false;

  try {
    onProgress({
      stage: "initializing",
      progress: 0,
      message: "Inicializando generador de reel...",
    });

    // Detectar número de workers según capacidad del dispositivo
    const numWorkers = Math.min(navigator.hardwareConcurrency || 2, 8);

    // Crear instancia de GIF optimizada para logos y colores limpios
    const gif = new GIF({
      workers: numWorkers,
      quality: 2, // Alta calidad de color (1-30, menor = mejor)
      width: 1080,
      height: 1920,
      workerScript: "/gif.worker.js",
      repeat: 0,
      transparent: null, // Sin transparencia
      dither: false, // Sin dithering para logos y colores planos más nítidos
    });

    onProgress({
      stage: "capturing",
      progress: 10,
      totalFrames: photos.length,
      currentFrame: 0,
      message: "Capturando frames...",
    });

    // Capturar cada foto como frame
    const frames: HTMLCanvasElement[] = [];
    for (let i = 0; i < photos.length; i++) {
      // Cambiar a la foto actual
      await onPhotoChange(i);
      
      // Esperar a que React renderice la nueva foto (doble rAF)
      await waitForNextFrame();

      try {
        const frameCanvas = await captureFrame(elementId, corsRetryAttempted);
        frames.push(frameCanvas);

        const captureProgress = 10 + ((i + 1) / photos.length) * 50;
        onProgress({
          stage: "capturing",
          progress: captureProgress,
          currentFrame: i + 1,
          totalFrames: photos.length,
          message: `Capturando frame ${i + 1} de ${photos.length}...`,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("tainted") || error.message.includes("cross-origin")) &&
          !corsRetryAttempted
        ) {
          console.warn("Error de CORS en frame", i + 1, "- Reintentando sin logo del aliado");
          corsRetryAttempted = true;
          
          // Reintentar este frame sin el logo
          const frameCanvas = await captureFrame(elementId, true);
          frames.push(frameCanvas);
        } else {
          console.error(`Error capturando frame ${i + 1}:`, error);
          throw new Error(`Error en frame ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
      }
    }

    // Debug: dimensiones del primer frame capturado (si existe)
    if (frames[0]) {
      console.log("Dimensiones del primer frame:", frames[0].width + "x" + frames[0].height);
    }

    onProgress({
      stage: "encoding",
      progress: 70,
      totalFrames: photos.length,
      message: "Generando reel animado...",
    });

    // Agregar frames al GIF usando snapshots PNG (garantiza inclusión del logo)
    const snapshotPromises = frames.map((canvas, idx) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = dataUrl;
        console.log(`Snapshot creado para frame ${idx + 1}`);
      });
    });

    const snapshots = await Promise.all(snapshotPromises);

    snapshots.forEach((img, idx) => {
      gif.addFrame(img, { delay: 2500, copy: true });
    });

    // Renderizar GIF
    return new Promise((resolve, reject) => {
      gif.on("finished", (blob: Blob) => {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        onProgress({
          stage: "complete",
          progress: 100,
          message: `¡Reel listo en ${totalTime}s!`,
        });
        resolve(blob);
      });

      gif.on("progress", (p: number) => {
        const elapsed = (Date.now() - startTime) / 1000;
        const estimated = p > 0 ? Math.round((elapsed / p) * (1 - p)) : 0;
        
        onProgress({
          stage: "encoding",
          progress: 70 + p * 28,
          currentFrame: Math.round(p * photos.length),
          totalFrames: photos.length,
          message: `Generando reel... ${Math.round(p * 100)}%`,
          estimatedTimeLeft: estimated,
        });
      });

      gif.on("error", (error: Error) => {
        reject(error);
      });

      gif.render();
    });
  } catch (error) {
    console.error("Error generando reel:", error);
    
    let errorMessage = "Error desconocido";
    if (error instanceof Error) {
      if (error.message.includes("tainted") || error.message.includes("cross-origin")) {
        errorMessage = "Error de CORS: No se pudo capturar el logo del aliado";
      } else {
        errorMessage = error.message;
      }
    }
    
    onProgress({
      stage: "error",
      progress: 0,
      message: errorMessage,
    });
    throw error;
  }
};

/**
 * Espera a que el contenedor de captura esté listo: fonts, imágenes cargadas
 */
const waitForCaptureReady = async (elementId: string): Promise<void> => {
  // Esperar fonts
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Esperar imágenes dentro del elemento
  const container = document.getElementById(elementId);
  if (container) {
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continuar aunque falle
        // Timeout por si acaso
        setTimeout(() => resolve(), 2000);
      });
    });
    await Promise.all(imagePromises);
  }

  // Esperar frames de renderizado
  await waitForNextFrame();
  await waitForNextFrame();
  await waitForNextFrame();
  await waitForNextFrame();
  
  // Delay adicional aumentado para captura estable
  await new Promise(resolve => setTimeout(resolve, 300));
};

/**
 * Genera un video MP4 usando MediaRecorder API (Fase 2)
 * Más rápido, mejor calidad y menor peso que GIF
 * Incluye slide de resumen al final
 */
export const generateReelVideoMP4 = async (
  photos: string[],
  elementId: string,
  onProgress: (progress: VideoGenerationProgress) => void,
  onPhotoChange: (index: number) => Promise<void>,
  includeSummary: boolean = true,
  slideDuration: number = 1300, // Duración dinámica por foto en ms
  propertyData?: PropertyData,
  aliadoConfig?: AliadoConfig
): Promise<Blob> => {
  const startTime = Date.now();
  
  try {
    console.log('🎬 Iniciando generación de video MP4 con MediaRecorder');
    console.log('🎯 Captura DOM activada:', elementId);
    
    onProgress({
      stage: "initializing",
      progress: 0,
      message: "Inicializando grabación de video...",
    });

    // Verificar soporte de MediaRecorder
    if (!window.MediaRecorder) {
      throw new Error("Tu navegador no soporta grabación de video");
    }

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Elemento no encontrado");

    // Crear canvas para captura
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true 
    });
    
    if (!ctx) throw new Error("No se pudo crear contexto de canvas");

    // Configurar MediaRecorder
    const stream = canvas.captureStream(30); // 30 FPS
    const mimeType = getSupportedMimeType();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000 // 5 Mbps para buena calidad
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Iniciar grabación
    mediaRecorder.start();
    
    onProgress({
      stage: "capturing",
      progress: 10,
      totalFrames: photos.length + (includeSummary ? 1 : 0),
      currentFrame: 0,
      message: "Grabando video...",
    });

    // Usar duración dinámica proporcionada
    const photoDuration = slideDuration;
    const summaryDuration = 2500; // 2.5 segundos para slide de resumen
    const fps = 30;
    const framesPerPhoto = Math.floor((photoDuration / 1000) * fps);
    const framesPerSummary = Math.floor((summaryDuration / 1000) * fps);

    const totalSlides = photos.length + (includeSummary ? 1 : 0);

    // Generar frames para cada foto
    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      const progressPercent = Math.round(((photoIndex + 1) / totalSlides) * 80) + 10;
      onProgress({
        stage: "capturing",
        progress: progressPercent,
        currentFrame: photoIndex + 1,
        totalFrames: totalSlides,
        message: `Grabando foto ${photoIndex + 1} de ${photos.length}...`,
      });
      console.log(`📸 Preparando slide ${photoIndex + 1}/${photos.length} (esperando assets)...`);

      // Actualizar el DOM con la foto actual
      await onPhotoChange(photoIndex);

      // Esperar a que el contenedor esté listo para captura
      await waitForCaptureReady(elementId);

      // Capturar el frame del DOM con reintentos
      let frameCanvas: HTMLCanvasElement | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!frameCanvas && retryCount < maxRetries) {
        try {
          const capturedCanvas = await captureFrame(elementId, false);
          
          // Validar que el frame no esté oscuro
          if (isCanvasLikelyBlack(capturedCanvas)) {
            console.warn(`⚠️ Frame oscuro detectado, reintento #${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 150));
            retryCount++;
            continue;
          }
          
          frameCanvas = capturedCanvas;
          console.log('🖼️ Capturado', frameCanvas.width, 'x', frameCanvas.height);
        } catch (error) {
          if (retryCount === 0 && error instanceof Error && 
              (error.message.includes("tainted") || error.message.includes("cross-origin"))) {
            console.warn('⚠️ Error CORS, reintentando sin logo del aliado...');
            try {
              const capturedCanvas = await captureFrame(elementId, true);
              if (!isCanvasLikelyBlack(capturedCanvas)) {
                frameCanvas = capturedCanvas;
                console.log('🖼️ Capturado sin logo del aliado');
                break;
              }
            } catch (e) {
              console.error('⚠️ Error en reintento sin logo:', e);
            }
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Si todos los reintentos fallaron, fallback a FFmpeg
      if (!frameCanvas || isCanvasLikelyBlack(frameCanvas)) {
        console.error('❌ No se pudo capturar frame válido, activando fallback FFmpeg...');
        console.log('🍎 Fallback FFmpeg frames activado');
        return generateReelVideoMP4_FFmpegFrames(
          photos,
          elementId,
          onProgress,
          onPhotoChange,
          includeSummary,
          slideDuration
        );
      }
      
      // Dibujar este frame múltiples veces para mantener la duración
      for (let frameNum = 0; frameNum < framesPerPhoto; frameNum++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }
    }

    // Generar frames para el slide de resumen si está habilitado
    if (includeSummary) {
      onProgress({
        stage: "capturing",
        progress: 95,
        currentFrame: totalSlides,
        totalFrames: totalSlides,
        message: 'Grabando slide de resumen...',
      });
      console.log('📊 Preparando slide de resumen (esperando assets)...');

      // Actualizar el DOM para mostrar el slide de resumen
      await onPhotoChange(photos.length);

      // Esperar a que el contenedor esté listo
      await waitForCaptureReady(elementId);

      // Capturar el frame del slide de resumen con reintentos
      let summaryCanvas: HTMLCanvasElement | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!summaryCanvas && retryCount < maxRetries) {
        try {
          const capturedCanvas = await captureFrame(elementId, false);
          
          if (isCanvasLikelyBlack(capturedCanvas)) {
            console.warn(`⚠️ Frame resumen oscuro, reintento #${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 150));
            retryCount++;
            continue;
          }
          
          summaryCanvas = capturedCanvas;
          console.log('🖼️ Frame resumen capturado');
        } catch (error) {
          if (retryCount === 0 && error instanceof Error && 
              (error.message.includes("tainted") || error.message.includes("cross-origin"))) {
            console.warn('⚠️ Error CORS en resumen, reintentando sin logo del aliado...');
            try {
              const capturedCanvas = await captureFrame(elementId, true);
              if (!isCanvasLikelyBlack(capturedCanvas)) {
                summaryCanvas = capturedCanvas;
                console.log('🖼️ Resumen capturado sin logo del aliado');
                break;
              }
            } catch (e) {
              console.error('⚠️ Error en reintento resumen sin logo:', e);
            }
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (!summaryCanvas || isCanvasLikelyBlack(summaryCanvas)) {
        console.error('❌ No se pudo capturar slide de resumen, activando fallback FFmpeg...');
        console.log('🍎 Fallback FFmpeg frames activado');
        return generateReelVideoMP4_FFmpegFrames(
          photos,
          elementId,
          onProgress,
          onPhotoChange,
          includeSummary,
          slideDuration
        );
      }

      // Dibujar el slide de resumen durante ~2.5 segundos
      for (let frameNum = 0; frameNum < framesPerSummary; frameNum++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(summaryCanvas, 0, 0, canvas.width, canvas.height);
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }
    }

    // Finalizar grabación
    onProgress({
      stage: "encoding",
      progress: 95,
      message: "Finalizando video...",
    });

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        
        onProgress({
          stage: "complete",
          progress: 100,
          message: `¡Video listo en ${totalTime}s!`,
        });
        
        resolve(blob);
      };

      mediaRecorder.onerror = (e) => {
        reject(new Error("Error durante la grabación"));
      };

      mediaRecorder.stop();
    });

  } catch (error) {
    console.error("Error generando video MP4:", error);
    
    onProgress({
      stage: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    throw error;
  }
};

/**
 * Genera video MP4 usando FFmpeg frame-by-frame (máxima compatibilidad iOS/Safari)
 */
export const generateReelVideoMP4_FFmpegFrames = async (
  photos: string[],
  elementId: string,
  onProgress: (progress: VideoGenerationProgress) => void,
  onPhotoChange: (index: number) => Promise<void>,
  includeSummary: boolean = true,
  slideDuration: number = 1300
): Promise<Blob> => {
  const startTime = Date.now();
  
  try {
    onProgress({
      stage: "initializing",
      progress: 0,
      message: "Inicializando generación compatible H.264...",
    });

    // Cargar FFmpeg
    const ffmpeg = FFmpegManager.getInstance();
    if (!ffmpeg.isLoaded()) {
      onProgress({
        stage: "initializing",
        progress: 5,
        message: "Cargando conversor FFmpeg...",
      });
      await ffmpeg.load();
    }

    // Pre-cargar imágenes
    onProgress({
      stage: "initializing",
      progress: 10,
      message: "Pre-cargando imágenes...",
    });

    const imagePromises = photos.map(src => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.onload = () => resolve(img);
        img.onerror = () => {
          const img2 = new Image();
          img2.referrerPolicy = "no-referrer";
          img2.onload = () => resolve(img2);
          img2.onerror = reject;
          img2.src = src;
        };
        img.src = src;
      });
    });

    await Promise.all(imagePromises);
    console.log('✅ Imágenes pre-cargadas');

    const fps = 30;
    const framesPerPhoto = Math.floor((slideDuration / 1000) * fps);
    const framesPerSummary = Math.floor((2.5) * fps); // 2.5s para resumen
    const totalSlides = photos.length + (includeSummary ? 1 : 0);

    let frameNumber = 0;

    // Capturar frames para cada foto
    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      await onPhotoChange(photoIndex);
      
      // Esperar a que el contenedor esté listo
      await waitForCaptureReady(elementId);

      console.log(`📸 Capturando frames para foto ${photoIndex + 1}/${photos.length}...`);
      const frameCanvas = await captureFrame(elementId, false);
      
      // Duplicar frame según duración
      for (let i = 0; i < framesPerPhoto; i++) {
        frameNumber++;
        
        // Convertir canvas a PNG
        const blob = await new Promise<Blob>((resolve) => {
          frameCanvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
        });
        
        const data = new Uint8Array(await blob.arrayBuffer());
        const frameName = `frame_${String(frameNumber).padStart(4, '0')}.png`;
        await ffmpeg.writeFile(frameName, data);
      }

      const captureProgress = 15 + ((photoIndex + 1) / totalSlides) * 60;
      onProgress({
        stage: "capturing",
        progress: captureProgress,
        currentFrame: photoIndex + 1,
        totalFrames: totalSlides,
        message: `Capturando slide ${photoIndex + 1} de ${totalSlides}...`,
      });
    }

    // Capturar slide de resumen
    if (includeSummary) {
      await onPhotoChange(photos.length);
      
      // Esperar a que el contenedor esté listo
      await waitForCaptureReady(elementId);

      console.log('📸 Capturando slide de resumen...');
      const summaryCanvas = await captureFrame(elementId, false);
      
      for (let i = 0; i < framesPerSummary; i++) {
        frameNumber++;
        
        const blob = await new Promise<Blob>((resolve) => {
          summaryCanvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
        });
        
        const data = new Uint8Array(await blob.arrayBuffer());
        const frameName = `frame_${String(frameNumber).padStart(4, '0')}.png`;
        await ffmpeg.writeFile(frameName, data);
      }

      onProgress({
        stage: "capturing",
        progress: 75,
        currentFrame: totalSlides,
        totalFrames: totalSlides,
        message: `Capturando slide de resumen...`,
      });
    }

    // Codificar con FFmpeg
    onProgress({
      stage: "encoding",
      progress: 80,
      message: "Codificando video H.264...",
    });

    console.log(`🎬 Codificando ${frameNumber} frames a 30fps con FFmpeg...`);
    
    await ffmpeg.exec([
      '-r', '30',
      '-i', 'frame_%04d.png',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    onProgress({
      stage: "encoding",
      progress: 95,
      message: "Finalizando video...",
    });

    // Leer resultado
    const data = await ffmpeg.readFile('output.mp4');
    const videoBlob = new Blob([data as BlobPart], { type: 'video/mp4' });

    // Limpiar archivos temporales
    for (let i = 1; i <= frameNumber; i++) {
      const frameName = `frame_${String(i).padStart(4, '0')}.png`;
      try {
        await ffmpeg.deleteFile(frameName);
      } catch (e) {
        // Ignorar errores de limpieza
      }
    }
    await ffmpeg.deleteFile('output.mp4');

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    onProgress({
      stage: "complete",
      progress: 100,
      message: `¡Video H.264 listo en ${totalTime}s!`,
    });

    return videoBlob;
    
  } catch (error) {
    console.error("Error generando video con FFmpeg:", error);
    
    onProgress({
      stage: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    throw error;
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Exportar helpers para uso externo
export { isIOSOrSafari };
