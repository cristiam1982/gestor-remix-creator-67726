import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { addOpacityToHex } from "./colorUtils";
import { urlToDataURL } from "./imageUtils";

/**
 * Sanitiza todas las imágenes remotas en un clon del DOM convirtiéndolas a dataURL
 * para evitar que html2canvas genere canvas tainted (blob nulo)
 */
const sanitizeCloneImagesForHtml2Canvas = async (clonedRoot: HTMLElement): Promise<void> => {
  const images = clonedRoot.querySelectorAll('img');
  const conversions: Promise<void>[] = [];
  
  images.forEach((img) => {
    const src = img.src;
    // Si es URL remota (http/https) y no es del mismo origen
    if (src.startsWith('http') && !src.startsWith(window.location.origin)) {
      const conversion = urlToDataURL(src)
        .then((dataURL) => {
          img.src = dataURL;
        })
        .catch((error) => {
          console.warn('[imageExporter] No se pudo convertir imagen remota a dataURL:', src, error);
          // No lanzar error, continuar con otras imágenes
        });
      conversions.push(conversion);
    }
  });
  
  // Esperar a que todas las conversiones terminen
  await Promise.all(conversions);
};

export interface ExportOptions {
  format: "png" | "jpg";
  quality: number; // 0.1 to 1.0
  addWatermark?: boolean;
  watermarkText?: string;
  watermarkColor?: string;
}

export const exportToImage = async (
  elementId: string,
  filename: string = "publicacion-el-gestor.png",
  options: ExportOptions = { format: "png", quality: 0.95 }
): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error("Elemento no encontrado");
  }

  try {
    // Wait for fonts to load
    await document.fonts.ready;
    
    // Small delay to ensure all styles are applied
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // VALIDACIÓN CRÍTICA: Verificar que el elemento tiene tamaño antes de capturar
    const rect = element.getBoundingClientRect();
    console.log('[exportToImage] Element rect', rect.width, 'x', rect.height);
    
    if (rect.width === 0 || rect.height === 0) {
      throw new Error('El área de exportación tiene tamaño 0. Revisa el contenedor #canvas-export.');
    }
    
    console.log('[exportToImage] Iniciando captura de', elementId);
    
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      onclone: async (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // PASO 1: Sanitizar imágenes remotas a dataURL
          await sanitizeCloneImagesForHtml2Canvas(clonedElement);
          
          // PASO 2: Remove backdrop-blur (not supported by html2canvas)
          const blurElements = clonedElement.querySelectorAll('[class*="backdrop-blur"]');
          blurElements.forEach((el) => {
            (el as HTMLElement).style.backdropFilter = 'none';
            // Increase background opacity to compensate
            const currentBg = window.getComputedStyle(el as HTMLElement).backgroundColor;
            if (currentBg.includes('rgba')) {
              (el as HTMLElement).style.backgroundColor = currentBg.replace(/[\d.]+\)$/g, '0.95)');
            }
          });

          // PASO 3: Quitar gradientes complejos que rompen html2canvas
          const gradientElements = clonedElement.querySelectorAll<HTMLElement>('[style*="linear-gradient"], [class*="bg-gradient"]');
          gradientElements.forEach((el) => {
            (el as HTMLElement).style.backgroundImage = 'none';
          });
          
          // PASO 4: Ensure font is loaded in clone
          (clonedElement as HTMLElement).style.fontFamily = 'Poppins, sans-serif';
        }
      }
    });
    
    console.log('[exportToImage] Canvas generado:', canvas.width, 'x', canvas.height);

    // Add watermark if requested
    if (options.addWatermark && options.watermarkText) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "16px Poppins, sans-serif";
        ctx.fillStyle = options.watermarkColor || "rgba(0, 0, 0, 0.3)";
        ctx.textAlign = "right";
        ctx.fillText(options.watermarkText, canvas.width - 20, canvas.height - 20);
      }
    }

    // Compress and convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            console.log('[exportToImage] Blob generado correctamente, tamaño:', (result.size / 1024).toFixed(2), 'KB');
            resolve(result);
          } else {
            console.error('[exportToImage] ERROR: canvas.toBlob devolvió null');
            reject(new Error("No se pudo generar la imagen para descargar (blob nulo). Canvas posiblemente tainted."));
          }
        },
        options.format === "jpg" ? "image/jpeg" : "image/png",
        options.quality
      );
    });

    console.log('[exportToImage] Descargando archivo:', filename);
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error al exportar imagen:", error);
    throw error;
  }
};

export const exportVideo = async (
  videoUrl: string,
  filename: string = "reel-el-gestor.mp4"
): Promise<void> => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error al exportar video:", error);
    throw error;
  }
};

export const getOptimalDimensions = (contentType: "post" | "historia" | "reel-fotos" | "reel-video") => {
  switch (contentType) {
    case "post":
      return { width: 1080, height: 1080 };
    case "historia":
    case "reel-fotos":
    case "reel-video":
      return { width: 1080, height: 1920 };
    default:
      return { width: 1080, height: 1080 };
  }
};
