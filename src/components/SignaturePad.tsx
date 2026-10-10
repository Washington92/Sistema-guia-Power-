import { useEffect, useRef, useState } from "react";

function Prancheta({
  label,
  onSave,
  onClose,
}: {
  label: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [vazio, setVazio] = useState(true);
  const [retrato, setRetrato] = useState(false);

  const setup = () => {
    const c = ref.current;
    if (!c) return;
    const r = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * r;
    c.height = rect.height * r;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
    setVazio(true);
  };

  useEffect(() => {
    const el = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
    el.requestFullscreen?.()
      .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.("landscape"))
      .catch(() => {});
    const check = () => {
      setRetrato(window.innerHeight > window.innerWidth);
      setTimeout(setup, 50);
    };
    check();
    window.addEventListener("resize", check);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", check);
      document.body.style.overflow = "";
      try {
        (screen.orientation as unknown as { unlock?: () => void })?.unlock?.();
      } catch { /* */ }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const concluir = () => {
    const c = ref.current;
    if (!c || vazio) return onClose();
    onSave(c.toDataURL("image/png"));
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-[13px] font-bold uppercase">Assinatura: {label}</span>
        {retrato && <span className="text-[11px] text-neutral-500">Gire o celular para a horizontal</span>}
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-8 bottom-[30%] border-b-2 border-dashed border-neutral-400" />
        <canvas
          ref={ref}
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            const ctx = e.currentTarget.getContext("2d")!;
            const { x, y } = pos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = e.currentTarget.getContext("2d")!;
            const { x, y } = pos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            setVazio(false);
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerCancel={() => (drawing.current = false)}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <button type="button" onClick={setup} className="btn-ui rounded-xl border-2 border-[#dc2626] px-4 py-2 text-[13px] font-bold uppercase text-[#dc2626]">
          Limpar
        </button>
        <button type="button" onClick={onClose} className="btn-ui rounded-xl border-2 border-neutral-500 px-4 py-2 text-[13px] font-bold uppercase text-neutral-700">
          Cancelar
        </button>
        <button type="button" onClick={concluir} className="btn-ui rounded-xl bg-[#16a34a] px-5 py-2 text-[13px] font-bold uppercase text-white shadow-sm">
          Concluir
        </button>
      </div>
    </div>
  );
}

export function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex flex-col">
      <span className="text-center text-[11px] font-bold uppercase tracking-wide">{label}</span>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Assinar: ${label}`}
        className="sig-area relative mt-2 flex h-24 w-full items-center justify-center rounded-sm bg-white"
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <span className="no-print text-[11px] text-neutral-400">Toque para assinar</span>
        )}
      </button>
      <div className="mt-1 border-t border-black pt-1 text-center text-[10px] uppercase text-neutral-500">
        Assinatura
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={!value}
        className="btn-ui no-print mt-1 self-center rounded-xl border-2 border-[#dc2626] px-3 py-1 text-[10px] font-semibold uppercase text-[#dc2626] disabled:opacity-40"
      >
        Limpar assinatura
      </button>
      {aberto && <Prancheta label={label} onSave={onChange} onClose={() => setAberto(false)} />}
    </div>
  );
}
