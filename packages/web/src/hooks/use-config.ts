import { useState, useCallback } from "react";
import type { AppConfig } from "@devgentic/shared";
import { getConfig, setConfig } from "@/stores/config-store";

export function useConfig() {
  const [config, _setConfig] = useState<AppConfig>(getConfig);

  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    const updated = setConfig(updates);
    _setConfig(updated);
    return updated;
  }, []);

  return { config, updateConfig };
}
