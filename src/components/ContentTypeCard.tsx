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
      className="p-6 cursor-pointer hover-lift group transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm group-hover:bg-white/20 transition-all">
          <Icon className="w-12 h-12 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-white/80 text-sm">{description}</p>
        </div>
      </div>
    </Card>
  );
};
