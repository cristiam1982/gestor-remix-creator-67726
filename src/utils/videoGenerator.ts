import html2canvas from "html2canvas";
// @ts-ignore - gif.js doesn't have TypeScript definitions
import GIF from "gif.js";
import { waitForNextFrame } from "./imageUtils";
import elGestorLogo from "@/assets/el-gestor-logo.png";

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

    const commonOptions = {
      scale: 2.5,
      backgroundColor: "#000000",
      logging: false,
      width: 432,
      height: 768,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 30000,
      removeContainer: false,
      windowWidth: 432,
      windowHeight: 768,
      onclone: (clonedDoc: Document) => {
        // Ocultar el logo de El Gestor para dibujarlo después manualmente
        clonedDoc.querySelectorAll('[data-eg-logo]').forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
        
        // Forzar que las imágenes se capturen con colores reales
        const imgs = clonedDoc.querySelectorAll('img');
        imgs.forEach(img => {
          (img as HTMLImageElement).style.opacity = '1';
        });
      }
    };

    let canvas: HTMLCanvasElement;
    
    // Intentar primero con modo estándar (más confiable)
    try {
      canvas = await html2canvas(element, {
        ...commonOptions,
        foreignObjectRendering: false,
      });
      
      // Verificar que el canvas no esté vacío/negro
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
        const isBlack = imageData.data[0] === 0 && imageData.data[1] === 0 && imageData.data[2] === 0;
        
        if (isBlack) {
          console.warn("Canvas negro detectado, reintentando con foreignObjectRendering");
          canvas = await html2canvas(element, {
            ...commonOptions,
            foreignObjectRendering: true,
          });
        }
      }
    } catch (firstError) {
      // Si falla (por CORS), intentar con foreignObjectRendering
      console.warn("Captura estándar falló, intentando con foreignObjectRendering");
      canvas = await html2canvas(element, {
        ...commonOptions,
        foreignObjectRendering: true,
      });
    }

    return canvas;
  } catch (error) {
    // Si es un error de CORS y no hemos intentado ocultar el logo, reintentar
    if (
      error instanceof Error &&
      (error.message.includes("tainted") || error.message.includes("cross-origin")) &&
      !hideLogoOnError
    ) {
      console.warn("Error de CORS detectado, reintentando sin logo del aliado...");
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

    onProgress({
      stage: "encoding",
      progress: 60,
      totalFrames: photos.length,
      message: "Dibujando logo de El Gestor...",
    });

    // Cargar el logo de El Gestor
    const egLogo = await loadImage(elGestorLogo);

    // Dibujar el logo de El Gestor sobre cada frame capturado
    frames.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Configurar renderizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Calcular tamaño proporcional del logo (altura ~90px en 1920px de alto)
        const targetHeight = Math.round(canvas.height * (90 / 1920));
        const aspect = egLogo.width / egLogo.height;
        const targetWidth = Math.round(targetHeight * aspect);

        // Posición: esquina inferior derecha con margen (40px en escala 2.5x = 100px en 1080x1920)
        const x = canvas.width - targetWidth - Math.round(canvas.width * (40 / 1080));
        const y = canvas.height - targetHeight - Math.round(canvas.height * (40 / 1920));

        // Dibujar el logo sobre el frame
        ctx.drawImage(egLogo, x, y, targetWidth, targetHeight);
      }
    });

    onProgress({
      stage: "encoding",
      progress: 70,
      totalFrames: photos.length,
      message: "Generando reel animado...",
    });

    // Agregar frames al GIF (2.5 segundos por foto)
    frames.forEach((canvas) => {
      gif.addFrame(canvas, { delay: 2500 });
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
