import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ContentTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  onClick: () => void;
}

export const ContentTypeCard = ({ 
  icon: Icon, 
  title, 
  description, 
  primaryColor,
  secondaryColor,
  onClick 
}: ContentTypeCardProps) => {
  return (
    <Card 
      className="p-6 cursor-pointer hover-lift group transition-all duration-300 border-2"
      style={{
        background: `linear-gradient(90deg, ${primaryColor}15, ${secondaryColor}20)`,
        borderColor: primaryColor,
      }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div 
          className="p-4 rounded-2xl transition-all"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Icon className="w-12 h-12" style={{ color: primaryColor }} />
        </div>
        <div>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: secondaryColor }}
          >
            {title}
          </h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </Card>
  );
};
