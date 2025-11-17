import { useEffect, useRef, useState } from 'react';
import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers } from '@/types/property';
import { 
  drawSlide, 
  drawSummarySlide, 
  preloadImages, 
  REEL_WIDTH, 
  REEL_HEIGHT 
} from '@/renderer/canvasReelRenderer';

interface CanvasReelPreviewProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  currentPhotoIndex: number;
  isSummary: boolean;
  logoSettings: LogoSettings;
  textComposition: TextCompositionSettings;
  visualLayers: VisualLayers;
  summaryBackgroundStyle: 'solid' | 'blur' | 'mosaic';
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

export const CanvasReelPreview = ({
  propertyData,
  aliadoConfig,
  currentPhotoIndex,
  isSummary,
  logoSettings,
  textComposition,
  visualLayers,
  summaryBackgroundStyle,
  onCanvasRef
}: CanvasReelPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoElapsedTime, setLogoElapsedTime] = useState(0);
  const animationFrameRef = useRef<number>();

  // Pre-cargar imágenes al montar
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Esperar a que las fuentes estén listas
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
        
        await preloadImages(
          propertyData.fotos,
          aliadoConfig.logo, // Siempre logo regular
          true
        );
        setIsLoading(false);
      } catch (err) {
        console.error('Error pre-cargando imágenes:', err);
        setError('Error cargando imágenes');
        setIsLoading(false);
      }
    };

    loadAllImages();
  }, [propertyData.fotos, aliadoConfig.logo, logoSettings.background]);

  // Animar logo solo en primer slide
  useEffect(() => {
    if (currentPhotoIndex === 0 && !isSummary && !isLoading) {
      // Animar entrada del logo en primer slide (0 a 0.5 segundos)
      const entranceDuration = 500; // 0.5 segundos en ms
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / entranceDuration, 1);
        setLogoElapsedTime(progress * 0.5); // 0 a 0.5 segundos
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setLogoElapsedTime(10); // Completamente visible después de animación
        }
      };
      
      animate();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // En otros slides o resumen: logo siempre visible
      setLogoElapsedTime(10);
    }
  }, [currentPhotoIndex, isSummary, isLoading]);

  // Redibujar canvas cuando cambian los parámetros
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Habilitar suavizado de imágenes de alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const render = async () => {
      try {
        if (isSummary) {
          await drawSummarySlide(ctx, {
            propertyData,
            aliadoConfig,
            logoSettings,
            textComposition,
            backgroundStyle: summaryBackgroundStyle,
            photos: propertyData.fotos,
            elapsedTime: 10 // Logo siempre visible sin animaciones
          });
        } else {
          const photoUrl = propertyData.fotos[currentPhotoIndex];
          if (photoUrl) {
            await drawSlide(ctx, {
              photoUrl,
              propertyData,
              aliadoConfig,
              logoSettings,
              textComposition,
              visualLayers,
              photoIndex: currentPhotoIndex,
              elapsedTime: logoElapsedTime
            });
          }
        }
      } catch (err) {
        console.error('Error renderizando canvas:', err);
        setError('Error renderizando preview');
      }
    };

    render();
  }, [
    propertyData,
    aliadoConfig,
    currentPhotoIndex,
    isSummary,
    logoSettings,
    textComposition,
    visualLayers,
    summaryBackgroundStyle,
    isLoading,
    logoElapsedTime
  ]);

  // Pasar referencia del canvas al padre
  useEffect(() => {
    if (onCanvasRef) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-950">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Cargando preview...</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        className="max-w-full max-h-full object-contain"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};
