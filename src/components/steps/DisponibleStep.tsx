import { Dispatch, SetStateAction } from "react";
import { PropertyForm } from "@/components/PropertyForm";
import { PhotoManager } from "@/components/PhotoManager";
import { StoryLayoutSelector } from "@/components/StoryLayoutSelector";
import { StoryLayoutRequirements } from "@/components/StoryLayoutRequirements";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AliadoConfig, PropertyData, ContentType } from "@/types/property";
import { generateCaption, regenerateCaption } from "@/utils/captionGenerator";
import { validatePropertyData } from "@/utils/formValidation";
import { savePublicationMetric } from "@/utils/metricsManager";
import { useToast } from "@/hooks/use-toast";
import { DisponiblePreviewStep } from "./DisponiblePreviewStep";

interface DisponibleStepProps {
  selectedContentType: ContentType;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  propertyState: any;
  generatedCaption: string;
  setGeneratedCaption: Dispatch<SetStateAction<string>>;
  validationErrors: Record<string, string>;
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
  aliadoConfig: AliadoConfig;
  contentExport: any;
}

export const DisponibleStep = ({
  selectedContentType,
  currentStep,
  setCurrentStep,
  propertyState,
  generatedCaption,
  setGeneratedCaption,
  validationErrors,
  setValidationErrors,
  aliadoConfig,
  contentExport
}: DisponibleStepProps) => {
  const { toast } = useToast();
  const {
    propertyData,
    setPropertyData,
    postLogoSettings,
    setPostLogoSettings,
    postTextComposition,
    setPostTextComposition,
    postVisualLayers,
    setPostVisualLayers,
    postGradientDirection,
    setPostGradientDirection,
    postGradientIntensity,
    setPostGradientIntensity,
    postFirstPhotoConfig,
    setPostFirstPhotoConfig
  } = propertyState;

  const handleGeneratePreview = () => {
    // Validación específica para Historia con layout Gallery
    if (selectedContentType === "historia" && 
        propertyData.storyLayout === "gallery" && 
        (!propertyData.fotos || propertyData.fotos.length < 4)) {
      toast({
        title: "⚠️ Faltan fotos para Gallery",
        description: "El layout Gallery requiere mínimo 4 fotos. Sube más fotos o cambia a layout Overlay.",
        variant: "destructive",
      });
      return;
    }

    // Flujo normal para propiedades disponibles
    if (!propertyData.tipo) {
      toast({
        title: "⚠️ Selecciona un tipo de inmueble",
        description: "Completa el formulario antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    const validation = validatePropertyData(propertyData, propertyData.tipo);
    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast({
        title: "❌ Errores en el formulario",
        description: "Por favor corrige los campos marcados en rojo.",
        variant: "destructive"
      });
      return;
    }

    setValidationErrors({});
    if (aliadoConfig && propertyData.tipo) {
      const caption = generateCaption(propertyData as PropertyData, aliadoConfig, "residencial", true);
      setGeneratedCaption(caption);
      setCurrentStep(3);
      savePublicationMetric(propertyData.tipo, selectedContentType!, "residencial");
      toast({
        title: "✨ Tu publicación está lista",
        description: "Revisa el caption y descarga tu imagen."
      });
    }
  };

  const handleRegenerateCaption = () => {
    if (aliadoConfig && propertyData.tipo) {
      const newCaption = regenerateCaption(propertyData as PropertyData, aliadoConfig, "residencial");
      setGeneratedCaption(newCaption);
      toast({
        title: "✨ Caption regenerado",
        description: "Se ha creado una versión alternativa."
      });
    }
  };

  if (currentStep === 3) {
    return (
      <DisponiblePreviewStep
        selectedContentType={selectedContentType}
        propertyData={propertyData}
        aliadoConfig={aliadoConfig}
        generatedCaption={generatedCaption}
        setGeneratedCaption={setGeneratedCaption}
        onRegenerateCaption={handleRegenerateCaption}
        contentExport={contentExport}
        postLogoSettings={postLogoSettings}
        setPostLogoSettings={setPostLogoSettings}
        postTextComposition={postTextComposition}
        setPostTextComposition={setPostTextComposition}
        postVisualLayers={postVisualLayers}
        setPostVisualLayers={setPostVisualLayers}
        postGradientDirection={postGradientDirection}
        setPostGradientDirection={setPostGradientDirection}
        postGradientIntensity={postGradientIntensity}
        setPostGradientIntensity={setPostGradientIntensity}
        postFirstPhotoConfig={postFirstPhotoConfig}
        setPostFirstPhotoConfig={setPostFirstPhotoConfig}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PropertyForm
        data={propertyData}
        onDataChange={setPropertyData}
        errors={validationErrors}
      />

      {/* Selector de Plantilla - Solo para Historia */}
      {selectedContentType === "historia" && (
        <>
          <Card className="p-6">
            <StoryLayoutSelector 
              selectedLayout={propertyData.storyLayout || "overlay"}
              onLayoutChange={(layout) => setPropertyData({ ...propertyData, storyLayout: layout })}
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
            />
            {propertyData.storyLayout === "gallery" && propertyData.fotos && propertyData.fotos.length < 3 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ El layout <strong>Gallery</strong> requiere <strong>mínimo 3 fotos</strong> para el grid. 
                  Actualmente tienes {propertyData.fotos.length} foto{propertyData.fotos.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </Card>
          <StoryLayoutRequirements />
        </>
      )}

      <PhotoManager
        photos={propertyData.fotos || []}
        onPhotosChange={photos => setPropertyData({
          ...propertyData,
          fotos: photos
        })}
        contentType={selectedContentType!}
        subtitulos={propertyData.subtitulos || []}
        onSubtitulosChange={subtitulos => setPropertyData({
          ...propertyData,
          subtitulos
        })}
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleGeneratePreview}
              className="w-full"
              variant="hero"
              size="lg"
              disabled={!propertyData.tipo || propertyData.fotos?.length === 0}
            >
              Generar Vista Previa
            </Button>
          </TooltipTrigger>
          {(!propertyData.tipo || propertyData.fotos?.length === 0) && (
            <TooltipContent>
              <p>Completa el formulario y sube al menos una foto</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
