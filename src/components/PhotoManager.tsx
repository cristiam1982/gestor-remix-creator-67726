import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentType } from "@/types/property";
import { validateImageFile, validateVideoFile } from "@/utils/fileValidation";
import { useToast } from "@/hooks/use-toast";

const SUBTITLE_ICONS = {
  espacios: ["🛋️", "🍳", "🛏️", "🚿", "🌳", "🚗", "🏊", "🏋️"],
  caracteristicas: ["✨", "🌟", "💎", "🔑", "📍", "💰", "🏡", "🎯"],
  otros: ["👉", "⭐", "🔥", "💫", "🎨", "🌈", "🏆", "💝"]
};

interface PhotoManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  contentType: ContentType;
  context?: "disponible" | "arrendado";
  subtitulos?: string[];
  onSubtitulosChange?: (subtitulos: string[]) => void;
}

export const PhotoManager = ({ 
  photos, 
  onPhotosChange, 
  contentType, 
  context = "disponible",
  subtitulos = [],
  onSubtitulosChange
}: PhotoManagerProps) => {
  const { toast } = useToast();
  const isVideoContent = contentType === "reel-video";
  const maxFiles = isVideoContent ? 1 : 
    contentType === "reel-fotos" ? 10 : 
    contentType === "carrusel" ? 10 : 3;
  
  const getHelpText = () => {
    const isArrendado = context === "arrendado";
    
    switch (contentType) {
      case "post":
      case "historia":
        return isArrendado 
          ? "Sube 1-3 fotos del inmueble arrendado (máx. 5MB cada una)"
          : "Sube 1-3 fotos del inmueble (máx. 5MB cada una)";
      case "carrusel":
        return "Sube 3-10 fotos para el carrusel (se generará 1 slide por foto + 1 final con CTA)";
      case "reel-fotos":
        return isArrendado
          ? "Sube 2-10 fotos del inmueble arrendado para el slideshow"
          : "Sube 3-10 fotos para el slideshow (máx. 5MB cada una)";
      case "reel-video":
        return isArrendado
          ? "Sube un video del inmueble arrendado (máx. 60 seg, 100MB)"
          : "Sube un video (máx. 60 seg, 100MB)";
      default:
        return "Sube tus archivos aquí";
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newPhotos: string[] = [];
    
    for (const file of acceptedFiles) {
      // Validate file
      const validation = isVideoContent 
        ? await validateVideoFile(file)
        : validateImageFile(file);

      if (!validation.valid) {
        toast({
          title: "❌ Archivo no válido",
          description: validation.error,
          variant: "destructive",
        });
        continue;
      }

      // Process valid file
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === acceptedFiles.filter(async f => 
          isVideoContent ? (await validateVideoFile(f)).valid : validateImageFile(f).valid
        ).length) {
          onPhotosChange([...photos, ...newPhotos].slice(0, maxFiles));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [photos, onPhotosChange, maxFiles, isVideoContent, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: isVideoContent 
      ? { 'video/*': ['.mp4', '.mov', '.avi'] }
      : { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: !isVideoContent,
    maxFiles: maxFiles - photos.length,
  });

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    
    // También actualizar subtítulos
    if (onSubtitulosChange && subtitulos.length > 0) {
      const newSubtitulos = subtitulos.filter((_, i) => i !== index);
      onSubtitulosChange(newSubtitulos);
    }
  };

  const handleSubtituloChange = (index: number, value: string) => {
    if (onSubtitulosChange) {
      const newSubtitulos = [...subtitulos];
      newSubtitulos[index] = value;
      onSubtitulosChange(newSubtitulos);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4 text-primary">
        {isVideoContent ? "Subir Video" : "Subir Fotos"}
      </h3>
      
      <div className="space-y-4">
        <Label className="text-muted-foreground">{getHelpText()}</Label>
        
        {/* Dropzone */}
        {photos.length < maxFiles && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-accent/50 ${
              isDragActive ? "border-primary bg-accent" : "border-border"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {isDragActive ? (
                <>
                  <Upload className="w-12 h-12 text-primary animate-bounce" />
                  <p className="text-lg font-semibold text-primary">
                    ¡Suelta {isVideoContent ? "el video" : "las fotos"} aquí!
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold mb-1">
                      Arrastra {isVideoContent ? "tu video" : "tus fotos"} aquí
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar archivos
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {photos.length}/{maxFiles} archivos subidos
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Preview grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            {contentType === "reel-fotos" && onSubtitulosChange && (
              <div className="bg-accent/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 text-primary">
                  ✨ Subtítulos opcionales (para reel)
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Agrega texto corto para cada foto. Ejemplos: "Cocina integral", "Habitación principal", "Baño auxiliar"
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={photo}
                      alt={`${isVideoContent ? "Video" : "Foto"} ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-semibold">
                      {idx + 1}
                    </div>
                  </div>
                  
                  {contentType === "reel-fotos" && onSubtitulosChange && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Ej: Sala principal"
                        value={subtitulos[idx] || ""}
                        onChange={(e) => handleSubtituloChange(idx, e.target.value)}
                        maxLength={30}
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      
                      {/* Galería de iconos */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-muted-foreground">Iconos:</span>
                        {Object.values(SUBTITLE_ICONS).flat().map((icon, iconIdx) => (
                          <button
                            key={iconIdx}
                            type="button"
                            onClick={() => {
                              const currentText = subtitulos[idx] || "";
                              // Si el texto ya empieza con emoji, reemplazarlo
                              const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}]+\s*/u;
                              const newText = currentText.match(emojiRegex) 
                                ? `${icon} ${currentText.replace(emojiRegex, '').trim()}`
                                : `${icon} ${currentText}`.trim();
                              handleSubtituloChange(idx, newText);
                            }}
                            className="text-base hover:scale-125 transition-transform p-1 rounded hover:bg-accent"
                            title="Agregar icono"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
