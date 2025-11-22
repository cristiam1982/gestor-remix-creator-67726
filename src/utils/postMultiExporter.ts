import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { ExportOptions } from "@/utils/imageExporter";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
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
          console.warn('[postMultiExporter] No se pudo convertir imagen remota a dataURL:', src, error);
          // No lanzar error, continuar con otras imágenes
        });
      conversions.push(conversion);
    }
  });
  
  // Esperar a que todas las conversiones terminen
  await Promise.all(conversions);
};

/**
 * Captura el slide actual del preview y lo descarga usando html2canvas directamente
 * con limpieza de gradientes para evitar errores internos.
 */
const captureCurrentSlide = async (filename: string): Promise<void> => {
  console.log('[captureCurrentSlide] Capturando', filename);
  
  // DELAY EXTENDIDO: Dar tiempo al navegador para renderizar completamente el contenedor offscreen con la foto actual
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Capturar desde el contenedor fijo offscreen en lugar del preview responsive
  const previewElement = document.getElementById('canvas-export');
  if (!previewElement) {
    throw new Error('No se encontró el contenedor #canvas-export para capturar');
  }
  
  // VALIDACIÓN CRÍTICA: Verificar que el elemento tiene tamaño antes de capturar
  const rect = previewElement.getBoundingClientRect();
  console.log('[captureCurrentSlide] Element rect', rect.width, 'x', rect.height);
  
  if (rect.width === 0 || rect.height === 0) {
    throw new Error('El área de exportación tiene tamaño 0. Revisa el contenedor #canvas-export.');
  }

  const canvas = await html2canvas(previewElement, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    onclone: async (clonedDoc) => {
      const clonedPreview = clonedDoc.getElementById('canvas-export') as HTMLElement | null;
      if (clonedPreview) {
        // PASO 1: Sanitizar imágenes remotas a dataURL
        await sanitizeCloneImagesForHtml2Canvas(clonedPreview);
        
        // PASO 2: Quitar gradientes complejos que rompen html2canvas
        const gradientElements = clonedPreview.querySelectorAll<HTMLElement>('[style*="linear-gradient"], [class*="bg-gradient"]');
        gradientElements.forEach((el) => {
          el.style.backgroundImage = 'none';
        });
        
        // PASO 3: Ensure font is loaded in clone
        clonedPreview.style.fontFamily = 'Poppins, sans-serif';
      }
    }
  });
  
  console.log('[captureCurrentSlide] Canvas generado:', canvas.width, 'x', canvas.height);

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log('[captureCurrentSlide] Blob generado correctamente, tamaño:', (blob.size / 1024).toFixed(2), 'KB');
          console.log('[captureCurrentSlide] Descargando archivo:', filename);
          saveAs(blob, filename);
          resolve();
        } else {
          console.error('[captureCurrentSlide] ERROR: canvas.toBlob devolvió null');
          reject(new Error('No se pudo generar la imagen (blob nulo). Canvas posiblemente tainted.'));
        }
      },
      'image/png',
      0.95
    );
  });
};

/**
 * Exporta todas las fotos del post cuadrado como PNGs individuales numerados
 */
export const exportAllPhotos = async (
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  exportOptions: ExportOptions,
  contentType: ContentType,
  setPhotoIndexOverride: (index: number | undefined) => void,
  onProgress: (current: number, total: number) => void
): Promise<void> => {
  const totalFotos = propertyData.fotos?.length || 0;
  
  if (totalFotos <= 1) {
    throw new Error("Se requieren al menos 2 fotos para exportación múltiple");
  }

  const errors: string[] = [];

  console.log('[exportAllPhotos] Iniciando exportación de', totalFotos, 'fotos');
  
  for (let i = 0; i < totalFotos; i++) {
    try {
      // Actualizar el override para mostrar la foto[i]
      setPhotoIndexOverride(i);
      
      // Esperar que el DOM se actualice con la nueva foto
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 400); // Delay para captura estable
        });
      });

      const filename = `foto-${String(i + 1).padStart(2, '0')}.png`;
      console.log(`[exportAllPhotos] Exportando ${i + 1}/${totalFotos}:`, filename);
      await captureCurrentSlide(filename);

      // Reportar progreso
      onProgress(i + 1, totalFotos);
      
    } catch (error) {
      console.error(`[exportAllPhotos] Error exportando foto ${i + 1}:`, error);
      errors.push(`Foto ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Reset del override al finalizar
  setPhotoIndexOverride(undefined);

  if (errors.length > 0) {
    throw new Error(`Algunas fotos no se pudieron exportar:\n${errors.join('\n')}`);
  }
};
