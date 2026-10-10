import React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 z-[90] flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-[12px] font-medium text-white shadow-xl">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Modo Offline — O app funciona normalmente sem internet.</span>
    </div>
  );
};
