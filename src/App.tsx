import React, { useEffect, useState } from "react";
import { FotosEditor, FotosImpressao, type Foto } from "@/components/FotosServico";
import brasao from "@/assets/brasao.png";
import cabecalho from "@/assets/cabecalho.png";
import { SignaturePad } from "@/components/SignaturePad";
import { EditorFoco } from "@/components/EditorFoco";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PainelCentral } from "@/components/PainelCentral";
import { Sidebar, AbaNavegacao } from "@/components/Sidebar";
import { Usuario, USUARIOS_INICIAIS } from "@/types/auth";
import { NivelSla, REGRAS_SLA, calcularStatusSla } from "@/types/sla";
import { LoginModal } from "@/components/LoginModal";
import { Menu, LogIn } from "lucide-react";
import {
  salvarFichaNuvem,
  excluirFichaNuvem,
  escutarFichasNuvem,
  testConnection,
} from "@/lib/firebase";

const SERVICOS = [
  "RETROFIT SALA DE GINASTICA",
  "FIT POINT SALA SPA",
  "SISTEMA DE WI-FI",
  "SISTEMA DE CFTV",
  "ORGANIZAÇÃO RACK",
  "SISTEMA DE ANTENA CELULAR",
  "DESMONTAGEM UNIDADE",
  "PONTO DE ENERGY DRINK",
  "FORMATAÇÃO DE COMPUTADOR",
  "SISTEMA DE SOM",
  "TROCA/INSTALAÇÃO TV",
  "PONTO DE LOJA SUPRIMENTOS",
  "BALANÇA DE BIOIMPEDANCIA",
  "MODULADOR DE TV",
  "ANALISE DE SERVIÇO/ VISITA",
];

const inputClass =
  "w-full bg-transparent px-1 py-0.5 text-[12px] outline-none focus:bg-yellow-50 print:focus:bg-transparent";

function Campo({
  label,
  value,
  onChange,
  className = "",
  extra,
  listId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  extra?: React.ReactNode;
  listId?: string;
}) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1.5 ${className}`}>
      <span className="whitespace-nowrap text-[12px] font-bold uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        list={listId}
      />
      {extra}
    </div>
  );
}

function Caixa({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center border border-black bg-neutral-100 text-[13px] font-bold leading-none print:bg-white"
    >
      {checked ? "X" : ""}
    </button>
  );
}

function StatusBtn({
  cor,
  label,
  checked,
  onClick,
}: {
  cor: "verde" | "vermelho";
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  const ativo =
    cor === "verde"
      ? "border-[#16a34a] bg-[#16a34a] text-white"
      : "border-[#dc2626] bg-[#dc2626] text-white";
  const inativo =
    cor === "verde"
      ? "border-[#16a34a] text-[#15803d] hover:bg-green-50"
      : "border-[#dc2626] text-[#b91c1c] hover:bg-red-50";

  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={`btn-ui status-btn flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-[12px] font-bold uppercase transition-all duration-200 ${checked ? ativo : inativo}`}
    >
      <span className="btn-icon flex h-5 w-5 items-center justify-center rounded-md border-2 border-current text-[12px] leading-none">
        {checked ? "X" : ""}
      </span>
      {label}
    </button>
  );
}

interface MaterialRow {
  id: number;
  especificacao: string;
  unidade: string;
  quantidade: string;
}

let nextId = 100;
function novaLinha(): MaterialRow {
  return { id: nextId++, especificacao: "", unidade: "", quantidade: "" };
}

interface Dados {
  local: string;
  dataHora: string;
  sigla: string;
  lider: string;
  colaborador: string;
  marcados: Record<string, boolean>;
  outros: boolean;
  outrosTexto: string;
  descricao: string;
  sucesso: boolean;
  naoRealizado: boolean;
  motivo: string;
  motivoDetalhe: string;
  material: string;
  materialDetalhe: string;
  assTecnico: string | null;
  assColaborador: string | null;
  linhas: MaterialRow[];
  fotos: Foto[];
  incluirFotos: boolean;
  entrada?: number | null;
  saida?: number | null;
  gpsUrl?: string | null;
  nivelSla?: NivelSla;
}

const MATERIAIS_RAPIDOS: { nome: string; unidade: string }[] = [
  { nome: "Cabo UTP Cat.6", unidade: "M" },
  { nome: "Conector RJ45", unidade: "UN" },
  { nome: "Patch Cord 1.5m", unidade: "UN" },
  { nome: "Patch Cord 2.5m", unidade: "UN" },
  { nome: "Keystone RJ45 Cat.6", unidade: "UN" },
  { nome: "Câmera Dome IP", unidade: "UN" },
  { nome: "Câmera Bullet IP", unidade: "UN" },
  { nome: "Fonte 12V 5A", unidade: "UN" },
  { nome: "Fonte 12V 2A", unidade: "UN" },
  { nome: "Balun HD", unidade: "UN" },
  { nome: "Conector P4 Macho", unidade: "UN" },
  { nome: "Abraçadeira de Nylon", unidade: "PCT" },
  { nome: "Fita Isolante 3M", unidade: "UN" },
  { nome: "Filtro de Linha 6T", unidade: "UN" },
];

const SUGESTOES_PADRAO_LOCAIS = [
  "Smart Fit",
  "Bio Ritmo",
  "Bluefit",
  "Selfit",
  "Panobianco",
  "Skyfit",
  "Engenharia do Corpo",
  "Central Águia Power",
];

const vazio = (nomeTecnico = ""): Dados => ({
  local: "",
  dataHora: "",
  sigla: "",
  lider: nomeTecnico,
  colaborador: "",
  marcados: {},
  outros: false,
  outrosTexto: "",
  descricao: "",
  sucesso: false,
  naoRealizado: false,
  motivo: "",
  motivoDetalhe: "",
  material: "",
  materialDetalhe: "",
  assTecnico: null,
  assColaborador: null,
  linhas: Array.from({ length: 20 }, novaLinha),
  fotos: [],
  incluirFotos: true,
  gpsUrl: null,
  nivelSla: "padrao",
});

const CHAVE = "ficha-checklist-rascunho";

function pendencias(d: Dados) {
  const f: string[] = [];
  if (!d.local.trim()) f.push("Local");
  if (!d.sucesso && !d.naoRealizado) f.push("Status (sucesso / não realizado)");
  if (!d.assTecnico) f.push("Assinatura do técnico");
  if (!d.assColaborador) f.push("Assinatura do colaborador");
  return f;
}

function confirmarPendencias(d: Dados) {
  void d;
  return true;
}

function imprimir(d: Dados) {
  if (!confirmarPendencias(d)) return;
  const antigo = document.title;
  const data = (d.dataHora.split(" ")[0] || new Date().toLocaleDateString("pt-BR")).replace(/\//g, "-");
  document.title = `CheckList - Águia Power - ${d.local.trim() || "Unidade"} - ${data}`;
  window.print();
  setTimeout(() => (document.title = antigo), 1000);
}

const HIST = "fichas-historico";

interface Registro {
  id: string;
  atualizado: number;
  dados: Dados;
}

function lerHist(): Registro[] {
  try {
    return JSON.parse(localStorage.getItem(HIST) || "[]") as Registro[];
  } catch {
    return [];
  }
}

function gravarHist(l: Registro[]): "ok" | "semfotos" | "erro" {
  try {
    localStorage.setItem(HIST, JSON.stringify(l));
    return "ok";
  } catch {
    try {
      localStorage.setItem(HIST, JSON.stringify(l.map((r) => ({ ...r, dados: { ...r.dados, fotos: [] } }))));
      return "semfotos";
    } catch {
      return "erro";
    }
  }
}

const novoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function progresso(d: Dados) {
  const itens = [
    d.local,
    d.dataHora,
    d.sigla,
    d.lider,
    d.colaborador,
    Object.values(d.marcados).some(Boolean) || d.outros,
    d.descricao,
    d.sucesso || d.naoRealizado,
    d.fotos.length > 0,
    d.assTecnico,
    d.assColaborador,
  ];
  return Math.round((itens.filter(Boolean).length / itens.length) * 100);
}

function statusTxt(d: Dados) {
  return d.sucesso ? "Sucesso" : d.naoRealizado ? "Não realizado" : "Em andamento";
}

const CHAVE_TEC = "ficha-tecnico-nome";

function hm(t: number) {
  return new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function duracao(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`;
}

