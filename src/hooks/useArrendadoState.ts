import { useState } from "react";
import { ArrendadoData } from "@/types/arrendado";

export const useArrendadoState = () => {
  const [arrendadoData, setArrendadoData] = useState<Partial<ArrendadoData>>({
    fotos: [],
    precio: "",
    videoUrl: ""
  });

  const [arrendadoFormat, setArrendadoFormat] = useState<"historia" | "reel-fotos" | "reel-video">("historia");

  const resetArrendadoState = () => {
    setArrendadoData({ fotos: [], precio: "", videoUrl: "" });
    setArrendadoFormat("historia");
  };

  return {
    arrendadoData,
    setArrendadoData,
    arrendadoFormat,
    setArrendadoFormat,
    resetArrendadoState
  };
};
