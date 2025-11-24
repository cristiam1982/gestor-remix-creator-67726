import { PropertyData } from "../../types/landing";
import { Card } from "@/components/ui/card";

type DescriptionSectionProps = {
  property: PropertyData;
};

export const DescriptionSection = ({ property }: DescriptionSectionProps) => {
  if (!property.description) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
          Descripción del Inmueble
        </h2>

        <Card className="p-8 lg:p-12 max-w-4xl mx-auto bg-card border-border">
          <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
            {property.description}
          </p>
        </Card>
      </div>
    </section>
  );
};
