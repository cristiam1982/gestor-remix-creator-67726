import html2canvas from "html2canvas";
// @ts-ignore - gif.js doesn't have TypeScript definitions
import GIF from "gif.js";

export interface VideoGenerationProgress {
  stage: "initializing" | "capturing" | "encoding" | "complete" | "error";
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  message: string;
}

const captureFrame = async (elementId: string): Promise<HTMLCanvasElement> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Elemento no encontrado");

  const canvas = await html2canvas(element, {
    scale: 1,
    backgroundColor: "#000000",
    logging: false,
    width: 1080,
    height: 1920,
  });

  return canvas;
};

export const generateReelVideo = async (
  photos: string[],
  elementId: string,
  onProgress: (progress: VideoGenerationProgress) => void
): Promise<Blob> => {
  try {
    onProgress({
      stage: "initializing",
      progress: 0,
      message: "Inicializando generador de reel...",
    });

    // Crear instancia de GIF
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: 1080,
      height: 1920,
      workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
    });

    onProgress({
      stage: "capturing",
      progress: 10,
      totalFrames: photos.length,
      currentFrame: 0,
      message: "Capturando frames...",
    });

    // Capturar cada foto como frame
    const frames: HTMLCanvasElement[] = [];
    for (let i = 0; i < photos.length; i++) {
      // Pequeña pausa para que el DOM se actualice
      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameCanvas = await captureFrame(elementId);
      frames.push(frameCanvas);

      onProgress({
        stage: "capturing",
        progress: 10 + (i + 1) * (50 / photos.length),
        currentFrame: i + 1,
        totalFrames: photos.length,
        message: `Capturando frame ${i + 1} de ${photos.length}...`,
      });
    }

    onProgress({
      stage: "encoding",
      progress: 60,
      message: "Generando reel animado...",
    });

    // Agregar frames al GIF (3 segundos = 3000ms por frame)
    frames.forEach((canvas) => {
      gif.addFrame(canvas, { delay: 3000 });
    });

    // Renderizar GIF
    return new Promise((resolve, reject) => {
      gif.on("finished", (blob: Blob) => {
        onProgress({
          stage: "complete",
          progress: 100,
          message: "¡Reel listo!",
        });
        resolve(blob);
      });

      gif.on("progress", (p: number) => {
        onProgress({
          stage: "encoding",
          progress: 60 + p * 35,
          message: `Generando reel animado... ${Math.round(p * 100)}%`,
        });
      });

      gif.render();
    });
  } catch (error) {
    console.error("Error generando reel:", error);
    onProgress({
      stage: "error",
      progress: 0,
      message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
    });
    throw error;
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
