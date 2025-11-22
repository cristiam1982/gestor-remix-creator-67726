import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { ExportOptions } from "@/utils/imageExporter";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

/**
 * Captura el slide actual del preview y lo descarga usando html2canvas directamente
 * con limpieza de gradientes para evitar errores internos.
 */
const captureCurrentSlide = async (filename: string): Promise<void> => {
  const previewElement = document.querySelector('[data-canvas-preview]');
  
  if (!previewElement) {
    throw new Error('No se encontró el elemento del preview');
  }

  const canvas = await html2canvas(previewElement as HTMLElement, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    onclone: (clonedDoc) => {
      const clonedPreview = clonedDoc.querySelector('[data-canvas-preview]') as HTMLElement | null;
      if (clonedPreview) {
        // Quitar gradientes complejos que rompen html2canvas
        const gradientElements = clonedPreview.querySelectorAll<HTMLElement>('[style*="linear-gradient"], [class*="bg-gradient"]');
        gradientElements.forEach((el) => {
          el.style.backgroundImage = 'none';
        });
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, filename);
          resolve();
        } else {
          reject(new Error('No se pudo generar la imagen (blob nulo).'));
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
      await captureCurrentSlide(filename);

      // Reportar progreso
      onProgress(i + 1, totalFotos);
      
    } catch (error) {
      console.error(`Error exportando foto ${i + 1}:`, error);
      errors.push(`Foto ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Reset del override al finalizar
  setPhotoIndexOverride(undefined);

  if (errors.length > 0) {
    throw new Error(`Algunas fotos no se pudieron exportar:\n${errors.join('\n')}`);
  }
};
