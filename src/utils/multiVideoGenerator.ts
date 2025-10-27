import FFmpegManager from './ffmpegManager';
import { generateSimpleMultiVideoReel } from './simpleMultiVideoGenerator';
import { PropertyData, AliadoConfig } from '@/types/property';

export interface GenerateMultiVideoOptions {
  videoBlobs: Blob[];
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onProgress?: (progress: number, stage: string) => void;
}

// Helper para añadir timeout a promesas
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export async function generateMultiVideoReel(
  options: GenerateMultiVideoOptions
): Promise<Blob> {
  const { videoBlobs, onProgress } = options;

  if (videoBlobs.length < 2) {
    throw new Error('Se requieren al menos 2 videos para concatenar');
  }

  const ffmpeg = FFmpegManager.getInstance();

  try {
    // 1. Intentar cargar FFmpeg con timeout de 15 segundos
    if (!ffmpeg.isLoaded()) {
      onProgress?.(0, 'Cargando procesador de video avanzado...');
      await withTimeout(
        ffmpeg.load((progress) => {
          onProgress?.(progress * 0.2, `Cargando FFmpeg: ${progress}%`);
        }),
        15000,
        'Timeout al cargar FFmpeg'
      );
    }

    onProgress?.(20, 'Procesando videos con FFmpeg...');

    // 2. Concatenar videos con FFmpeg (timeout: 30s base + 15s por video)
    const concatTimeout = 30000 + (videoBlobs.length * 15000);
    const concatenatedBlob = await withTimeout(
      ffmpeg.concatenateVideos(
        videoBlobs,
        {
          width: 1080,
          height: 1920,
          fps: 24
        },
        (progress, stage) => {
          const mappedProgress = 20 + (progress * 0.75);
          onProgress?.(mappedProgress, stage);
        }
      ),
      concatTimeout,
      'Timeout al procesar videos con FFmpeg'
    );

    onProgress?.(100, '¡Completado!');
    return concatenatedBlob;

  } catch (ffmpegError) {
    console.warn('⚠️ FFmpeg no disponible, usando método alternativo...', ffmpegError);
    
    // FALLBACK: Usar método simple sin FFmpeg
    onProgress?.(0, 'Usando procesador alternativo...');
    
    try {
      // Convertir Blobs a Files
      const files = await Promise.all(
        videoBlobs.map(async (blob, index) => {
          return new File([blob], `video-${index}.mp4`, { type: 'video/mp4' });
        })
      );
      
      const resultBlob = await generateSimpleMultiVideoReel(files, (progress, stage) => {
        onProgress?.(progress, `[Modo alternativo] ${stage}`);
      });
      
      console.log('✅ Video generado con método alternativo');
      return resultBlob;
      
    } catch (fallbackError) {
      console.error('❌ Error en método alternativo:', fallbackError);
      throw new Error(
        `No se pudo generar el video. Error FFmpeg: ${(ffmpegError as Error).message}. ` +
        `Error alternativo: ${(fallbackError as Error).message}`
      );
    }
  }
}

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Error al cargar metadata del video'));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
