import { useState, useEffect } from "react";
import { Square, Smartphone, Image as ImageIcon, Video, Download } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { AliadoConfigForm } from "@/components/AliadoConfigForm";
import { PropertyForm } from "@/components/PropertyForm";
import { PhotoManager } from "@/components/PhotoManager";
import { CanvasPreview } from "@/components/CanvasPreview";
import { AliadoConfig, PropertyData, ContentType } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateCaption } from "@/utils/captionGenerator";
import { exportToImage } from "@/utils/imageExporter";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [aliadoConfig, setAliadoConfig] = useState<AliadoConfig | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ fotos: [] });
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCaption, setGeneratedCaption] = useState("");

  useEffect(() => {
    const savedConfig = localStorage.getItem("aliado-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAliadoConfig(config);
      setShowConfig(false);
    }
  }, []);

  const handleConfigSave = (config: AliadoConfig) => {
    setAliadoConfig(config);
    setShowConfig(false);
    toast({
      title: "✨ Identidad guardada",
      description: "Tu configuración se aplicará automáticamente a todas tus publicaciones.",
    });
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
    setCurrentStep(2);
  };

  const handleBackToHub = () => {
    setSelectedContentType(null);
    setPropertyData({ fotos: [] });
    setCurrentStep(1);
    setGeneratedCaption("");
  };

  const handleGeneratePreview = () => {
    if (aliadoConfig && propertyData.tipo) {
      const caption = generateCaption(propertyData as PropertyData, aliadoConfig);
      setGeneratedCaption(caption);
      setCurrentStep(3);
      toast({
        title: "✨ Tu publicación está lista",
        description: "Revisa el caption y descarga tu imagen.",
      });
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast({
      title: "📋 Caption copiado",
      description: "El texto está listo para pegar en tus redes sociales.",
    });
  };

  const handleDownloadImage = async () => {
    try {
      await exportToImage("canvas-preview", `publicacion-${propertyData.tipo}-${Date.now()}.png`);
      toast({
        title: "✅ Imagen descargada",
        description: "Tu publicación se guardó correctamente.",
      });
    } catch (error) {
      toast({
        title: "❌ Error al descargar",
        description: "Intenta nuevamente o contacta soporte.",
        variant: "destructive",
      });
    }
  };

  if (showConfig || !aliadoConfig) {
    return (
      <AliadoConfigForm 
        onSave={handleConfigSave} 
        initialConfig={aliadoConfig || undefined}
      />
    );
  }

  if (!selectedContentType) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <AliadoConfigForm 
          onSave={handleConfigSave} 
          initialConfig={aliadoConfig}
        />
        
        <div className="max-w-6xl w-full animate-fade-in">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              🎨 Creador Inmobiliario de El Gestor
            </h1>
            <p className="text-xl text-white/90">
              Crea tu publicación profesional en minutos
            </p>
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl inline-block">
              <p className="text-white font-medium">
                🏢 {aliadoConfig.nombre} | 📍 {aliadoConfig.ciudad}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ContentTypeCard
              icon={Square}
              title="Post Cuadrado"
              description="1:1 para feed de Instagram y Facebook"
              gradient="gradient-primary"
              onClick={() => handleContentTypeSelect("post")}
            />
            <ContentTypeCard
              icon={Smartphone}
              title="Historia"
              description="9:16 para Stories de Instagram"
              gradient="gradient-secondary"
              onClick={() => handleContentTypeSelect("historia")}
            />
            <ContentTypeCard
              icon={ImageIcon}
              title="Reel con Fotos"
              description="Slideshow automático con música"
              gradient="gradient-accent"
              onClick={() => handleContentTypeSelect("reel-fotos")}
            />
            <ContentTypeCard
              icon={Video}
              title="Reel con Video"
              description="Hasta 20 segundos de video"
              gradient="gradient-primary"
              onClick={() => handleContentTypeSelect("reel-video")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHub}>
            ← Volver al inicio
          </Button>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <PropertyForm 
              data={propertyData} 
              onDataChange={setPropertyData}
            />

            <PhotoManager
              photos={propertyData.fotos || []}
              onPhotosChange={(photos) => setPropertyData({ ...propertyData, fotos: photos })}
              contentType={selectedContentType!}
            />

            <Button
              onClick={handleGeneratePreview}
              className="w-full"
              variant="hero"
              size="lg"
              disabled={!propertyData.tipo || propertyData.fotos?.length === 0}
            >
              Generar Vista Previa
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">Vista Previa</h3>
              <div className="flex justify-center mb-6">
                {aliadoConfig && (
                  <CanvasPreview
                    propertyData={propertyData as PropertyData}
                    aliadoConfig={aliadoConfig}
                    contentType={selectedContentType!}
                  />
                )}
              </div>
              <Button 
                onClick={handleDownloadImage} 
                variant="hero" 
                size="lg"
                className="w-full"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Imagen
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">Caption Generado</h3>
              <Textarea
                value={generatedCaption}
                onChange={(e) => setGeneratedCaption(e.target.value)}
                className="min-h-[150px] mb-4 font-mono text-sm"
                placeholder="Tu caption aparecerá aquí..."
              />
              <div className="flex gap-3">
                <Button onClick={handleCopyCaption} variant="secondary" className="flex-1">
                  📋 Copiar Caption
                </Button>
                <Button 
                  onClick={handleBackToHub}
                  variant="outline"
                  className="flex-1"
                >
                  🎉 Crear Otra
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