function cronometro(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

function agora() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function App() {
  // Usuários e Autenticação com Senhas
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const salvo = localStorage.getItem("fichas-usuarios");
      if (salvo) return JSON.parse(salvo);
    } catch {}
    return USUARIOS_INICIAIS;
  });

  const [usuarioAtual, setUsuarioAtual] = useState<Usuario>(() => {
    try {
      const idSalvo = localStorage.getItem("fichas-usuario-atual-id");
      if (idSalvo) {
        const usr = usuarios.find((u) => u.id === idSalvo);
        if (usr) return usr;
      }
    } catch {}
    // Padrão: primeiro técnico da equipe (Carlos Silva)
    return usuarios.find((u) => u.papel === "tecnico") || usuarios[0];
  });

  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [abaSidebar, setAbaSidebar] = useState<AbaNavegacao>("fichas");
  const [filtroApenasMinhas, setFiltroApenasMinhas] = useState<boolean>(() => usuarioAtual.papel === "tecnico");

  const [d, setD] = useState<Dados>(() => vazio(usuarioAtual?.nome || ""));
  const [lista, setLista] = useState<Registro[]>([]);
  const [atualId, setAtualId] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");
  const [opcoes, setOpcoes] = useState(false);
  const [tecnico, setTecnico] = useState(usuarioAtual?.nome || "");
  const [agoraMs, setAgoraMs] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState<"fichas" | "central">("fichas");

  // Funções de Gestão de Usuários
  const salvarUsuario = (novo: Usuario) => {
    setUsuarios((prev) => {
      const idx = prev.findIndex((u) => u.id === novo.id);
      const novaLista = idx >= 0 ? prev.map((u) => (u.id === novo.id ? novo : u)) : [...prev, novo];
      try {
        localStorage.setItem("fichas-usuarios", JSON.stringify(novaLista));
      } catch {}
      return novaLista;
    });
    if (usuarioAtual?.id === novo.id) {
      setUsuarioAtual(novo);
    }
  };

  const excluirUsuario = (id: string) => {
    setUsuarios((prev) => {
      const novaLista = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem("fichas-usuarios", JSON.stringify(novaLista));
      } catch {}
      return novaLista;
    });
    if (usuarioAtual?.id === id) {
      const proximo = usuarios.find((u) => u.id !== id) || USUARIOS_INICIAIS[0];
      setUsuarioAtual(proximo);
      localStorage.setItem("fichas-usuario-atual-id", proximo.id);
    }
  };

  const fazerLogin = (u: Usuario) => {
    setUsuarioAtual(u);
    try {
      localStorage.setItem("fichas-usuario-atual-id", u.id);
    } catch {}
    salvarTecnico(u.nome);
    setFiltroApenasMinhas(u.papel === "tecnico");
  };

  const sugestoesLocais = Array.from(
    new Set([
      ...SUGESTOES_PADRAO_LOCAIS,
      ...lista.map((r) => r.dados.local?.trim()).filter(Boolean),
    ])
  );

  const sugestoesSiglas = Array.from(
    new Set(lista.map((r) => r.dados.sigla?.trim()).filter(Boolean))
  );

  // In-app modals for seamless iFrame compatibility
  const [promptData, setPromptData] = useState<{
    open: boolean;
    title: string;
    defaultValue: string;
    onSave: (val: string) => void;
  }>({ open: false, title: "", defaultValue: "", onSave: () => {} });

  const [confirmData, setConfirmData] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

  const [alertData, setAlertData] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const [promptInputValue, setPromptInputValue] = useState("");

  const abrirPrompt = (title: string, defaultValue: string, onSave: (val: string) => void) => {
    setPromptInputValue(defaultValue);
    setPromptData({ open: true, title, defaultValue, onSave });
  };

  const abrirConfirm = (message: string, onConfirm: () => void) => {
    setConfirmData({ open: true, message, onConfirm });
  };

  const abrirAlert = (message: string) => {
    setAlertData({ open: true, message });
  };

  const safeOpenUrl = (url: string) => {
    try {
      const win = window.open(url, "_blank");
      if (!win) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  useEffect(() => {
    setTecnico(localStorage.getItem(CHAVE_TEC) || "");
  }, []);

  useEffect(() => {
    if (!d.entrada || d.saida) return;
    setAgoraMs(Date.now());
    const i = setInterval(() => setAgoraMs(Date.now()), 1000);
    return () => clearInterval(i);
  }, [d.entrada, d.saida]);

  const salvarTecnico = (n: string) => {
    localStorage.setItem(CHAVE_TEC, n);
    setTecnico(n);
  };

  useEffect(() => {
    let l = lerHist();
    try {
      const raw = localStorage.getItem(CHAVE);
      if (raw) {
        const salvo = { ...vazio(), ...(JSON.parse(raw) as Dados) };
        l = [{ id: novoId(), atualizado: Date.now(), dados: salvo }, ...l];
        gravarHist(l);
        localStorage.removeItem(CHAVE);
      }
    } catch {
      /* rascunho inválido */
    }
    setLista(l);
    setCarregado(true);

    // Conexão e sincronização em tempo real com o Firestore
    void testConnection();
    const unsub = escutarFichasNuvem((fichasNuvem) => {
      setLista((prevLocal) => {
        const mapa = new Map<string, Registro>();
        prevLocal.forEach((r) => mapa.set(r.id, r));
        fichasNuvem.forEach((rNuvem) => {
          const rLocal = mapa.get(rNuvem.id);
          if (!rLocal || rNuvem.atualizado >= rLocal.atualizado) {
            mapa.set(rNuvem.id, rNuvem as Registro);
          }
        });
        const unificado = Array.from(mapa.values()).sort((a, b) => b.atualizado - a.atualizado);
        gravarHist(unificado);
        return unificado;
      });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!carregado || !atualId) return;
    const t = setTimeout(() => {
      setLista((prev) => {
        const reg = { id: atualId, atualizado: Date.now(), dados: d };
        const nova = [reg, ...prev.filter((r) => r.id !== atualId)];
        const r = gravarHist(nova);
        // Sincroniza com a nuvem em segundo plano
        void salvarFichaNuvem(reg);
        const hora = new Date().toLocaleTimeString("pt-BR");
        setAviso(
          r === "ok"
            ? `Salvo e sincronizado na nuvem · ${hora}`
            : r === "semfotos"
              ? `Salvo sem fotos (memória cheia) · ${hora}`
              : "Não foi possível salvar"
        );
        return nova;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [d, carregado, atualId]);

  const abrir = (dados: Dados, id: string) => {
    nextId = Math.max(nextId, ...dados.linhas.map((l) => l.id + 1));
    setD({ ...vazio(), ...dados });
    setAtualId(id);
    setAviso("");
    window.scrollTo({ top: 0 });
  };

  const set = <K extends keyof Dados>(k: K) => (v: Dados[K]) => setD((p) => ({ ...p, [k]: v }));

  const marcados = d.marcados;
  const toggle = (nome: string) => (v: boolean) =>
    setD((p) => ({ ...p, marcados: { ...p.marcados, [nome]: v } }));

  const novaFicha = () => {
    // Puxa automaticamente o nome do técnico autenticado para o campo Líder
    const nomeTec = usuarioAtual.papel === "tecnico" ? usuarioAtual.nome : (tecnico || "");
    abrir(vazio(nomeTec), novoId());
  };

  const duplicar = (r: Registro) =>
    abrir(
      {
        ...vazio(),
        local: r.dados.local,
        sigla: r.dados.sigla,
        lider: r.dados.lider || usuarioAtual.nome,
        colaborador: r.dados.colaborador,
      },
      novoId()
    );

  const excluir = (id: string) => {
    abrirConfirm("Excluir esta ficha do histórico? Isso não pode ser desfeito.", () => {
      const nova = lista.filter((r) => r.id !== id);
      gravarHist(nova);
      setLista(nova);
      void excluirFichaNuvem(id);
    });
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(lista)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup-fichas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importar = async (f: File | undefined) => {
    if (!f) return;
    try {
      const vind = JSON.parse(await f.text()) as Registro[];
      const ids = new Set(lista.map((r) => r.id));
      const nova = [...lista, ...vind.filter((r) => r.id && r.dados && !ids.has(r.id))].sort(
        (a, b) => b.atualizado - a.atualizado
      );
      gravarHist(nova);
      setLista(nova);
      abrirAlert(`${nova.length - lista.length} ficha(s) importada(s).`);
    } catch {
      abrirAlert("Arquivo de backup inválido.");
    }
  };

  const compartilhar = async () => {
    if (!confirmarPendencias(d)) return;
    const servicos = SERVICOS.filter((s) => d.marcados[s]);
    if (d.outros && d.outrosTexto) servicos.push(`OUTROS: ${d.outrosTexto}`);
    const texto = [
      "*Ficha de Check-List - Grupo Águia Power*",
      `Local: ${d.local}`,
      `Data e horário: ${d.dataHora}`,
      `Sigla: ${d.sigla} | Líder: ${d.lider} | Colaborador: ${d.colaborador}`,
      `Serviços: ${servicos.join(", ") || "-"}`,
      d.descricao ? `Descrição: ${d.descricao}` : "",
      d.sucesso
        ? "Status: realizado com sucesso"
        : d.naoRealizado
          ? `Status: NÃO realizado - ${d.motivo} ${d.motivoDetalhe}`
          : "",
      "",
      "PDF da ficha segue em anexo.",
    ]
      .filter(Boolean)
      .join("\n");
    safeOpenUrl(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  };

  const obterGps = async (): Promise<{ lat: number; lng: number; url: string } | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve({
            lat: latitude,
            lng: longitude,
            url: `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
      );
    });
  };

  const capturarGpsManualmente = async () => {
    setAviso("Obtendo localização GPS...");
    const gps = await obterGps();
    if (gps) {
      setD((p) => ({ ...p, gpsUrl: gps.url }));
      setAviso("Localização GPS registrada com sucesso!");
    } else {
      abrirAlert("Não foi possível obter o GPS. Verifique a permissão de localização do aparelho.");
      setAviso("");
    }
  };

  const executarInicioAtendimento = async (nome: string) => {
    salvarTecnico(nome);
    const t = Date.now();
    const gps = await obterGps();
    setD((p) => ({ ...p, entrada: t, saida: null, gpsUrl: gps?.url ?? p.gpsUrl ?? null }));
    const dt = new Date(t);
    const texto = [
      "📍 *TÉCNICO NO LOCAL · ATENDIMENTO INICIADO*",
      "",
      `🏢 Unidade: ${d.local || "-"}`,
      `👤 Técnico: ${nome}`,
      `📅 Data: ${dt.toLocaleDateString("pt-BR")}`,
      `⏰ Entrada: ${hm(t)}`,
      gps?.url ? `📌 GPS: ${gps.url}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    safeOpenUrl(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  };

  const iniciarAtendimento = () => {
    const nome = (usuarioAtual?.papel === "tecnico" ? usuarioAtual.nome : (tecnico || usuarioAtual?.nome || "")).trim();
    if (!nome) {
      abrirPrompt("Nome do técnico responsável:", "", (n) => {
        const trimmed = n.trim();
        if (trimmed) void executarInicioAtendimento(trimmed);
      });
      return;
    }
    void executarInicioAtendimento(nome);
  };

  const finalizarAtendimento = () => {
    const ent = d.entrada ?? Date.now();
    const sai = Date.now();
    setD((p) => ({ ...p, saida: sai }));
    const feitos = SERVICOS.filter((s) => d.marcados[s]);
    if (d.outros && d.outrosTexto) feitos.push(`OUTROS: ${d.outrosTexto}`);
    const mats = d.linhas.filter((l) => l.especificacao.trim());
    const status = d.sucesso
      ? "✅ Realizado com sucesso"
      : d.naoRealizado
        ? `❌ Não realizado — Motivo: ${[d.motivo, d.motivoDetalhe].filter(Boolean).join(" ") || "-"}`
        : "Não informado";
    const nomeTec = d.lider || usuarioAtual.nome || tecnico || "-";
    const infoSla = calcularStatusSla(ent, sai, d.nivelSla || "padrao");
    const regraSla = REGRAS_SLA[d.nivelSla || "padrao"];

    const texto = [
      "✅ *ATENDIMENTO CONCLUÍDO*",
      "",
      `🏢 Unidade: ${d.local || "-"}`,
      `👤 Técnico: ${nomeTec}`,
      `📅 Data: ${new Date(ent).toLocaleDateString("pt-BR")}`,
      `⏰ Entrada: ${hm(ent)} · Saída: ${hm(sai)}`,
      `⏱ Duração: ${duracao(sai - ent)}`,
      `🎯 SLA: ${regraSla.rotulo} · ${infoSla.texto} (${duracao(sai - ent)})`,
      d.gpsUrl ? `📌 Localização GPS: ${d.gpsUrl}` : "",
      "",
      "*🛠 Serviços realizados:*",
      ...(feitos.length ? feitos.map((s) => `• ${s}`) : ["• Nenhum serviço marcado"]),
      d.descricao ? `\n📝 Descrição: ${d.descricao}` : "",
      `\n📊 Status: ${status}`,
      mats.length
        ? `\n📦 Materiais:\n${mats.map((m) => `• ${m.especificacao}${m.quantidade ? ` — ${m.quantidade}` : ""}${m.unidade ? ` ${m.unidade}` : ""}`).join("\n")}`
        : "\n📦 Materiais: Nenhum material utilizado",
      `📸 Fotos: ${d.fotos.length ? `${d.fotos.length} foto(s) anexada(s)` : "Nenhuma foto anexada"}`,
      `✍ Assinaturas: Técnico ${d.assTecnico ? "✔" : "pendente"} · Colaborador ${d.assColaborador ? "✔" : "pendente"}`,
      "",
      "A ficha completa em PDF segue em anexo.",
    ]
      .filter((x) => x !== "")
      .join("\n");
    safeOpenUrl(`https://wa.me/?text=${encodeURIComponent(texto)}`);
    setTimeout(() => imprimir(d), 600);
  };

  return (
    <>
      <OfflineIndicator />
      {/* Custom Modal for Prompts */}
      {promptData.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-[15px] font-bold text-slate-900">{promptData.title}</h3>
            <input
              type="text"
              autoFocus
              value={promptInputValue}
              onChange={(e) => setPromptInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  promptData.onSave(promptInputValue);
                  setPromptData((prev) => ({ ...prev, open: false }));
                }
              }}
              className="mt-3 w-full rounded-xl border border-slate-300 p-2.5 text-[14px] outline-none focus:border-blue-600"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPromptData((prev) => ({ ...prev, open: false }))}
                className="rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  promptData.onSave(promptInputValue);
                  setPromptData((prev) => ({ ...prev, open: false }));
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-bold text-white shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal for Confirms */}
      {confirmData.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-[14px] font-medium text-slate-800">{confirmData.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmData((prev) => ({ ...prev, open: false }))}
                className="rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmData.onConfirm();
                  setConfirmData((prev) => ({ ...prev, open: false }));
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-bold text-white shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal for Alerts */}
      {alertData.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-[14px] font-medium text-slate-800">{alertData.message}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAlertData({ open: false, message: "" })}
                className="rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-bold text-white shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History view (when no sheet is open) */}
      {!atualId ? (
        abaAtiva === "central" ? (
          <PainelCentral
            lista={lista}
            onVoltar={() => {
              setAbaAtiva("fichas");
              setAbaSidebar("fichas");
            }}
            onAbrirFicha={(id) => {
              const r = lista.find((item) => item.id === id);
              if (r) {
                abrir(r.dados, r.id);
                setAbaAtiva("fichas");
                setAbaSidebar("fichas");
              }
            }}
            abaAtual={abaSidebar}
            onMudarAba={(aba) => setAbaSidebar(aba)}
            usuarios={usuarios}
            onSalvarUsuario={salvarUsuario}
            onExcluirUsuario={excluirUsuario}
          />
        ) : (
          <div className="min-h-screen bg-slate-100 pb-28 text-slate-900">
            <div className="mx-auto max-w-[640px]">
              <header className="relative flex flex-col items-center bg-white px-5 pb-3 pt-6 text-center">
                {/* Botão de Painel Lateral e Perfil no topo esquerdo */}
                <div className="absolute left-4 top-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSidebarAberta(true)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    title="Abrir painel lateral"
                  >
                    <Menu className="h-4 w-4 text-[#0b1f5c]" />
                    <span className="hidden sm:inline">Painel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalLoginAberto(true)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                    title="Trocar usuário / senha"
                  >
                    <span className="max-w-[85px] sm:max-w-none truncate">👤 {usuarioAtual.nome.split(" ")[0]}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        usuarioAtual.papel === "gestor"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {usuarioAtual.papel === "gestor" ? "Gestor" : "Técnico"}
                    </span>
                  </button>
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <PWAInstallButton />
                  <button
                    type="button"
                    onClick={() => setOpcoes((v) => !v)}
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                  >
                    Opções
                  </button>
                  {opcoes && (
                    <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left text-[13px] shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setOpcoes(false);
                          exportar();
                        }}
                        className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-slate-50"
                      >
                        Exportar backup
                      </button>
                      <label className="block cursor-pointer border-t border-slate-100 px-4 py-3 hover:bg-slate-50">
                        Importar backup
                        <input
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={(e) => {
                            setOpcoes(false);
                            void importar(e.target.files?.[0]);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <img src={brasao} alt="Grupo Águia Power" className="h-24 w-auto object-contain" />
                <h1 className="text-[13px] font-medium text-slate-500">
                  {usuarioAtual.papel === "tecnico" ? "Fichas do Técnico" : "Gestão Operacional de Fichas"}
                </h1>
              </header>

              {/* Barra de Status e Alternância */}
              <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white shadow-md">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-blue-900 shadow-sm">
                    {usuarioAtual.papel === "tecnico" ? "🔧 Meus Atendimentos" : "📋 Todas as OS"}
                  </span>
                  {/* Gestores veem o botão da central / métricas; técnicos focam nos atendimentos */}
                  {usuarioAtual.papel === "gestor" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAbaAtiva("central");
                        setAbaSidebar("metricas");
                      }}
                      className="cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/90 hover:bg-white/10 transition"
                    >
                      📊 Painel Central & SLA
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFiltroApenasMinhas((v) => !v)}
                      className={`cursor-pointer rounded-lg px-2 py-0.5 text-[10px] font-semibold transition ${
                        filtroApenasMinhas ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10"
                      }`}
                    >
                      {filtroApenasMinhas ? "Minhas fichas" : "Todas da equipe"}
                    </button>
                  )}
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium">
                  {lista.length} {lista.length === 1 ? "salva" : "salvas"}
                </span>
              </div>

              {/* Aviso para técnicos sobre auto-preenchimento */}
              {usuarioAtual.papel === "tecnico" && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-[12px] text-blue-900">
                  <p>
                    Técnico ativo: <strong>{usuarioAtual.nome}</strong> · Novas OS preenchem seu nome automaticamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalLoginAberto(true)}
                    className="font-bold underline text-blue-700 hover:text-blue-900 ml-2 shrink-0 cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>
              )}

            <div className="bg-white px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por unidade, líder ou data..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {(() => {
              const q = busca.trim().toLowerCase();
              let base = lista;
              if (usuarioAtual.papel === "tecnico" && filtroApenasMinhas) {
                base = base.filter(
                  (r) => r.dados.lider?.trim().toLowerCase() === usuarioAtual.nome.trim().toLowerCase()
                );
              }
              const filtrada = q
                ? base.filter((r) =>
                    `${r.dados.local} ${r.dados.dataHora} ${r.dados.lider} ${r.dados.colaborador}`
                      .toLowerCase()
                      .includes(q)
                  )
                : base;

              return (
                <>
                  {filtrada.length === 0 && (
                    <p className="m-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-[13px] text-slate-500">
                      {lista.length === 0
                        ? "Nenhuma ficha ainda. Toque no botão + para iniciar."
                        : "Nenhuma ficha encontrada."}
                    </p>
                  )}
                  <ul className="divide-y divide-slate-200 border-y border-slate-200">
                    {filtrada.map((r) => {
                      const cor = r.dados.sucesso
                        ? "text-green-600"
                        : r.dados.naoRealizado
                          ? "text-red-600"
                          : "text-amber-500";
                      const icone = r.dados.sucesso ? "✔" : r.dados.naoRealizado ? "✕" : "●";
                      return (
                        <li
                          key={r.id}
                          className="relative flex items-center gap-4 bg-slate-50 px-4 py-4 active:bg-slate-200"
                        >
                          <button
                            type="button"
                            onClick={() => abrir(r.dados, r.id)}
                            className="absolute inset-0 cursor-pointer"
                            aria-label={`Abrir ficha ${r.dados.local || "sem local"}`}
                          />
                          <div className="pointer-events-none flex h-12 w-16 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 bg-white px-1 text-center text-[13px] font-bold uppercase tracking-wide text-slate-700">
                            <span className="truncate">{r.dados.sigla || "—"}</span>
                          </div>
                          <div className="pointer-events-none min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-[16px] font-semibold text-slate-800">
                              <span className={`text-[15px] ${cor}`} title={statusTxt(r.dados)}>
                                {icone}
                              </span>
                              <span className="truncate">{r.dados.local || "Sem local"}</span>
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                              <span className="text-blue-600">📅</span>
                              {r.dados.dataHora || new Date(r.atualizado).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => duplicar(r)}
                            className="relative cursor-pointer rounded-full px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-200"
                            aria-label="Duplicar"
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(r.id)}
                            className="relative cursor-pointer rounded-full px-2 py-1 text-[13px] text-red-500 hover:bg-red-50"
                            aria-label="Excluir"
                          >
                            ✕
                          </button>
                          <span className="pointer-events-none text-[24px] leading-none text-slate-400">›</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={novaFicha}
            aria-label="Iniciar nova ficha"
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-[30px] leading-none text-white shadow-xl transition hover:bg-blue-700 active:scale-95"
          >
            +
          </button>
        </div>
        )
      ) : (
        /* Sheet view (Checklist form) */
        (() => {
          const pct = progresso(d);
          return (
            <div className="min-h-screen bg-neutral-200 pb-24 print:bg-white print:pb-0">
              <EditorFoco />
              <div className="no-print sticky top-0 z-20 mb-4 border-b border-neutral-300 bg-white px-4 py-2 shadow-sm">
                <div className="mx-auto flex max-w-[820px] items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarAberta(true)}
                    className="shrink-0 cursor-pointer rounded-md border border-neutral-300 p-1.5 text-neutral-700 hover:bg-neutral-100"
                    title="Menu lateral"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtualId(null)}
                    className="shrink-0 cursor-pointer rounded-md border border-neutral-400 px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-100"
                    aria-label="Voltar ao histórico"
                  >
                    ← Fichas
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{d.local || "Nova ficha"}</p>
                    <p className="truncate text-[11px] text-green-700">
                      {aviso ? `● ${aviso}` : "Toque nos campos para preencher"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalLoginAberto(true)}
                    className="hidden sm:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Trocar usuário"
                  >
                    <span>👤 {usuarioAtual.nome.split(" ")[0]}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                      {usuarioAtual.papel === "gestor" ? "Gestor" : "Técnico"}
                    </span>
                  </button>
                  <PWAInstallButton />
                  <span className="shrink-0 text-[13px] font-bold">{pct}%</span>
                </div>
                <div className="mx-auto mt-2 h-1.5 max-w-[820px] rounded-full bg-neutral-200">
                  <div
                    className="h-1.5 rounded-full bg-green-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-neutral-300 bg-white px-4 py-3">
                <div className="mx-auto grid max-w-[820px] grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={novaFicha}
                    className="btn-ui cursor-pointer rounded-xl border-2 border-[#0b1f5c] bg-white py-2.5 text-[13px] font-bold text-[#0b1f5c] shadow-sm hover:bg-blue-50"
                  >
                    Nova Ficha
                  </button>
                  {!d.entrada ? (
                    <button
                      type="button"
                      onClick={iniciarAtendimento}
                      className="btn-ui cursor-pointer rounded-xl bg-[#16a34a] py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-green-700"
                    >
                      ▶ Iniciar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finalizarAtendimento}
                      className="btn-ui cursor-pointer rounded-xl bg-[#dc2626] py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-red-700"
                    >
                      {d.saida ? "↻ Reenviar" : "■ Finalizar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => imprimir(d)}
                    className="btn-ui cursor-pointer rounded-xl bg-[#1d4ed8] py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-blue-800"
                  >
                    Imprimir / PDF
                  </button>
                </div>
              </div>

              {/* Datalists nativos para autocompletar sem impactar o PDF */}
              <datalist id="sugestoes-locais">
                {sugestoesLocais.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <datalist id="sugestoes-siglas">
                {sugestoesSiglas.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              <div className="no-print mx-auto mb-4 max-w-[820px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Etapas do Atendimento
                    </p>
                    {d.gpsUrl ? (
                      <a
                        href={d.gpsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        title="Ver localização registrada no Google Maps"
                      >
                        📍 GPS Ativo
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={capturarGpsManualmente}
                        className="cursor-pointer rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                        title="Registrar coordenadas GPS do local"
                      >
                        📍 Capturar GPS
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      abrirPrompt("Nome do técnico responsável:", tecnico, (n) => {
                        const trimmed = n.trim();
                        if (trimmed) salvarTecnico(trimmed);
                      });
                    }}
                    className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-200"
                  >
                    👤 {tecnico || "Definir técnico"} · ✏ Alterar
                  </button>
                </div>
                {!d.entrada ? (
                  <p className="mt-3 text-[12px] text-slate-500">
                    Toque em “Iniciar” na barra inferior para registrar a entrada.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] uppercase text-slate-500">Entrada</p>
                      <p className="text-[15px] font-bold">{hm(d.entrada)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] uppercase text-slate-500">{d.saida ? "Saída" : "Status"}</p>
                      <p className={`text-[15px] font-bold ${d.saida ? "" : "text-[#16a34a]"}`}>
                        {d.saida ? hm(d.saida) : "● Em atendimento"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] uppercase text-slate-500">
                        {d.saida ? "Duração" : "Tempo decorrido"}
                      </p>
                      <p className="text-[15px] font-bold tabular-nums">
                        {d.saida ? duracao(d.saida - d.entrada) : cronometro(agoraMs - d.entrada)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Printable sheet */}
              <div className="ficha mx-auto max-w-[820px] border-2 border-black bg-white text-black print:max-w-none print:border">
                <img src={cabecalho} alt="Grupo Águia Power" className="block w-full" />

                <div className="border-y-2 border-black bg-[#c9daf8] py-0.5 text-center text-[12px] font-bold uppercase">
                  GCR Sistemas de Seguranca / Aguia Power CNPJ: 44.683.082/0001-91
                </div>
                <div className="border-b-2 border-black bg-[#e8eefc] py-0.5 text-center text-[12px] font-bold uppercase">
                  paola.contato@gmail.com
                </div>
                <div className="border-b-2 border-black bg-neutral-200 py-2 text-center text-[19px] font-bold uppercase">
                  Ficha de Check-List
                </div>

                <div className="grid grid-cols-2 border-b-2 border-black">
                  <Campo
                    label="Local:"
                    value={d.local}
                    onChange={set("local")}
                    className="border-r-2 border-black"
                    listId="sugestoes-locais"
                  />
                  <Campo
                    label="Data e horario:"
                    value={d.dataHora}
                    onChange={set("dataHora")}
                    extra={
                      <button
                        type="button"
                        onClick={() => set("dataHora")(agora())}
                        className="btn-ui no-print shrink-0 cursor-pointer rounded-xl bg-[#1d4ed8] px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-sm hover:bg-blue-700"
                      >
                        Agora
                      </button>
                    }
                  />
                </div>

                <div className="grid grid-cols-3 border-b-2 border-black">
                  <Campo
                    label="Sigla:"
                    value={d.sigla}
                    onChange={set("sigla")}
                    className="border-r-2 border-black"
                    listId="sugestoes-siglas"
                  />
                  <Campo label="Lider:" value={d.lider} onChange={set("lider")} className="border-r-2 border-black" />
                  <Campo label="Colaborador:" value={d.colaborador} onChange={set("colaborador")} />
                </div>

                <div className="border-b-2 border-black bg-[#e8eefc] px-2 py-1.5 text-[11px] uppercase">
                  <strong>Obs.</strong> Obrigatorio o envio de 3 fotos minima por serviço executado. Video
                  quando necessario. Fotos antes e depois do serviço.
                </div>

                <FotosEditor
                  fotos={d.fotos}
                  setFotos={set("fotos")}
                  incluirFotos={d.incluirFotos}
                  setIncluirFotos={set("incluirFotos")}
                />

                <div className="border-b-2 border-black bg-neutral-300 py-1.5 text-center text-[19px] font-bold uppercase">
                  Serviço Executado
                </div>

                <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3 print:grid-cols-3 print:gap-1 print:p-2">
                  {SERVICOS.map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 text-[11.5px] uppercase">
                      <Caixa checked={!!marcados[s]} onChange={toggle(s)} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 pb-3">
                  <Caixa checked={d.outros} onChange={set("outros")} />
                  <span className="text-[11.5px] font-medium uppercase">Outros</span>
                  <input
                    value={d.outrosTexto}
                    data-rotulo="Outros serviços"
                    onChange={(e) => set("outrosTexto")(e.target.value)}
                    className={`${inputClass} border-b border-black`}
                  />
                </div>

                <div className="px-3 pb-3">
                  <textarea
                    rows={4}
                    value={d.descricao}
                    onChange={(e) => set("descricao")(e.target.value)}
                    data-rotulo="Descrição do serviço"
                    placeholder="Descrição do serviço..."
                    className="w-full resize-none border border-black p-2 text-[12px] outline-none focus:bg-yellow-50 print:placeholder:text-transparent print:focus:bg-transparent"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-around gap-3 border-y-2 border-black px-3 py-2">
                  <StatusBtn
                    cor="verde"
                    label="Serviço realizado com sucesso"
                    checked={d.sucesso}
                    onClick={() => setD((p) => ({ ...p, sucesso: !p.sucesso, naoRealizado: false }))}
                  />
                  <StatusBtn
                    cor="vermelho"
                    label="Serviço não realizado"
                    checked={d.naoRealizado}
                    onClick={() => setD((p) => ({ ...p, naoRealizado: !p.naoRealizado, sucesso: false }))}
                  />
                </div>

                <div className="px-3 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap text-[12px] uppercase">
                      Se não realizado especificar o motivo:
                    </span>
                    <input
                      value={d.motivo}
                      data-rotulo="Se não realizado, especificar o motivo"
                      onChange={(e) => set("motivo")(e.target.value)}
                      className={`${inputClass} border-b border-black`}
                    />
                  </div>
                  <textarea
                    value={d.motivoDetalhe}
                    data-rotulo="Motivo — detalhamento"
                    onChange={(e) => set("motivoDetalhe")(e.target.value)}
                    rows={2}
                    className="mt-2 w-full resize-none border border-black p-2 text-[12px] outline-none focus:bg-yellow-50 print:focus:bg-transparent"
                  />
                </div>

                <div className="px-3 pb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap text-[12px] uppercase">
                      Material necessario para concluir o serviço:
                    </span>
                    <input
                      value={d.material}
                      data-rotulo="Material necessário para concluir o serviço"
                      onChange={(e) => set("material")(e.target.value)}
                      className={`${inputClass} border-b border-black`}
                    />
                  </div>
                  <textarea
                    value={d.materialDetalhe}
                    data-rotulo="Material necessário — detalhamento"
                    onChange={(e) => set("materialDetalhe")(e.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none border border-black p-2 text-[12px] outline-none focus:bg-yellow-50 print:focus:bg-transparent"
                  />
                </div>

                <div className="border-y-2 border-black bg-neutral-200 py-1 text-center text-[12px] font-bold uppercase">
                  Assinatura dos Responsaveis
                </div>

                <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 print:grid-cols-2 print:gap-4 print:p-2">
                  <SignaturePad label="Tecnico TI Aguia Power" value={d.assTecnico} onChange={set("assTecnico")} />
                  <SignaturePad
                    label="Colaborador Academia Unidade"
                    value={d.assColaborador}
                    onChange={set("assColaborador")}
                  />
                </div>
              </div>

              {/* Second page: Material list */}
              <VersoMateriais
                linhas={d.linhas}
                setLinhas={(f) => setD((p) => ({ ...p, linhas: f(p.linhas) }))}
              />

              {/* Third page (optional): Photos */}
              {d.incluirFotos && (
                <FotosImpressao
                  fotos={d.fotos}
                  cabecalhoUrl={cabecalho}
                  local={d.local}
                  dataHora={d.dataHora}
                />
              )}
            </div>
          );
        })()
      )}
    </>
  );
}

function VersoMateriais({
  linhas,
  setLinhas,
}: {
  linhas: MaterialRow[];
  setLinhas: (f: (prev: MaterialRow[]) => MaterialRow[]) => void;
}) {
  const update = (id: number, patch: Partial<MaterialRow>) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const adicionarMaterialRapido = (item: { nome: string; unidade: string }) => {
    setLinhas((prev) => {
      const idxVazio = prev.findIndex((l) => !l.especificacao.trim());
      if (idxVazio !== -1) {
        return prev.map((l, i) =>
          i === idxVazio ? { ...l, especificacao: item.nome, unidade: item.unidade, quantidade: "1" } : l
        );
      }
      return [...prev, { id: nextId++, especificacao: item.nome, unidade: item.unidade, quantidade: "1" }];
    });
  };

  return (
    <div className="verso mx-auto mt-6 max-w-[820px] border-2 border-black bg-white text-black print:mt-0 print:max-w-none print:border">
      <div className="border-b border-black py-3 text-center font-serif text-[18px] font-bold uppercase">
        Lista de Materiais
      </div>

      {/* Catálogo de inserção rápida de materiais frequentes — tela somente (no-print para preservar 100% o PDF) */}
      <div className="no-print border-b border-black bg-slate-50 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-700">
            ⚡ Materiais Frequentes (toque para preencher):
          </span>
          <span className="text-[10px] text-slate-500">Insere na 1ª linha livre</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MATERIAIS_RAPIDOS.map((m) => (
            <button
              key={m.nome}
              type="button"
              onClick={() => adicionarMaterialRapido(m)}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-xs hover:border-[#0b1f5c] hover:bg-blue-50 hover:text-[#0b1f5c] active:scale-95 transition"
            >
              + {m.nome} ({m.unidade})
            </button>
          ))}
        </div>
      </div>

      <p className="no-print px-3 pt-2 text-[11px] text-neutral-500">
        A folha 2 da impressão espelha estas linhas — role para o lado no celular.
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[640px] font-serif">
          <div className="grid grid-cols-[3.5rem_minmax(15rem,1fr)_6.5rem_11rem] border-b border-black text-[14px] font-bold uppercase leading-tight print:grid-cols-[4rem_1fr_8rem_8rem]">
            <div className="border-r border-black px-2 py-2 text-center">Item</div>
            <div className="border-r border-black px-2 py-2">Especificação</div>
            <div className="border-r border-black px-2 py-2 text-center">Quantidade</div>
            <div className="px-2 py-2 text-center">Unidade</div>
          </div>
          {linhas.map((linha, i) => (
            <div
              key={linha.id}
              className="material-row grid grid-cols-[3.5rem_minmax(15rem,1fr)_6.5rem_11rem] border-b border-black text-[14px] print:grid-cols-[4rem_1fr_8rem_8rem]"
            >
              <div className="flex items-center justify-center border-r border-black px-2">{i + 1}</div>
              <div className="border-r border-black p-1 print:p-0">
                <input
                  aria-label={`Especificação do item ${i + 1}`}
                  value={linha.especificacao}
                  placeholder="Ex.: Cabo UTP cat. 6"
                  onChange={(e) => update(linha.id, { especificacao: e.target.value })}
                  className="pill-input w-full rounded-full border border-neutral-300 bg-neutral-50 px-3 py-2 text-[16px] outline-none print:py-1 print:text-[14px] focus:border-[#0b1f5c] print:placeholder:text-transparent"
                />
              </div>
              <div className="border-r border-black p-1 print:p-0">
                <input
                  aria-label={`Quantidade do item ${i + 1}`}
                  value={linha.quantidade}
                  onChange={(e) => update(linha.id, { quantidade: e.target.value })}
                  inputMode="decimal"
                  className="pill-input w-full rounded-full border border-neutral-300 bg-neutral-50 px-2 py-2 text-center text-[16px] print:py-1 print:text-[14px] outline-none focus:border-[#0b1f5c]"
                />
              </div>
              <div className="flex items-center gap-1 p-1 print:justify-center print:p-0">
                <span className="hidden print:inline">{linha.unidade}</span>
                <div className="no-print flex flex-1 gap-0.5 rounded-full bg-neutral-100 p-0.5">
                  {["UN", "M", "CX", "PCT"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => update(linha.id, { unidade: linha.unidade === u ? "" : u })}
                      className={`flex-1 cursor-pointer rounded-full py-2 font-sans text-[11px] font-bold transition ${linha.unidade === u ? "bg-[#0b1f5c] text-white shadow" : "text-neutral-600 hover:bg-neutral-200"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label={`Remover item ${i + 1}`}
                  onClick={() =>
                    setLinhas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== linha.id) : [novaLinha()]))
                  }
                  className="no-print flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-50 font-sans text-[12px] font-bold text-red-600 transition hover:bg-red-100 active:scale-90"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="no-print flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-[11px] text-neutral-500">
          {linhas.filter((l) => l.especificacao.trim()).length} de {linhas.length} linhas preenchidas
        </span>
        <button
          type="button"
          onClick={() => setLinhas((prev) => [...prev, novaLinha()])}
          className="btn-ui cursor-pointer rounded-xl bg-[#1d4ed8] px-4 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700"
        >
          + Adicionar linha
        </button>
      </div>
    </div>
  );
}
