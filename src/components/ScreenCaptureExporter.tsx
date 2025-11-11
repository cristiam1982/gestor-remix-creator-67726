import React, { useEffect, useRef, useState } from 'react';
import { ReelFrame } from './ReelFrame';
import { Progress } from './ui/progress';
import type { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers, ReelTemplate } from '@/types/property';

interface ScreenCaptureExporterProps {
  photos: string[];
  slideDuration: number;
  showSummarySlide: boolean;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  visualLayers: VisualLayers;
  textComposition: TextCompositionSettings;
  logoSettings: LogoSettings;
  gradientDirection: 'top' | 'bottom' | 'both' | 'none';
  gradientIntensity: number;
  currentTemplate: ReelTemplate;
  summaryBackground: 'solid' | 'blur' | 'mosaic';
  summarySolidColor?: string;
  customPhone?: string;
  customHashtag?: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export const ScreenCaptureExporter: React.FC<ScreenCaptureExporterProps> = ({
  photos,
  slideDuration,
  showSummarySlide,
  propertyData,
  aliadoConfig,
  visualLayers,
  textComposition,
  logoSettings,
  gradientDirection,
  gradientIntensity,
  currentTemplate,
  summaryBackground,
  summarySolidColor,
  customPhone,
  customHashtag,
  onComplete,
  onCancel,
  onError,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'waiting' | 'recording' | 'processing'>('preparing');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startCapture = async () => {
      try {
        // Verificar soporte
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          onError('La captura de pantalla no está soportada en este navegador. Usa Chrome o Edge en escritorio.');
          return;
        }

        setStatus('waiting');

        // Esperar a que se renderice el frame inicial
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        if ('fonts' in document) {
          await (document as any).fonts.ready;
        }

        // Solicitar captura INMEDIATAMENTE
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1080,
            height: 1920,
            frameRate: 30,
            // @ts-expect-error - Chrome non-standard preferCurrentTab
            preferCurrentTab: true,
          },
          audio: false,
        });

        streamRef.current = stream;

        // Verificar que se seleccionó "Esta pestaña"
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings() as any;
        const surface = settings.displaySurface;

        if (surface && surface !== 'browser') {
          stream.getTracks().forEach(t => t.stop());
          onError('Debes seleccionar "Esta pestaña" en el diálogo para capturar SOLO el preview.');
          onCancel();
          return;
        }

        // Aplicar Region Capture (CropTarget) si está disponible
        if ((window as any).CropTarget && containerRef.current) {
          try {
            const cropTarget = await (window as any).CropTarget.fromElement(containerRef.current);
            await (track as any).cropTo(cropTarget);
            console.log('✅ Region Capture aplicado: capturando solo el contenedor 1080x1920');
          } catch (cropError) {
            console.warn('⚠️ Region Capture no disponible o falló. Continuando sin recorte específico.', cropError);
          }
        } else {
          console.warn('⚠️ CropTarget no soportado en este navegador. Usa Chrome en escritorio para 1:1 perfecto.');
        }

        // Detectar si el usuario cierra la captura manualmente
        track.onended = () => {
          handleStop(true);
        };

        // Configurar MediaRecorder con codecs
        let mimeType = 'video/webm';
        const codecs = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];

        for (const codec of codecs) {
          if (MediaRecorder.isTypeSupported(codec)) {
            mimeType = codec;
            break;
          }
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 12000000,
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onComplete(blob);
          cleanup();
        };

        mediaRecorder.onerror = (event: any) => {
          onError(`Error en la grabación: ${event.error?.message || 'Error desconocido'}`);
          cleanup();
        };

        // Iniciar grabación
        setStatus('recording');
        mediaRecorder.start(100);

        // Reproducir slideshow
        await playSlideshow();

        // Detener grabación
        handleStop(false);

      } catch (error: any) {
        console.error('Error en captura:', error);
        
        if (error.name === 'NotAllowedError') {
          onError('Necesitas dar permiso de captura. Selecciona "Esta pestaña" cuando aparezca el diálogo.');
        } else if (error.name === 'NotFoundError') {
          onError('No se encontró ninguna fuente de captura disponible.');
        } else if (error.name === 'AbortError') {
          onCancel();
        } else {
          onError(`Error: ${error.message || 'No se pudo iniciar la captura'}`);
        }
        
        cleanup();
      }
    };

    startCapture();

    // Listener para cancelar con Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStop(true);
      }
    };
    window.addEventListener('keydown', handleEscape);

    // Cleanup al desmontar
    return () => {
      window.removeEventListener('keydown', handleEscape);
      cleanup();
    };
  }, []); // ✅ Array vacío - ejecuta solo una vez

  const playSlideshow = async () => {
    const totalSlides = photos.length + (showSummarySlide ? 1 : 0);

    // Reproducir fotos
    for (let i = 0; i < photos.length; i++) {
      setCurrentPhotoIndex(i);
      setProgress(((i + 1) / totalSlides) * 100);
      await sleep(slideDuration);
    }

    // Mostrar slide de resumen si está activado
    if (showSummarySlide) {
      setShowSummary(true);
      setProgress(100);
      await sleep(2500);
    }
  };

  const handleStop = (cancelled: boolean) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStatus('processing');
      mediaRecorderRef.current.stop();
    }
    
    if (cancelled) {
      onCancel();
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return 'Preparando captura...';
      case 'waiting':
        return 'Selecciona "Esta pestaña" en el diálogo del navegador';
      case 'recording':
        return `Grabando slide ${currentPhotoIndex + 1} de ${photos.length + (showSummarySlide ? 1 : 0)}`;
      case 'processing':
        return 'Procesando video...';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Contenedor del frame */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: '1080px',
          height: '1920px',
        }}
      >
        <ReelFrame
          mode="preview"
          photoSrc={photos[currentPhotoIndex]}
          photoIndex={currentPhotoIndex}
          propertyData={propertyData}
          aliadoConfig={aliadoConfig}
          visualLayers={visualLayers}
          textComposition={textComposition}
          logoSettings={logoSettings}
          gradientDirection={gradientDirection}
          gradientIntensity={gradientIntensity}
          currentTemplate={currentTemplate}
          showSummarySlide={showSummary}
          photos={photos}
          summaryBackground={summaryBackground}
          summarySolidColor={summarySolidColor}
          customPhone={customPhone}
          customHashtag={customHashtag}
        />
      </div>

      {/* UI de estado - solo visible cuando NO está grabando */}
      {status !== 'recording' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-2xl p-6 min-w-[400px]">
          <div className="text-center space-y-4">
            <p className="text-white text-lg font-medium">
              {getStatusMessage()}
            </p>
            <Progress value={progress} className="w-full" />
            
            {status === 'waiting' && (
              <p className="text-white/70 text-sm mt-4">
                💡 Asegúrate de seleccionar "Esta pestaña" para grabar el preview correctamente
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
