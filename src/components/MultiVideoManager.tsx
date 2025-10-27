import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { Upload, X, GripVertical, Video, AlertCircle } from "lucide-react";
import { validateVideoFile } from "@/utils/fileValidation";
import { getVideoDuration, formatDuration } from "@/utils/multiVideoGenerator";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VideoInfo {
  id: string;
  url: string;
  file: File;
  duration: number;
}

interface MultiVideoManagerProps {
  videos: VideoInfo[];
  onVideosChange: (videos: VideoInfo[]) => void;
  maxVideos?: number;
  maxTotalDuration?: number;
}

interface SortableVideoItemProps {
  video: VideoInfo;
  index: number;
  onRemove: (id: string) => void;
}

function SortableVideoItem({ video, index, onRemove }: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-accent rounded-lg border border-border"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Video className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">Video {index + 1}</p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(video.duration)}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(video.id)}
          className="text-destructive hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export const MultiVideoManager = ({
  videos,
  onVideosChange,
  maxVideos = 10,
  maxTotalDuration = 100,
}: MultiVideoManagerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
  const canAddMore = videos.length < maxVideos && totalDuration < maxTotalDuration;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!canAddMore) {
        toast({
          title: "⚠️ Límite alcanzado",
          description: `Máximo ${maxVideos} videos o ${maxTotalDuration}s de duración total.`,
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      try {
        const newVideos: VideoInfo[] = [];

        for (const file of acceptedFiles) {
          if (videos.length + newVideos.length >= maxVideos) {
            toast({
              title: "⚠️ Límite de videos",
              description: `Solo puedes agregar hasta ${maxVideos} videos.`,
              variant: "destructive",
            });
            break;
          }

          // Validar archivo
          const validation = await validateVideoFile(file);
          if (!validation.valid) {
            toast({
              title: "❌ Video inválido",
              description: validation.error,
              variant: "destructive",
            });
            continue;
          }

          // Obtener duración
          const duration = await getVideoDuration(file);

          if (totalDuration + duration > maxTotalDuration) {
            toast({
              title: "⚠️ Duración excedida",
              description: `La duración total no puede superar ${maxTotalDuration}s. Este video añadiría ${Math.round(duration)}s.`,
              variant: "destructive",
            });
            break;
          }

          const url = URL.createObjectURL(file);
          newVideos.push({
            id: `${Date.now()}-${Math.random()}`,
            url,
            file,
            duration,
          });
        }

        if (newVideos.length > 0) {
          onVideosChange([...videos, ...newVideos]);
          toast({
            title: "✅ Videos agregados",
            description: `Se agregaron ${newVideos.length} video(s) correctamente.`,
          });
        }
      } catch (error) {
        console.error("Error al procesar videos:", error);
        toast({
          title: "❌ Error",
          description: "No se pudieron procesar los videos.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [videos, onVideosChange, canAddMore, maxVideos, maxTotalDuration, toast, totalDuration]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
    multiple: true,
    disabled: !canAddMore || isProcessing,
  });

  const handleRemoveVideo = (id: string) => {
    const videoToRemove = videos.find((v) => v.id === id);
    if (videoToRemove) {
      URL.revokeObjectURL(videoToRemove.url);
    }
    onVideosChange(videos.filter((v) => v.id !== id));
    
    toast({
      title: "🗑️ Video eliminado",
      description: "El video se ha removido de la lista.",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      onVideosChange(arrayMove(videos, oldIndex, newIndex));
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-primary mb-2">
            🎬 Subir Videos
          </h3>
          <p className="text-sm text-muted-foreground">
            Sube entre 2 y {maxVideos} videos. Serán concatenados en el orden que elijas.
          </p>
        </div>

        {/* Información de límites */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Videos agregados:</span>
            <span className="font-semibold">
              {videos.length} / {maxVideos}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duración total:</span>
              <span className={`font-semibold ${totalDuration > maxTotalDuration ? 'text-destructive' : ''}`}>
                {formatDuration(totalDuration)} / {maxTotalDuration}s
              </span>
            </div>
            <Progress 
              value={(totalDuration / maxTotalDuration) * 100} 
              className="h-2"
            />
          </div>
        </div>

        {/* Advertencia si excede límites */}
        {totalDuration > maxTotalDuration && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <p className="font-semibold">Duración excedida</p>
              <p>Elimina videos o reduce la duración total a {maxTotalDuration}s o menos.</p>
            </div>
          </div>
        )}

        {/* Dropzone */}
        {canAddMore && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isProcessing ? (
              <p className="text-muted-foreground">Procesando videos...</p>
            ) : isDragActive ? (
              <p className="text-primary font-medium">
                Suelta los videos aquí...
              </p>
            ) : (
              <>
                <p className="text-foreground font-medium mb-2">
                  Arrastra videos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos: MP4, MOV, AVI • Máx 100MB por video
                </p>
              </>
            )}
          </div>
        )}

        {/* Lista de videos (sortable) */}
        {videos.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              📋 Arrastra para reordenar los videos:
            </p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={videos.map((v) => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <SortableVideoItem
                      key={video.id}
                      video={video}
                      index={index}
                      onRemove={handleRemoveVideo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Mensaje si no hay videos */}
        {videos.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aún no has subido videos</p>
          </div>
        )}

        {/* Ayuda */}
        {videos.length > 0 && videos.length < 2 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Necesitas al menos 2 videos para generar un reel multi-video.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
