import { useState, useEffect } from "react";
import { ContentSelectionHub } from "@/components/ContentSelectionHub";
import { DisponibleStep } from "@/components/steps/DisponibleStep";
import { ArrendadoStep } from "@/components/steps/ArrendadoStep";
import { MultiVideoStep } from "@/components/steps/MultiVideoStep";
import { AliadoConfig, ContentType } from "@/types/property";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";
import { ALIADO_CONFIG } from "@/config/aliadoConfig";
import { usePropertyState } from "@/hooks/usePropertyState";
import { useArrendadoState } from "@/hooks/useArrendadoState";
import { useMultiVideoState } from "@/hooks/useMultiVideoState";
import { useContentExport } from "@/hooks/useContentExport";
import { clearMetrics } from "@/utils/metricsManager";

const CreatorPage = () => {
  const { toast } = useToast();
  const [aliadoConfig] = useState<AliadoConfig>(ALIADO_CONFIG);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Custom hooks para estados organizados
  const propertyState = usePropertyState();
  const arrendadoState = useArrendadoState();
  const multiVideoState = useMultiVideoState();
  const contentExport = useContentExport();

  const { clearAutoSavedData } = useAutoSave(propertyState.propertyData, currentStep === 2);
  const isArrendadoType = selectedContentType === "arrendado" || selectedContentType === "vendido";

  useEffect(() => {
    // Cargar datos autoguardados si existen
    try {
      const saved = localStorage.getItem("property-form-autosave");
      const autoSaved = saved ? JSON.parse(saved) : null;
      if (autoSaved && autoSaved.tipo) {
        toast({
          title: "📝 Borrador recuperado",
          description: "Se ha restaurado tu última sesión."
        });
        propertyState.setPropertyData(autoSaved);
      }
    } catch (error) {
      console.error("Error loading auto-saved data:", error);
    }
  }, []);

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
    setCurrentStep(2);
  };

  const handleBackToHub = () => {
    setSelectedContentType(null);
    propertyState.resetPropertyState();
    arrendadoState.resetArrendadoState();
    multiVideoState.resetMultiVideoState();
    setCurrentStep(1);
    setGeneratedCaption("");
    setValidationErrors({});
    clearAutoSavedData();
  };

  const handleClearMetrics = () => {
    clearMetrics();
    toast({
      title: "🗑️ Estadísticas limpiadas",
      description: "Se han eliminado todas las métricas guardadas."
    });
  };

  if (!selectedContentType) {
    return (
      <ContentSelectionHub
        aliadoConfig={aliadoConfig}
        onContentTypeSelect={handleContentTypeSelect}
        onClearMetrics={handleClearMetrics}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 md:py-6 px-2 md:px-4">
      <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-4">
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

        {/* Renderizar Step según tipo de contenido */}
        {isArrendadoType ? (
          <ArrendadoStep
            selectedContentType={selectedContentType}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            arrendadoState={arrendadoState}
            generatedCaption={generatedCaption}
            setGeneratedCaption={setGeneratedCaption}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            aliadoConfig={aliadoConfig}
            contentExport={contentExport}
          />
        ) : selectedContentType === "reel-multi-video" ? (
          <MultiVideoStep
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            propertyState={propertyState}
            multiVideoState={multiVideoState}
            generatedCaption={generatedCaption}
            setGeneratedCaption={setGeneratedCaption}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            aliadoConfig={aliadoConfig}
          />
        ) : (
          <DisponibleStep
            selectedContentType={selectedContentType}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            propertyState={propertyState}
            generatedCaption={generatedCaption}
            setGeneratedCaption={setGeneratedCaption}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            aliadoConfig={aliadoConfig}
            contentExport={contentExport}
          />
        )}
      </div>
    </div>
  );
};

export default CreatorPage;
