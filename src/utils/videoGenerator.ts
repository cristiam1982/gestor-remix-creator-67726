import html2canvas from "html2canvas";
// @ts-ignore - gif.js doesn't have TypeScript definitions
import GIF from "gif.js";
import { waitForNextFrame } from "./imageUtils";
import FFmpegManager from "./ffmpegManager";

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
    return avgBrightness < 2; // Prácticamente negro
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

    console.log(`✅ Frame capturado exitosamente: ${canvas.width}x${canvas.height}`);
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
  slideDuration: number = 1300 // Duración dinámica por foto en ms
): Promise<Blob> => {
  const startTime = Date.now();
  
  try {
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

    // PRE-CARGAR TODAS LAS IMÁGENES antes de capturar
    onProgress({
      stage: "initializing",
      progress: 5,
      message: "Pre-cargando imágenes...",
    });

    const imagePromises = photos.map(src => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Si falla CORS, intentar sin crossOrigin
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
    console.log('✅ Todas las imágenes pre-cargadas exitosamente');

    // Renderizar cada foto
    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      await onPhotoChange(photoIndex);
      
      // Triple verificación de renderizado
      await waitForNextFrame();
      await waitForNextFrame();
      await waitForNextFrame();
      
      // Delay aumentado de 150ms a 800ms para asegurar renderizado completo
      await new Promise(resolve => setTimeout(resolve, 800));

      // Capturar el elemento actual
      const frameCanvas = await captureFrame(elementId, false);
      
      // Dibujar frames intermedios para mantener smooth playback
      for (let frameNum = 0; frameNum < framesPerPhoto; frameNum++) {
        ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
        
        // Esperar el tiempo correcto para el siguiente frame
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }

      const captureProgress = 10 + ((photoIndex + 1) / totalSlides) * 80;
      onProgress({
        stage: "capturing",
        progress: captureProgress,
        currentFrame: photoIndex + 1,
        totalFrames: totalSlides,
        message: `Grabando foto ${photoIndex + 1} de ${totalSlides}...`,
      });
    }

    // Capturar slide de resumen si está habilitado
    if (includeSummary) {
      // Cambiar al slide de resumen (índice = photos.length)
      await onPhotoChange(photos.length);
      
      // ESPERAR MÁS TIEMPO para que React renderice completamente el ReelSummarySlide
      await waitForNextFrame(); // Primera espera
      await waitForNextFrame(); // Segunda espera
      await new Promise(resolve => setTimeout(resolve, 300)); // 300ms adicionales
      
      console.log("🎬 Capturando slide de resumen...");
      const summaryCanvas = await captureFrame(elementId, false);
      console.log("✅ Slide de resumen capturado:", summaryCanvas.width, "x", summaryCanvas.height);
      
      for (let frameNum = 0; frameNum < framesPerSummary; frameNum++) {
        ctx.drawImage(summaryCanvas, 0, 0, canvas.width, canvas.height);
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }

      onProgress({
        stage: "capturing",
        progress: 90,
        currentFrame: totalSlides,
        totalFrames: totalSlides,
        message: `Grabando slide de resumen...`,
      });
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
      
      // Triple verificación + delay
      await waitForNextFrame();
      await waitForNextFrame();
      await waitForNextFrame();
      await new Promise(resolve => setTimeout(resolve, 800));

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
      await waitForNextFrame();
      await waitForNextFrame();
      await waitForNextFrame();
      await new Promise(resolve => setTimeout(resolve, 800));

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
