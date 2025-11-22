import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { ExportOptions, exportToImage } from "@/utils/imageExporter";

/**
 * Exporta el slide actual del preview como imagen usando el mismo pipeline
 * de exportToImage (incluye ajustes especiales para html2canvas).
 */

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
      await exportToImage("canvas-preview", filename, exportOptions);

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
