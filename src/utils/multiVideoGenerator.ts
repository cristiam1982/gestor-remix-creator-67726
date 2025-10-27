import FFmpegManager from './ffmpegManager';
import { PropertyData, AliadoConfig } from '@/types/property';

export interface GenerateMultiVideoOptions {
  videoBlobs: Blob[];
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onProgress?: (progress: number, stage: string) => void;
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
    // 1. Cargar FFmpeg si no está cargado
    if (!ffmpeg.isLoaded()) {
      onProgress?.(0, 'Cargando procesador de video...');
      await ffmpeg.load((progress) => {
        onProgress?.(progress * 0.2, `Cargando FFmpeg: ${progress}%`);
      });
    }

    onProgress?.(20, 'Procesando videos...');

    // 2. Concatenar videos
    const concatenatedBlob = await ffmpeg.concatenateVideos(
      videoBlobs,
      {
        width: 1080,
        height: 1920,
        fps: 30
      },
      (progress, stage) => {
        // Mapear progreso de 20% a 95%
        const mappedProgress = 20 + (progress * 0.75);
        onProgress?.(mappedProgress, stage);
      }
    );

    onProgress?.(100, '¡Completado!');

    return concatenatedBlob;
  } catch (error) {
    console.error('Error al generar multi-video:', error);
    throw error;
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
