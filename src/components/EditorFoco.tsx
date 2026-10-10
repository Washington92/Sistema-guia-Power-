import { useEffect, useRef, useState } from "react";

type Alvo = { el: HTMLInputElement | HTMLTextAreaElement; rotulo: string; multi: boolean };

function rotuloDe(el: HTMLElement): string {
  const r = el.dataset["rotulo"];
  if (r) return r;
  const span = el.parentElement?.querySelector("span");
  return (span?.textContent || "Campo").replace(/:\s*$/, "");
}

function gravar(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Barra de digitação focada (somente celular, nunca impressa). */
export function EditorFoco({ escopo = ".ficha" }: { escopo?: string }) {
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      if (window.innerWidth >= 768) return;
      const el = e.target as HTMLElement;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      if (el instanceof HTMLInputElement && !["text", ""].includes(el.type)) return;
      if (!el.closest(escopo) || el.closest(".editor-foco")) return;
      el.blur();
      setTexto(el.value);
      setAlvo({ el, rotulo: rotuloDe(el), multi: el instanceof HTMLTextAreaElement });
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [escopo]);

  useEffect(() => {
    if (!alvo) return;
    const t = campo.current;
    if (t) {
      t.focus();
      t.setSelectionRange(t.value.length, t.value.length);
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [alvo]);


  if (!alvo) return null;

  const concluir = () => {
    gravar(alvo.el, alvo.multi ? texto : texto.replace(/\n/g, " "));
    setAlvo(null);
  };

  return (
    <div
      className="editor-foco no-print fixed inset-0 z-[60] flex items-start justify-center bg-[#0b1f5c]/40 px-2 pt-[3vh] backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setAlvo(null)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 bg-[#14213d] px-4 py-3 text-center">
          <span className="block truncate text-[12px] font-bold uppercase tracking-[0.12em] text-white">{alvo.rotulo}</span>
        </div>
        <div className="p-3">
          <textarea
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (!alvo.multi && e.key === "Enter") {
                e.preventDefault();
                concluir();
              }
            }}
            enterKeyHint={alvo.multi ? "enter" : "done"}
            style={{ height: alvo.multi ? "34vh" : "18vh" }}
            className="block w-full resize-none rounded-xl border-2 border-[#1d4ed8]/40 bg-[#f5f8ff] px-4 py-3 text-[17px] leading-relaxed text-black outline-none focus:border-[#1d4ed8]"
          />
          <div className="mt-1.5 text-right text-[11px] text-slate-500">{texto.length} caracteres</div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button type="button" onClick={() => setAlvo(null)} className="btn-ui rounded-full bg-[#dc2626] py-2.5 text-[14px] font-bold text-white shadow">
            Cancelar
          </button>
          <button type="button" onClick={concluir} className="btn-ui rounded-full bg-[#16a34a] py-2.5 text-[14px] font-bold text-white shadow">
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
