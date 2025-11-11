import { useState, useEffect, useRef } from "react";
import { PropertyData, AliadoConfig, ReelTemplate, LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";
import { ReelFrame } from "@/components/ReelFrame";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

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
  summarySolidColor: string;
  customHashtag: string;
  customPhone: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export const ScreenCaptureExporter = ({
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
  customHashtag,
  customPhone,
  onComplete,
  onCancel,
  onError,
}: ScreenCaptureExporterProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isShowingSummary, setIsShowingSummary] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'waiting-for-screen' | 'recording' | 'processing'>('preparing');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = showSummarySlide ? photos.length + 1 : photos.length;
  const currentSlide = isShowingSummary ? totalSlides : currentPhotoIndex + 1;

  useEffect(() => {
    startCaptureFlow();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (isFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  const startCaptureFlow = async () => {
    try {
      // Paso 1: Entrar a pantalla completa
      setStatus('preparing');
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
      
      // Esperar un momento para que el usuario vea la instrucción
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Paso 2: Solicitar captura de pantalla
      setStatus('waiting-for-screen');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 1920,
          height: 1920,
          frameRate: 30,
        },
        audio: false,
      });

      // Verificar si el usuario canceló
      if (!stream) {
        throw new Error('No se seleccionó ninguna pantalla');
      }

      // Detectar si el usuario detiene la captura
      stream.getVideoTracks()[0].onended = () => {
        handleStopRecording(true);
      };

      // Paso 3: Configurar MediaRecorder
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No hay códecs compatibles para grabar video');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 12_000_000, // 12 Mbps
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        setStatus('processing');
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        
        // Salir de pantalla completa
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        
        onComplete(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Paso 4: Iniciar grabación
      mediaRecorder.start(100); // Capturar cada 100ms
      setStatus('recording');
      
      // Paso 5: Reproducir el slideshow automáticamente
      playSlideshow();

    } catch (error) {
      console.error('Error en captura de pantalla:', error);
      
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
          onError('Permiso de captura denegado. Asegúrate de seleccionar "Esta pestaña" en el diálogo.');
        } else {
          onError(error.message);
        }
      } else {
        onError('Error desconocido al capturar pantalla');
      }
    }
  };

  const playSlideshow = async () => {
    const photoCount = photos.length;
    
    // Reproducir todas las fotos
    for (let i = 0; i < photoCount; i++) {
      setCurrentPhotoIndex(i);
      setProgress(((i + 1) / totalSlides) * 100);
      await new Promise(resolve => setTimeout(resolve, slideDuration));
    }
    
    // Mostrar slide de resumen si está habilitado
    if (showSummarySlide) {
      setIsShowingSummary(true);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5s fijos para resumen
    }
    
    // Finalizar grabación
    handleStopRecording(false);
  };

  const handleStopRecording = (cancelled: boolean) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (cancelled) {
      onCancel();
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return '⚙️ Preparando captura...';
      case 'waiting-for-screen':
        return '🖥️ Selecciona "Esta pestaña" en el diálogo';
      case 'recording':
        return `🎬 Grabando: Slide ${currentSlide} de ${totalSlides}`;
      case 'processing':
        return '⚡ Procesando video...';
      default:
        return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Contenedor del ReelFrame - Exactamente 1080x1920 */}
      <div className="relative" style={{ width: '1080px', height: '1920px' }}>
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
          showSummarySlide={isShowingSummary}
          photos={photos}
          summaryBackground={summaryBackground}
          summarySolidColor={summarySolidColor}
          customHashtag={customHashtag}
          customPhone={customPhone}
        />
      </div>

      {/* Barra de estado en la parte superior */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-lg px-8 py-4 rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full mx-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white text-lg font-semibold">
              {getStatusMessage()}
            </p>
            {status === 'recording' && (
              <button
                onClick={() => handleStopRecording(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Cancelar"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          
          {status === 'recording' && (
            <>
              <Progress value={progress} className="h-2" />
              <p className="text-white/70 text-sm text-center">
                {Math.round(progress)}% completado
              </p>
            </>
          )}
          
          {status === 'waiting-for-screen' && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mt-2">
              <p className="text-yellow-100 text-sm text-center">
                💡 <strong>Importante:</strong> Selecciona "Esta pestaña" para capturar solo el contenido sin UI del navegador
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
