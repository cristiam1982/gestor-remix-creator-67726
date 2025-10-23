export interface GifPreset {
  fps: number;
  quality: number;
  scale: number;
  description: string;
  estimatedSize: string;
}

export const GIF_PRESETS: Record<string, GifPreset> = {
  premium: {
    fps: 20,
    quality: 2,
    scale: 1.0,
    description: "Máxima calidad",
    estimatedSize: "80-100MB para 60s"
  },
  standard: {
    fps: 15,
    quality: 2,
    scale: 1.0,
    description: "Calidad estándar",
    estimatedSize: "50-70MB para 60s"
  },
  compact: {
    fps: 12,
    quality: 5,
    scale: 0.85,
    description: "Compacto",
    estimatedSize: "30-40MB para 60s"
  }
};

export const estimateGifSize = (duration: number, fps: number): string => {
  // Estimación basada en pruebas: ~1.2-1.5MB por segundo a 15fps
  const mbPerSecond = fps === 20 ? 1.5 : fps === 15 ? 1.2 : 0.8;
  const estimatedMB = Math.round(duration * mbPerSecond);
  
  if (estimatedMB < 50) {
    return `~${estimatedMB}MB`;
  } else if (estimatedMB < 100) {
    return `${estimatedMB}-${estimatedMB + 20}MB`;
  } else {
    return `${estimatedMB}+ MB`;
  }
};

export interface ExtractedFrame {
  canvas: HTMLCanvasElement;
  timestamp: number;
}

export const extractFramesFromVideo = async (
  videoElement: HTMLVideoElement,
  fps: number,
  onProgress: (current: number, total: number) => void
): Promise<HTMLCanvasElement[]> => {
  return new Promise((resolve, reject) => {
    const frames: HTMLCanvasElement[] = [];
    const duration = videoElement.duration;
    const frameInterval = 1 / fps; // Intervalo entre frames en segundos
    const totalFrames = Math.floor(duration * fps);
    
    let currentFrame = 0;
    let currentTime = 0;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("No se pudo crear contexto de canvas"));
      return;
    }

    const captureFrame = () => {
      // Capturar frame actual
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Crear un nuevo canvas para este frame
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = canvas.width;
      frameCanvas.height = canvas.height;
      const frameCtx = frameCanvas.getContext("2d");
      
      if (frameCtx) {
        frameCtx.drawImage(canvas, 0, 0);
        frames.push(frameCanvas);
      }

      currentFrame++;
      onProgress(currentFrame, totalFrames);

      // Siguiente frame
      currentTime += frameInterval;
      
      if (currentTime < duration) {
        videoElement.currentTime = currentTime;
      } else {
        // Terminado
        resolve(frames);
      }
    };

    videoElement.onseeked = captureFrame;
    videoElement.onerror = () => reject(new Error("Error al extraer frames del video"));

    // Comenzar desde el primer frame
    videoElement.currentTime = 0;
  });
};

export const getOptimalPreset = (duration: number): string => {
  if (duration <= 30) return "premium";
  if (duration <= 45) return "standard";
  return "compact";
};
