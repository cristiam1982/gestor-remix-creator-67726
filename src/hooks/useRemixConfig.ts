import { useState, useEffect } from "react";
import { AliadoConfig } from "@/types/property";

const REMIX_LOCKED_KEY = "remix_locked";

export const useRemixConfig = () => {
  const [remixConfig, setRemixConfig] = useState<AliadoConfig | null>(null);
  const [isRemixLocked, setIsRemixLocked] = useState(false);

  useEffect(() => {
    // Check if config is locked
    const locked = localStorage.getItem(REMIX_LOCKED_KEY) === "true";
    setIsRemixLocked(locked);

    // Try to load config from URL params
    const params = new URLSearchParams(window.location.search);
    const remixData = params.get("remix");

    if (remixData) {
      try {
        const decoded = JSON.parse(atob(remixData));
        setRemixConfig(decoded);
        
        // Save to localStorage if not locked (using consistent key)
        if (!locked) {
          localStorage.setItem("aliado-config", JSON.stringify(decoded));
        }
      } catch (error) {
        console.error("Error al decodificar remix:", error);
      }
    }
  }, []);

  const generateRemixLink = (config: AliadoConfig): string => {
    const encoded = btoa(JSON.stringify(config));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?remix=${encoded}`;
  };

  const lockRemix = () => {
    localStorage.setItem(REMIX_LOCKED_KEY, "true");
    setIsRemixLocked(true);
  };

  const unlockRemix = () => {
    localStorage.removeItem(REMIX_LOCKED_KEY);
    setIsRemixLocked(false);
  };

  return {
    remixConfig,
    isRemixLocked,
    generateRemixLink,
    lockRemix,
    unlockRemix,
  };
};
