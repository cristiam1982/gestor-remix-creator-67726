/**
 * Generador de multi-video simplificado usando MediaRecorder
 * Usado como fallback cuando FFmpeg no está disponible
 */

import { PropertyData, AliadoConfig } from "@/types/property";
import { preloadImage } from "./imageUtils";

export async function generateSimpleMultiVideoReel(
  videoFiles: File[],
  subtitles: string[],
  propertyData: PropertyData,
  aliadoConfig: AliadoConfig,
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
      preloadImage('/src/assets/el-gestor-logo.png')
    ]);
  } catch (error) {
    console.warn('No se pudieron cargar los logos:', error);
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
  
  // Función helper para dibujar overlays
  const drawOverlays = (currentSubtitle: string) => {
    // Header con logos
    if (aliadoLogo || elGestorLogo) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, 1080, 120);
      
      if (aliadoLogo) {
        const logoHeight = 80;
        const logoWidth = (aliadoLogo.width / aliadoLogo.height) * logoHeight;
        ctx.drawImage(aliadoLogo, 30, 20, logoWidth, logoHeight);
      }
      
      if (elGestorLogo) {
        const logoHeight = 80;
        const logoWidth = (elGestorLogo.width / elGestorLogo.height) * logoHeight;
        ctx.drawImage(elGestorLogo, 1080 - logoWidth - 30, 20, logoWidth, logoHeight);
      }
    }
    
    // Subtítulo (si existe)
    if (currentSubtitle) {
      ctx.font = 'bold 48px Poppins, sans-serif';
      const textMetrics = ctx.measureText(currentSubtitle);
      const padding = 40;
      const bgWidth = textMetrics.width + padding * 2;
      const bgHeight = 80;
      const x = (1080 - bgWidth) / 2;
      const y = 1920 * 0.70;
      
      // Fondo semi-transparente
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(x, y, bgWidth, bgHeight, 20);
      ctx.fill();
      
      // Texto
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentSubtitle, 1080 / 2, y + bgHeight / 2);
    }
    
    // Footer con información de propiedad
    const footerY = 1920 - 280;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, footerY, 1080, 280);
    
    // Canon/Precio
    ctx.font = 'bold 56px Poppins, sans-serif';
    ctx.fillStyle = aliadoConfig.colorPrimario;
    ctx.textAlign = 'left';
    ctx.fillText(
      propertyData.canon || propertyData.valorVenta || '$0',
      40,
      footerY + 60
    );
    
    // Ubicación
    ctx.font = '32px Poppins, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(
      `📍 ${propertyData.ubicacion || 'Ubicación'}`,
      40,
      footerY + 120
    );
    
    // Tipo de inmueble
    ctx.font = '28px Poppins, sans-serif';
    ctx.fillStyle = '#CCCCCC';
    const tipoTexto = propertyData.tipo?.charAt(0).toUpperCase() + propertyData.tipo?.slice(1);
    ctx.fillText(tipoTexto || '', 40, footerY + 170);
    
    // Atributos
    ctx.font = '32px Poppins, sans-serif';
    ctx.fillStyle = aliadoConfig.colorSecundario;
    let atributos = '';
    if (propertyData.habitaciones) atributos += `🛏️ ${propertyData.habitaciones}  `;
    if (propertyData.banos) atributos += `🚿 ${propertyData.banos}  `;
    if (propertyData.parqueaderos) atributos += `🚗 ${propertyData.parqueaderos}  `;
    if (propertyData.area) atributos += `📐 ${propertyData.area}m²`;
    ctx.fillText(atributos, 40, footerY + 220);
  };

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
              
              // Dibujar overlays (logos, subtítulo, footer)
              drawOverlays(currentSubtitle);
              
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
