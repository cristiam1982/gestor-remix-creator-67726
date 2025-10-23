export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): FileValidationResult => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "La imagen no puede superar 5MB. Intenta comprimir o usar una imagen más pequeña.",
    };
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Formato no válido. Usa JPG, PNG o WEBP.",
    };
  }

  return { valid: true };
};

export const validateVideoFile = async (file: File): Promise<FileValidationResult> => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const maxDuration = 60; // 60 seconds

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "El video no puede superar 100MB. Comprime el video o usa uno más corto.",
    };
  }

  const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Formato no válido. Usa MP4, MOV o AVI.",
    };
  }

  // Validate duration
  try {
    const duration = await getVideoDuration(file);
    if (duration > maxDuration) {
      return {
        valid: false,
        error: `El video debe durar máximo ${maxDuration} segundos. Tu video dura ${Math.round(duration)}s.`,
      };
    }
  } catch (error) {
    console.error("Error al validar duración:", error);
    // Continue anyway if duration check fails
  }

  return { valid: true };
};

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Error al cargar metadata del video"));
    };

    video.src = URL.createObjectURL(file);
  });
};
