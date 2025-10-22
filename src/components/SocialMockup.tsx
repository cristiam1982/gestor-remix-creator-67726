import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Instagram, Facebook, X } from "lucide-react";
import { CanvasPreview } from "./CanvasPreview";

interface SocialMockupProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  contentType: ContentType;
  caption: string;
}

export const SocialMockup = ({ propertyData, aliadoConfig, contentType, caption }: SocialMockupProps) => {
  const isStory = contentType === "historia";
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          👁️ Vista Previa en Redes Sociales
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista Previa en Redes Sociales</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Instagram Feed Preview */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="flex items-center gap-2 mb-3">
              <Instagram className="w-5 h-5 text-pink-600" />
              <span className="font-semibold">Instagram Feed</span>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-xl max-w-md mx-auto">
              {/* Instagram Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-3">
                  {aliadoConfig.logo ? (
                    <img 
                      src={aliadoConfig.logo} 
                      alt={aliadoConfig.nombre}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{aliadoConfig.nombre}</p>
                    <p className="text-xs text-muted-foreground">{aliadoConfig.ciudad}</p>
                  </div>
                </div>
                <button className="text-lg font-bold">⋯</button>
              </div>
              
              {/* Preview Image */}
              <div className="relative aspect-square bg-muted">
                <CanvasPreview
                  propertyData={propertyData}
                  aliadoConfig={aliadoConfig}
                  contentType="post"
                />
              </div>
              
              {/* Instagram Actions */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button>❤️</button>
                    <button>💬</button>
                    <button>📤</button>
                  </div>
                  <button>🔖</button>
                </div>
                
                <p className="text-sm font-semibold">1,234 Me gusta</p>
                
                <div className="text-sm">
                  <span className="font-semibold mr-2">{aliadoConfig.nombre}</span>
                  <span className="whitespace-pre-wrap line-clamp-3">{caption}</span>
                </div>
                
                <p className="text-xs text-muted-foreground">Ver los 45 comentarios</p>
                <p className="text-xs text-muted-foreground">Hace 2 horas</p>
              </div>
            </div>
          </div>

          {/* Instagram Story Preview */}
          {isStory && (
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <Instagram className="w-5 h-5 text-pink-600" />
                <span className="font-semibold">Instagram Stories</span>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden shadow-xl max-w-[280px] mx-auto">
                {/* Story Header */}
                <div className="absolute top-0 left-0 right-0 p-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
                  <div className="flex items-center gap-2">
                    {aliadoConfig.logo ? (
                      <img 
                        src={aliadoConfig.logo} 
                        alt={aliadoConfig.nombre}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-primary border-2 border-white" />
                    )}
                    <span className="text-white text-sm font-semibold">{aliadoConfig.nombre}</span>
                    <span className="text-white/70 text-xs">2h</span>
                  </div>
                </div>
                
                {/* Story Content */}
                <div className="relative aspect-[9/16]">
                  <CanvasPreview
                    propertyData={propertyData}
                    aliadoConfig={aliadoConfig}
                    contentType="historia"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Facebook Preview */}
          <div className="border rounded-lg p-4 bg-background">
            <div className="flex items-center gap-2 mb-3">
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Facebook</span>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-xl max-w-md mx-auto">
              {/* Facebook Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3 mb-3">
                  {aliadoConfig.logo ? (
                    <img 
                      src={aliadoConfig.logo} 
                      alt={aliadoConfig.nombre}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-primary" />
                  )}
                  <div>
                    <p className="font-semibold">{aliadoConfig.nombre}</p>
                    <p className="text-xs text-muted-foreground">Hace 2 horas · 🌍</p>
                  </div>
                </div>
                
                <p className="text-sm whitespace-pre-wrap">{caption}</p>
              </div>
              
              {/* Preview Image */}
              <div className="relative aspect-square bg-muted">
                <CanvasPreview
                  propertyData={propertyData}
                  aliadoConfig={aliadoConfig}
                  contentType="post"
                />
              </div>
              
              {/* Facebook Actions */}
              <div className="p-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">❤️ 234</span>
                  <span className="text-muted-foreground">89 comentarios · 45 compartidos</span>
                </div>
                
                <div className="flex items-center justify-around mt-2 pt-2 border-t">
                  <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                    👍 Me gusta
                  </button>
                  <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                    💬 Comentar
                  </button>
                  <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                    📤 Compartir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
