import { useState, useEffect } from "react";
import { Square, Smartphone, Image as ImageIcon, Video } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { AliadoConfigForm } from "@/components/AliadoConfigForm";
import { PropertyForm } from "@/components/PropertyForm";
import { AliadoConfig, PropertyData, ContentType } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateCaption } from "@/utils/captionGenerator";
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          if (newPhotos.length === files.length) {
            setPropertyData({ ...propertyData, fotos: [...propertyData.fotos!, ...newPhotos] });
          }
        };
        reader.readAsDataURL(file);
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

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">Subir Fotos</h3>
              <div className="space-y-4">
                <Label htmlFor="fotos">
                  {selectedContentType === "post" && "Sube 1-3 fotos del inmueble"}
                  {selectedContentType === "historia" && "Sube 1-3 fotos del inmueble"}
                  {selectedContentType === "reel-fotos" && "Sube 3-10 fotos para el slideshow"}
                  {selectedContentType === "reel-video" && "Sube un video (máx. 20 segundos)"}
                </Label>
                <input
                  id="fotos"
                  type="file"
                  accept={selectedContentType === "reel-video" ? "video/*" : "image/*"}
                  multiple={selectedContentType !== "reel-video"}
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                />

                {propertyData.fotos && propertyData.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {propertyData.fotos.map((foto, idx) => (
                      <img
                        key={idx}
                        src={foto}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

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
              <h3 className="text-xl font-semibold mb-4 text-primary">Caption Generado</h3>
              <div className="bg-muted p-4 rounded-lg mb-4 whitespace-pre-wrap font-mono text-sm">
                {generatedCaption}
              </div>
              <Button onClick={handleCopyCaption} variant="secondary" className="w-full">
                📋 Copiar Caption
              </Button>
            </Card>

            <Card className="p-6 bg-muted/50">
              <h3 className="text-xl font-semibold mb-4 text-primary">Vista Previa</h3>
              <div className="bg-white rounded-lg shadow-xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    La vista previa visual se implementará en la siguiente fase
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Por ahora, copia el caption y usa las fotos subidas para crear tu publicación manualmente
                  </p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleBackToHub}
              variant="hero"
              size="lg"
              className="w-full"
            >
              🎉 Crear Nueva Publicación
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
