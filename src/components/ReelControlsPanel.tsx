import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GradientSelector } from "./GradientSelector";
import { GradientIntensitySlider } from "./GradientIntensitySlider";
import { SummaryBackgroundSelector } from "./SummaryBackgroundSelector";
import { ReelLogoControls } from "./ReelLogoControls";
import { ReelTextCompositionControls } from "./ReelTextCompositionControls";
import { ReelLayersPanel } from "./ReelLayersPanel";
import { LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";

interface ReelControlsPanelProps {
  // Gradient
  gradientDirection: 'none' | 'top' | 'bottom' | 'both';
  onGradientDirectionChange: (dir: 'none' | 'top' | 'bottom' | 'both') => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  
  // Summary background
  summaryBackground: 'solid' | 'blur' | 'mosaic';
  onSummaryBackgroundChange: (bg: 'solid' | 'blur' | 'mosaic') => void;

  // Logo settings (Fase 6)
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;

  // Text composition (Fase 6)
  textComposition: TextCompositionSettings;
  onTextCompositionChange: (settings: TextCompositionSettings) => void;

  // Visual layers (Fase 6)
  visualLayers: VisualLayers;
  onVisualLayersChange: (layers: VisualLayers) => void;
}

export const ReelControlsPanel = ({
  gradientDirection,
  onGradientDirectionChange,
  gradientIntensity,
  onGradientIntensityChange,
  summaryBackground,
  onSummaryBackgroundChange,
  logoSettings,
  onLogoSettingsChange,
  textComposition,
  onTextCompositionChange,
  visualLayers,
  onVisualLayersChange
}: ReelControlsPanelProps) => {
  return (
    <Accordion type="multiple" defaultValue={["logo"]} className="w-full">
      
      {/* Sección 1: Logo del Aliado (FASE 6 - NUEVA) */}
      <AccordionItem value="logo">
        <AccordionTrigger className="text-base font-semibold">
          🎨 Logo del Aliado
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <ReelLogoControls
            settings={logoSettings}
            onChange={onLogoSettingsChange}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Personaliza la posición, tamaño y estilo de tu logo en el reel.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Sección 2: Composición de Texto (FASE 6 - NUEVA) */}
      <AccordionItem value="text">
        <AccordionTrigger className="text-base font-semibold">
          📝 Composición de Texto
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <ReelTextCompositionControls
            settings={textComposition}
            onChange={onTextCompositionChange}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Ajusta la distribución y estilo de los elementos de texto del reel.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Sección 3: Capas Visuales (FASE 6 - NUEVA) */}
      <AccordionItem value="layers">
        <AccordionTrigger className="text-base font-semibold">
          🎭 Capas Visuales
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <ReelLayersPanel
            layers={visualLayers}
            onChange={onVisualLayersChange}
          />
        </AccordionContent>
      </AccordionItem>
      
      {/* Sección 4: Efectos de Sombreado */}
      <AccordionItem value="gradients">
        <AccordionTrigger className="text-base font-semibold">
          🌗 Efectos de Sombreado en Fotos
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <GradientSelector
            selected={gradientDirection}
            onChange={onGradientDirectionChange}
          />
          
          {gradientDirection !== 'none' && (
            <GradientIntensitySlider
              intensity={gradientIntensity}
              onChange={onGradientIntensityChange}
            />
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            Ajusta la dirección e intensidad del sombreado para mejorar la legibilidad del texto sobre las fotos.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      {/* Sección 5: Fondo del Slide Final */}
      <AccordionItem value="summary">
        <AccordionTrigger className="text-base font-semibold">
          🎬 Fondo del Slide Final
        </AccordionTrigger>
        <AccordionContent className="pt-2">
          <SummaryBackgroundSelector
            selected={summaryBackground}
            onChange={onSummaryBackgroundChange}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            Elige el estilo de fondo para el último slide con tu información de contacto.
          </p>
        </AccordionContent>
      </AccordionItem>
      
    </Accordion>
  );
};
