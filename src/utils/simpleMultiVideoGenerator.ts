/**
 * Generador de multi-video simplificado usando MediaRecorder
 * Usado como fallback cuando FFmpeg no está disponible
 */

export async function generateSimpleMultiVideoReel(
  videoFiles: File[],
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

  // Verificar soporte de MediaRecorder
  if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    throw new Error('Tu navegador no soporta grabación de video WebM');
  }

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  recorder.start();
  onProgress(10, 'Iniciando grabación...');
  
  // Procesar cada video secuencialmente
  for (let i = 0; i < videoFiles.length; i++) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFiles[i]);
    video.muted = true;
    video.playsInline = true;
    
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = async () => {
        try {
          await video.play();
          
          const drawFrame = () => {
            if (!video.ended && !video.paused) {
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
              
              requestAnimationFrame(drawFrame);
            } else if (video.ended) {
              URL.revokeObjectURL(video.src);
              resolve();
            }
          };
          
          drawFrame();
          
          const progress = 10 + ((i + 1) / videoFiles.length) * 80;
          onProgress(progress, `Grabando video ${i + 1}/${videoFiles.length}`);
          
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        reject(new Error(`Error al cargar video ${i + 1}`));
      };
    });
  }
  
  recorder.stop();
  
  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      onProgress(100, '¡Completado!');
      const finalBlob = new Blob(chunks, { type: 'video/webm' });
      
      if (finalBlob.size === 0) {
        reject(new Error('El video generado está vacío'));
      } else {
        resolve(finalBlob);
      }
    };
    
    recorder.onerror = (event) => {
      reject(new Error(`Error al grabar: ${event}`));
    };
  });
}
