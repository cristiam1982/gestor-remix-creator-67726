import { useEffect, useRef, useState } from "react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { MultiVideoVisualSettings } from "@/types/multiVideo";
import { Skeleton } from "@/components/ui/skeleton";
import { drawOverlays } from "@/utils/multiVideoOverlays";
import elGestorLogoSrc from '@/assets/el-gestor-logo.png';

interface MultiVideoStaticPreviewProps {
  videoFile: File;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  visualSettings: MultiVideoVisualSettings;
  subtitle?: string;
}

export const MultiVideoStaticPreview = ({
  videoFile,
  propertyData,
  aliadoConfig,
  visualSettings,
  subtitle = ""
}: MultiVideoStaticPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const aliadoLogoRef = useRef<HTMLImageElement | null>(null);
  const elGestorLogoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadAndDrawFrame = async () => {
      if (!canvasRef.current) return;
      
      setIsLoading(true);
      
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Cargar video
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        videoRef.current = video;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.currentTime = 0.1; // Primer frame significativo
          };
          video.onseeked = () => resolve();
          video.onerror = reject;
        });

        if (!mounted) return;

        // Dibujar video frame
        ctx.drawImage(video, 0, 0, 1080, 1920);

        // Cargar logos
        const [aliadoLogo, elGestorLogo] = await Promise.all([
          loadImage(aliadoConfig.logo),
          loadImage(elGestorLogoSrc)
        ]);

        if (!mounted) return;

        aliadoLogoRef.current = aliadoLogo;
        elGestorLogoRef.current = elGestorLogo;

        // Aplicar overlays usando función unificada
        await drawOverlays({
          ctx,
          videoWidth: canvas.width,
          videoHeight: canvas.height,
          propertyData,
          aliadoConfig,
          visualSettings,
          subtitle,
          allyLogo: aliadoLogo,
          elGestorLogo
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading preview:', error);
        setIsLoading(false);
      }
    };

    loadAndDrawFrame();

    return () => {
      mounted = false;
      if (videoRef.current) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, [videoFile, propertyData, aliadoConfig]);

  // Re-dibujar overlays cuando cambian los settings (sin recargar video)
  useEffect(() => {
    console.log('🎨 [MultiVideoStaticPreview] useEffect disparado:', {
      hasCanvas: !!canvasRef.current,
      isLoading,
      hasVideo: !!videoRef.current,
      hasLogos: !!(aliadoLogoRef.current && elGestorLogoRef.current),
      visualSettings
    });

    if (!canvasRef.current || isLoading || !videoRef.current || !aliadoLogoRef.current || !elGestorLogoRef.current) {
      console.log('⚠️ [MultiVideoStaticPreview] Early return - falta algún recurso');
      return;
    }

    console.log('✅ [MultiVideoStaticPreview] Re-dibujando canvas con nuevos settings');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Re-dibujar frame del video
    ctx.drawImage(videoRef.current, 0, 0, 1080, 1920);

    // Re-aplicar overlays con nuevos settings usando función unificada
    drawOverlays({
      ctx,
      videoWidth: canvas.width,
      videoHeight: canvas.height,
      propertyData,
      aliadoConfig,
      visualSettings,
      subtitle,
      allyLogo: aliadoLogoRef.current,
      elGestorLogo: elGestorLogoRef.current
    });
  }, [
    visualSettings,  // ✅ Objeto completo - React detecta cualquier cambio interno
    subtitle,
    propertyData,
    aliadoConfig,
    isLoading
  ]);

  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      {isLoading && (
        <Skeleton className="w-full aspect-[9/16] rounded-xl" />
      )}
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className={`w-full h-auto rounded-xl shadow-2xl border border-border ${isLoading ? 'hidden' : ''}`}
      />
      <p className="text-[11px] text-muted-foreground text-center mt-2.5">
        Vista previa con personalizaciones
      </p>
    </div>
  );
};

// Función auxiliar para cargar imágenes
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
