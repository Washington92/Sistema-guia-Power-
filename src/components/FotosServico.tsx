import { useRef, useState } from "react";

export interface Foto {
  id: number;
  src: string;
  legenda: string;
}

let nextFotoId = 1;
export const MAX_FOTOS = 4;

// Reduz a foto antes de guardar, para caber no rascunho do aparelho
async function comprimirFoto(file: File, maxLado = 1100, qualidade = 0.62): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao abrir a imagem"));
    image.src = dataUrl;
  });

  const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", qualidade);
}

export function FotosEditor({
  fotos,
  setFotos,
  incluirFotos,
  setIncluirFotos,
}: {
  fotos: Foto[];
  setFotos: (f: Foto[]) => void;
  incluirFotos: boolean;
  setIncluirFotos: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [carregando, setCarregando] = useState(false);

  const adicionar = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setCarregando(true);
    try {
      const novas: Foto[] = [];
      for (const file of Array.from(files).slice(0, Math.max(0, MAX_FOTOS - fotos.length))) {
        if (!file.type.startsWith("image/")) continue;
        const src = await comprimirFoto(file);
        novas.push({ id: nextFotoId++, src, legenda: "" });
      }
      setFotos([...fotos, ...novas]);
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const atualizar = (id: number, legenda: string) =>
    setFotos(fotos.map((f) => (f.id === id ? { ...f, legenda } : f)));

  const remover = (id: number) => setFotos(fotos.filter((f) => f.id !== id));

  return (
    <div className="no-print border-b-2 border-black px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase">Fotos do serviço</span>
        <label className="flex items-center gap-2 text-[11px] uppercase">
          <input
            type="checkbox"
            checked={incluirFotos}
            onChange={(e) => setIncluirFotos(e.target.checked)}
            className="h-4 w-4 accent-neutral-900"
          />
          Incluir fotos no PDF
        </label>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void adicionar(e.target.files)}
        className="hidden"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={fotos.length >= MAX_FOTOS}
          className="btn-ui rounded-xl bg-[#1d4ed8] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm disabled:opacity-40"
        >
          + Adicionar / Tirar foto
        </button>
        <span className="text-[11px] text-neutral-600">
          {carregando
            ? "Preparando fotos..."
            : `${fotos.length} de ${MAX_FOTOS} fotos${fotos.length >= MAX_FOTOS ? " (limite atingido)" : fotos.length < 3 ? " — mínimo 3" : ""}`}
        </span>
      </div>

      {fotos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <div key={foto.id} className="rounded border border-neutral-400 p-1.5">
              <div className="relative">
                <img
                  src={foto.src}
                  alt={`Foto ${i + 1} do serviço`}
                  className="h-28 w-full rounded-sm object-cover"
                />
                <button
                  type="button"
                  onClick={() => remover(foto.id)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white"
                >
                  X
                </button>
              </div>
              <div className="mt-1.5 flex gap-1">
                {["Antes", "Depois"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => atualizar(foto.id, t)}
                    className="rounded border border-neutral-400 px-1.5 py-0.5 text-[10px] uppercase"
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => atualizar(foto.id, "")}
                  className="rounded border border-neutral-400 px-1.5 py-0.5 text-[10px] uppercase"
                >
                  Limpar
                </button>
              </div>
              <input
                value={foto.legenda}
                onChange={(e) => atualizar(foto.id, e.target.value)}
                placeholder="Legenda (opcional)"
                aria-label={`Legenda da foto ${i + 1}`}
                className="mt-1 w-full border-b border-neutral-400 bg-transparent px-1 py-0.5 text-[11px] outline-none focus:bg-yellow-50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FotosImpressao({
  fotos,
  cabecalhoUrl,
  local,
  dataHora,
}: {
  fotos: Foto[];
  cabecalhoUrl: string;
  local: string;
  dataHora: string;
}) {
  if (fotos.length === 0) return null;

  return (
    <div className="fotos mx-auto mt-6 hidden max-w-[820px] border-2 border-black bg-white text-black print:mt-0 print:block print:max-w-none print:border">
      <img src={cabecalhoUrl} alt="Grupo Águia Power" className="block w-full" />

      <div className="border-y-2 border-black bg-neutral-200 py-1.5 text-center text-[16px] font-bold uppercase">
        Registro Fotografico do Atendimento
      </div>

      <div className="grid grid-cols-2 border-b-2 border-black text-[11px] font-bold uppercase">
        <div className="border-r-2 border-black px-2 py-1">Local: {local}</div>
        <div className="px-2 py-1">Data e horario: {dataHora}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-2">
        {fotos.map((foto, i) => (
          <div key={foto.id} className="foto-print border border-black p-1">
            <img
              src={foto.src}
              alt={foto.legenda || `Foto ${i + 1}`}
              className="h-full w-full object-contain"
            />
            {foto.legenda ? (
              <div className="mt-0.5 text-center text-[10px] uppercase">{foto.legenda}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
