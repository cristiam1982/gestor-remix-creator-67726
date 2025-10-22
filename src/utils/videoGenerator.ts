import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import html2canvas from "html2canvas";

export interface VideoGenerationProgress {
  stage: "initializing" | "capturing" | "encoding" | "complete" | "error";
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  message: string;
}

let ffmpegInstance: FFmpeg | null = null;

const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

const captureFrame = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Elemento no encontrado");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#000000",
    logging: false,
    width: 1080,
    height: 1920,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Error al crear blob"));
      },
      "image/png",
      1.0
    );
  });
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
      message: "Inicializando generador de video...",
    });

    const ffmpeg = await initFFmpeg();

    onProgress({
      stage: "capturing",
      progress: 10,
      totalFrames: photos.length,
      currentFrame: 0,
      message: "Capturando frames...",
    });

    // Capturar cada foto como frame
    const frames: Blob[] = [];
    for (let i = 0; i < photos.length; i++) {
      // Esperar un momento para que el DOM se actualice
      await new Promise((resolve) => setTimeout(resolve, 100));

      const frameBlob = await captureFrame(elementId);
      frames.push(frameBlob);

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
      message: "Codificando video...",
    });

    // Escribir frames en FFmpeg
    for (let i = 0; i < frames.length; i++) {
      const fileName = `frame${i.toString().padStart(3, "0")}.png`;
      await ffmpeg.writeFile(fileName, await fetchFile(frames[i]));
    }

    onProgress({
      stage: "encoding",
      progress: 75,
      message: "Generando video final...",
    });

    // Generar video con FFmpeg
    // Cada frame dura 3 segundos (framerate = 1/3 fps)
    await ffmpeg.exec([
      "-framerate",
      "1/3",
      "-i",
      "frame%03d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-vf",
      "scale=1080:1920",
      "output.mp4",
    ]);

    onProgress({
      stage: "encoding",
      progress: 90,
      message: "Finalizando...",
    });

    const data = await ffmpeg.readFile("output.mp4");
    // @ts-ignore - FFmpeg returns Uint8Array compatible with Blob
    const videoBlob = new Blob([data.buffer], { type: "video/mp4" });

    // Limpiar archivos temporales
    for (let i = 0; i < frames.length; i++) {
      const fileName = `frame${i.toString().padStart(3, "0")}.png`;
      try {
        await ffmpeg.deleteFile(fileName);
      } catch (e) {
        console.warn("Error limpiando archivo:", e);
      }
    }
    try {
      await ffmpeg.deleteFile("output.mp4");
    } catch (e) {
      console.warn("Error limpiando output:", e);
    }

    onProgress({
      stage: "complete",
      progress: 100,
      message: "¡Video listo!",
    });

    return videoBlob;
  } catch (error) {
    console.error("Error generando video:", error);
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
