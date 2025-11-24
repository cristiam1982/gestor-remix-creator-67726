import { PropertyData } from "../../types/landing";

type GallerySectionProps = {
  property: PropertyData;
};

export const GallerySection = ({ property }: GallerySectionProps) => {
  if (!property.photos || property.photos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
          Galería de Fotos
        </h2>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {property.photos.slice(0, 8).map((photo, index) => (
            <div
              key={index}
              className={`relative rounded-2xl overflow-hidden ${
                index === 0 ? "lg:col-span-2 lg:row-span-2 h-[500px]" : "h-[240px]"
              }`}
            >
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {property.photos.map((photo, index) => (
              <div
                key={index}
                className="flex-none w-[85vw] h-[60vh] rounded-2xl overflow-hidden snap-start"
              >
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
