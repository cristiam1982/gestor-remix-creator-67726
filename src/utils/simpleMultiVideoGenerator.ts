/**
 * Generador de multi-video simplificado usando MediaRecorder
 * Usado como fallback cuando FFmpeg no está disponible
 */

import { PropertyData, AliadoConfig } from "@/types/property";
import { preloadImage } from "./imageUtils";
import elGestorLogoSrc from "@/assets/el-gestor-logo.png";

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
  
  // Helper para dividir subtítulos en líneas de máximo 30 caracteres
  const splitSubtitle = (text: string, maxChars: number = 30): string[] => {
    if (text.length <= maxChars) return [text];
    
    // Buscar el último espacio antes del límite
    let splitIndex = text.lastIndexOf(' ', maxChars);
    
    // Si no hay espacio, cortar en el límite
    if (splitIndex === -1) splitIndex = maxChars;
    
    const line1 = text.substring(0, splitIndex).trim();
    const line2 = text.substring(splitIndex).trim();
    
    return [line1, line2];
  };
  
  // Función helper para dibujar overlays
  const drawOverlays = (currentSubtitle: string) => {
    // Logo del aliado (superior izquierda, sin fondo)
    if (aliadoLogo) {
      const logoHeight = 182;
      const logoWidth = Math.min(
        (aliadoLogo.width / aliadoLogo.height) * logoHeight,
        800
      );
      ctx.drawImage(aliadoLogo, 30, 30, logoWidth, logoHeight);
    }
    
    // Subtítulo (si existe) - CON SOPORTE MULTI-LÍNEA
    if (currentSubtitle) {
      const lines = splitSubtitle(currentSubtitle, 30);
      
      ctx.font = 'bold 56px Poppins, sans-serif';
      
      // Calcular ancho máximo de todas las líneas
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      
      const padding = 40;
      const bgWidth = maxWidth + padding * 2;
      const lineHeight = 70;
      const bgHeight = lines.length * lineHeight + padding;
      const x = (1080 - bgWidth) / 2;
      const y = 1920 * 0.68;  // Subir un poco más arriba
      
      // Fondo semi-transparente (ajustado al número de líneas)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(x, y, bgWidth, bgHeight, 20);
      ctx.fill();
      
      // Sombra del texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Renderizar cada línea centrada
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      lines.forEach((line, index) => {
        const lineY = y + padding / 2 + (index + 0.5) * lineHeight;
        ctx.fillText(line, 1080 / 2, lineY);
      });
      
      // Resetear sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    
  // Footer con información de propiedad
  const footerY = 1920 - 310;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(0, footerY, 1080, 310);
    
  // Formatear precio con separador de miles
  const formatPrice = (price: string) => {
    const cleanPrice = price.replace(/[^\d]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  
  // Modalidad (En Arriendo / En Venta) - ARRIBA del precio
  ctx.font = '36px Poppins, sans-serif';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'left';
  const modalidadTexto = propertyData.modalidad === 'venta' ? 'En Venta' : 'En Arriendo';
  ctx.fillText(modalidadTexto, 40, footerY + 55);
  
  // Canon/Precio - ABAJO de la modalidad
  ctx.font = 'bold 61px Poppins, sans-serif';
  ctx.fillStyle = aliadoConfig.colorPrimario;
  const precioTexto = formatPrice(propertyData.canon || propertyData.valorVenta || '$0');
  ctx.fillText(precioTexto, 40, footerY + 110);
    
  // Ubicación
  ctx.font = '42px Poppins, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText(
    propertyData.ubicacion || 'Ubicación',
    40,
    footerY + 155
  );
    
  // Tipo de inmueble
  ctx.font = '36px Poppins, sans-serif';
  ctx.fillStyle = '#666666';
  const tipoTexto = propertyData.tipo?.charAt(0).toUpperCase() + propertyData.tipo?.slice(1);
  ctx.fillText(tipoTexto || '', 40, footerY + 205);
    
  // Atributos con iconos Unicode
  ctx.font = '40px Poppins, sans-serif';
  ctx.fillStyle = aliadoConfig.colorSecundario || '#333333';

  let atributos = '';
  if (propertyData.habitaciones) atributos += `🛏 ${propertyData.habitaciones} Hab  `;
  if (propertyData.banos) atributos += `🚿 ${propertyData.banos} Baños  `;
  if (propertyData.parqueaderos) atributos += `🚗 ${propertyData.parqueaderos} Parq  `;
  if (propertyData.area) atributos += `📐 ${propertyData.area}m²`;

  ctx.fillText(atributos, 40, footerY + 260);
  
  // Logo de El Gestor (esquina inferior derecha, sobre el footer - MÁS ARRIBA)
  if (elGestorLogo) {
    const logoHeight = 90;
    const logoWidth = Math.min(
      (elGestorLogo.width / elGestorLogo.height) * logoHeight,
      350
    );
    
    const x = 1080 - logoWidth - 30;
    const y = 1920 - logoHeight - 90;  // Subido 60px más arriba
    
    ctx.drawImage(elGestorLogo, x, y, logoWidth, logoHeight);
  }
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
