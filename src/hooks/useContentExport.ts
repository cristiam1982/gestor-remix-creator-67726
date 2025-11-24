import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportToImage, exportVideo } from "@/utils/imageExporter";
import { exportAllPhotos } from "@/utils/postMultiExporter";
import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { ArrendadoData } from "@/types/arrendado";

export const useContentExport = () => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingAllPhotos, setIsExportingAllPhotos] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [currentPhotoIndexOverride, setCurrentPhotoIndexOverride] = useState<number | undefined>(undefined);

  const handleDownloadImage = async (
    selectedContentType: ContentType | null,
    propertyData: Partial<PropertyData>,
    arrendadoData: Partial<ArrendadoData>,
    isArrendadoType: boolean
  ) => {
    setIsDownloading(true);
    toast({
      title: "🎨 Generando imagen...",
      description: "Esto tomará unos segundos"
    });

    try {
      if (selectedContentType === "reel-video" && propertyData.fotos && propertyData.fotos[0]) {
        await exportVideo(propertyData.fotos[0], `reel-${propertyData.tipo}-${Date.now()}.mp4`);
        toast({
          title: "✅ Video descargado",
          description: "Edita el video con tu app favorita agregando los textos."
        });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const tipo = isArrendadoType ? arrendadoData.tipo : propertyData.tipo;
      const filename = `publicacion-${tipo}-${Date.now()}.png`;
      
      await exportToImage("canvas-export", filename, {
        format: "png",
        quality: 0.95
      });

      toast({
        title: "✅ Descarga lista",
        description: "Tu publicación se ha guardado correctamente."
      });
    } catch (error) {
      console.error("Error al descargar:", error);
      toast({
        title: "❌ Error al descargar",
        description: "Intenta nuevamente o contacta soporte.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportAllPhotos = async (
    propertyData: Partial<PropertyData>,
    aliadoConfig: AliadoConfig,
    selectedContentType: ContentType
  ) => {
    if (!propertyData.fotos || propertyData.fotos.length <= 1) {
      toast({
        title: "⚠️ No hay múltiples fotos",
        description: "Necesitas al menos 2 fotos para usar esta función.",
        variant: "destructive"
      });
      return;
    }

    setIsExportingAllPhotos(true);
    setExportProgress({ current: 0, total: propertyData.fotos.length });

    toast({
      title: "📸 Exportando todas las fotos...",
      description: `Se exportarán ${propertyData.fotos.length} imágenes`
    });

    try {
      await exportAllPhotos(
        propertyData as PropertyData,
        aliadoConfig,
        { format: "png", quality: 0.95 },
        selectedContentType,
        setCurrentPhotoIndexOverride,
        (current, total) => setExportProgress({ current, total })
      );

      toast({
        title: "✅ Exportación completada",
        description: `Se descargaron ${propertyData.fotos.length} fotos exitosamente`
      });
    } catch (error) {
      console.error("Error exportando fotos:", error);
      toast({
        title: "❌ Error en exportación",
        description: "Algunas fotos no se pudieron exportar. Revisa la consola.",
        variant: "destructive"
      });
    } finally {
      setIsExportingAllPhotos(false);
      setCurrentPhotoIndexOverride(undefined);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  return {
    isDownloading,
    isExportingAllPhotos,
    exportProgress,
    currentPhotoIndexOverride,
    handleDownloadImage,
    handleExportAllPhotos
  };
};
