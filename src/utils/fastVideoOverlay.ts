import { fetchFile } from '@ffmpeg/util';
import FFmpegManager from './ffmpegManager';

/**
 * Procesa un video añadiendo overlays usando FFmpeg
 * Método optimizado: no reproduce el video, procesa a máxima velocidad del CPU
 */
export async function addOverlaysWithFFmpeg(
  videoBlob: Blob,
  overlayPng: Blob,
  onProgress?: (progress: number, stage: string) => void
): Promise<Blob> {
  const ffmpeg = FFmpegManager.getInstance();
  
  if (!ffmpeg.isLoaded()) {
    throw new Error('FFmpeg no está cargado');
  }

  try {
    onProgress?.(10, 'Preparando archivos...');
    
    // Escribir archivos al sistema virtual de FFmpeg
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    await ffmpeg.writeFile('overlay.png', await fetchFile(overlayPng));
    
    onProgress?.(30, 'Procesando video...');
    
    // Configurar listener de progreso de FFmpeg
    let lastProgress = 30;
    const progressListener = ({ progress }: { progress: number }) => {
      const mappedProgress = 30 + (progress * 65); // 30% a 95%
      if (mappedProgress > lastProgress) {
        lastProgress = mappedProgress;
        onProgress?.(mappedProgress, 'Procesando video...');
      }
    };
    
    ffmpeg.onProgress(progressListener);
    
    // Comando FFmpeg optimizado para velocidad
    await ffmpeg.exec([
      '-i', 'input.mp4',           // Video de entrada
      '-i', 'overlay.png',          // PNG de overlays
      '-filter_complex', '[0:v][1:v]overlay=0:0', // Componer overlay sobre video
      '-c:v', 'libx264',            // Codec H.264
      '-preset', 'fast',            // Preset rápido (balance velocidad/calidad)
      '-crf', '23',                 // Calidad visual alta (menor = mejor calidad)
      '-pix_fmt', 'yuv420p',        // Formato de píxeles compatible
      '-movflags', '+faststart',    // Optimizar para reproducción web
      '-an',                        // Sin audio (agregar después si es necesario)
      'output.mp4'
    ]);
    
    // Quitar listener
    ffmpeg.offProgress(progressListener);
    
    onProgress?.(95, 'Finalizando...');
    
    // Leer archivo de salida
    const data = await ffmpeg.readFile('output.mp4');
    const uint8Data = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : new Uint8Array(data);
    
    const resultBlob = new Blob([uint8Data], { type: 'video/mp4' });
    
    // Limpiar archivos temporales
    try {
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('overlay.png');
      await ffmpeg.deleteFile('output.mp4');
    } catch (e) {
      console.warn('No se pudieron eliminar archivos temporales:', e);
    }
    
    onProgress?.(100, 'Completado');
    
    return resultBlob;
    
  } catch (error) {
    console.error('❌ Error al procesar video con FFmpeg:', error);
    
    // Limpiar en caso de error
    try {
      await ffmpeg.deleteFile('input.mp4').catch(() => {});
      await ffmpeg.deleteFile('overlay.png').catch(() => {});
      await ffmpeg.deleteFile('output.mp4').catch(() => {});
    } catch (e) {
      // Ignorar errores de limpieza
    }
    
    throw error;
  }
}
