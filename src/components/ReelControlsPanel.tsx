import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GradientSelector } from "./GradientSelector";
import { GradientIntensitySlider } from "./GradientIntensitySlider";
import { SummaryBackgroundSelector } from "./SummaryBackgroundSelector";

interface ReelControlsPanelProps {
  // Gradient
  gradientDirection: 'none' | 'top' | 'bottom' | 'both';
  onGradientDirectionChange: (dir: 'none' | 'top' | 'bottom' | 'both') => void;
  gradientIntensity: number;
  onGradientIntensityChange: (intensity: number) => void;
  
  // Summary background
  summaryBackground: 'solid' | 'blur' | 'mosaic';
  onSummaryBackgroundChange: (bg: 'solid' | 'blur' | 'mosaic') => void;
}

export const ReelControlsPanel = ({
  gradientDirection,
  onGradientDirectionChange,
  gradientIntensity,
  onGradientIntensityChange,
  summaryBackground,
  onSummaryBackgroundChange
}: ReelControlsPanelProps) => {
  return (
    <Accordion type="multiple" defaultValue={["gradients"]} className="w-full">
      
      {/* Sección 1: Efectos de Sombreado */}
      <AccordionItem value="gradients">
        <AccordionTrigger className="text-base font-semibold">
          🎨 Efectos de Sombreado en Fotos
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <GradientSelector
            selected={gradientDirection}
            onChange={onGradientDirectionChange}
          />
          
          {/* Solo mostrar slider si NO es "none" */}
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
      
      {/* Sección 2: Fondo del Slide Final */}
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
