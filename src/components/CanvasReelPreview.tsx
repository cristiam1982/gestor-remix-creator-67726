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

  // Pre-cargar imágenes al montar
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await preloadImages(
          propertyData.fotos,
          logoSettings.background === 'none' 
            ? (aliadoConfig.logoTransparent || aliadoConfig.logo)
            : aliadoConfig.logo,
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
  }, [propertyData.fotos, aliadoConfig.logo, aliadoConfig.logoTransparent, logoSettings.background]);

  // Redibujar canvas cuando cambian los parámetros
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = async () => {
      try {
        if (isSummary) {
          await drawSummarySlide(ctx, {
            propertyData,
            aliadoConfig,
            logoSettings,
            textComposition,
            backgroundStyle: summaryBackgroundStyle,
            photos: propertyData.fotos
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
              photoIndex: currentPhotoIndex
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
    isLoading
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
