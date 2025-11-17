/**
 * Generador de multi-video simplificado usando MediaRecorder
 * Usado como fallback cuando FFmpeg no está disponible
 */

import { PropertyData, AliadoConfig } from "@/types/property";
import { MultiVideoVisualSettings } from "@/types/multiVideo";
import { drawOverlays } from "./multiVideoOverlays";
import { preloadImage } from "./imageUtils";
import elGestorLogoSrc from "@/assets/el-gestor-logo.png";

export async function generateSimpleMultiVideoReel(
  videoFiles: File[],
  subtitles: string[],
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
  visualSettings: MultiVideoVisualSettings,
  onProgress: (progress: number, stage: string) => void
): Promise<Blob> {
  onProgress(5, 'Preparando canvas de grabación...');
  
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo crear contexto de canvas');
  }

  // Pre-cargar logos
  let aliadoLogo: HTMLImageElement | null = null;
  let elGestorLogo: HTMLImageElement | null = null;
  
  try {
    [aliadoLogo, elGestorLogo] = await Promise.all([
      preloadImage(aliadoConfig.logo),
      preloadImage(elGestorLogoSrc)
    ]);
    console.log('✅ Logos cargados correctamente');
  } catch (error) {
    console.error('❌ Error cargando logos:', error);
  }

  // Verificar soporte de MediaRecorder con fallback de codec
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error('Tu navegador no soporta grabación de video WebM. Por favor usa Chrome, Edge o Firefox.');
    }
  }

  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  recorder.start(4000);
  onProgress(10, 'Iniciando grabación...');
  
  // Procesar cada video secuencialmente
  for (let i = 0; i < videoFiles.length; i++) {
    const baseProgress = 10 + (i / videoFiles.length) * 80;
    const currentSubtitle = subtitles[i] || '';
    onProgress(baseProgress, `Grabando video ${i + 1}/${videoFiles.length}...`);
    
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFiles[i]);
    video.muted = true;
    video.playsInline = true;
    
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = async () => {
        try {
          await video.play();
          
          // Usar requestVideoFrameCallback si está disponible (mejor sincronía)
          const supportsRVFC = 'requestVideoFrameCallback' in video;
          
          // Watchdog para detectar video estancado
          let lastTime = 0;
          let lastAdvanceAt = performance.now();
          
          const drawFrame = () => {
            if (!video.ended && !video.paused) {
              // Detectar si el video no avanza (codec no soportado)
              const now = performance.now();
              if (video.currentTime === lastTime && now - lastAdvanceAt > 8000) {
                URL.revokeObjectURL(video.src);
                reject(new Error('El video no avanza, códec no soportado. Usaremos modo avanzado.'));
                return;
              }
              
              if (video.currentTime !== lastTime) {
                lastTime = video.currentTime;
                lastAdvanceAt = now;
              }
              
              // Calcular progreso dentro del clip actual
              const perClip = Math.min(video.currentTime / (video.duration || 1), 1);
              
              // Progreso global = base del video actual + avance dentro del clip
              const globalProgress = 10 + ((i + perClip) / videoFiles.length) * 80;
              
              // Actualizar progreso en cada frame para feedback continuo
              onProgress(
                Math.round(globalProgress), 
                `Grabando video ${i + 1}/${videoFiles.length}...`
              );
              
              // Calcular escalado para mantener aspecto 9:16
              const scale = Math.max(1080 / video.videoWidth, 1920 / video.videoHeight);
              const scaledWidth = video.videoWidth * scale;
              const scaledHeight = video.videoHeight * scale;
              const x = (1080 - scaledWidth) / 2;
              const y = (1920 - scaledHeight) / 2;
              
              // Limpiar canvas
              ctx.fillStyle = 'black';
              ctx.fillRect(0, 0, 1080, 1920);
              
              // Dibujar video centrado
              ctx.drawImage(video, x, y, scaledWidth, scaledHeight);
              
              // Aplicar overlays usando función unificada
              drawOverlays(
                ctx,
                canvas.width,
                canvas.height,
                propertyData,
                aliadoConfig,
                visualSettings,
                currentSubtitle,
                aliadoLogo,
                elGestorLogo
              );
              
              if (supportsRVFC) {
                (video as any).requestVideoFrameCallback(drawFrame);
              } else {
                requestAnimationFrame(drawFrame);
              }
            } else if (video.ended) {
              URL.revokeObjectURL(video.src);
              resolve();
            }
          };
          
          if (supportsRVFC) {
            (video as any).requestVideoFrameCallback(drawFrame);
          } else {
            drawFrame();
          }
          
        } catch (error) {
          URL.revokeObjectURL(video.src);
          reject(error);
        }
      };
      
      video.onended = () => {
        URL.revokeObjectURL(video.src);
        resolve();
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error(`Error al cargar video ${i + 1}`));
      };
    });
  }
  
  recorder.stop();
  
  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      onProgress(100, '¡Completado!');
      const finalBlob = new Blob(chunks, { type: mimeType });
      
      if (finalBlob.size === 0) {
        reject(new Error('El video generado está vacío'));
      } else {
        console.log(`✅ Video WebM generado: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
        resolve(finalBlob);
      }
    };
    
    recorder.onerror = (event) => {
      reject(new Error(`Error al grabar: ${event}`));
    };
  });
}
