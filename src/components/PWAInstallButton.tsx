import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="no-print inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-600 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700 shadow-xs hover:bg-blue-100 transition active:scale-95"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Instalar App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="no-print inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <span>📱</span>
          Instalar no iPhone
        </button>

        {showIOSGuide && (
          <div className="no-print fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-[16px] font-bold text-slate-900">Como instalar no iPhone / iPad</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                1. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.<br />
                2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br />
                3. Toque em <strong>Adicionar</strong> no canto superior direito.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
