import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentType } from "@/types/property";
import { validateImageFile, validateVideoFile } from "@/utils/fileValidation";
import { useToast } from "@/hooks/use-toast";

interface PhotoManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  contentType: ContentType;
}

export const PhotoManager = ({ photos, onPhotosChange, contentType }: PhotoManagerProps) => {
  const { toast } = useToast();
  const isVideoContent = contentType === "reel-video";
  const maxFiles = isVideoContent ? 1 : contentType === "reel-fotos" ? 10 : 3;
  
  const getHelpText = () => {
    switch (contentType) {
      case "post":
        return "Sube 1-3 fotos del inmueble (máx. 5MB cada una)";
      case "historia":
        return "Sube 1-3 fotos del inmueble (máx. 5MB cada una)";
      case "reel-fotos":
        return "Sube 3-10 fotos para el slideshow (máx. 5MB cada una)";
      case "reel-video":
        return "Sube un video (máx. 20 seg, 50MB)";
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative group">
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
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
