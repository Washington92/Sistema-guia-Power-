import React from "react";
import brasao from "@/assets/brasao.png";
import { Usuario } from "@/types/auth";
import {
  FileText,
  PlusCircle,
  BarChart3,
  Timer,
  Trophy,
  Package,
  Users,
  Settings,
  LogOut,
  X,
  Shield,
  UserCheck,
} from "lucide-react";

export type AbaNavegacao =
  | "fichas"
  | "nova_ficha"
  | "metricas"
  | "sla"
  | "rankings"
  | "estoque"
  | "usuarios"
  | "configuracoes";

interface SidebarProps {
  aberta: boolean;
  onFechar: () => void;
  abaAtiva: AbaNavegacao;
  onSelecionarAba: (aba: AbaNavegacao) => void;
  usuarioAtual: Usuario;
  onTrocarUsuario: () => void;
  totalFichas: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  aberta,
  onFechar,
  abaAtiva,
  onSelecionarAba,
  usuarioAtual,
  onTrocarUsuario,
  totalFichas,
}) => {
  const isGestor = usuarioAtual.papel === "gestor";

  const itensMenu = [
    {
      id: "fichas" as AbaNavegacao,
      label: isGestor ? "Todas as OS / Fichas" : "Meus Atendimentos",
      icone: FileText,
      badge: totalFichas,
      permitido: true,
    },
    {
      id: "nova_ficha" as AbaNavegacao,
      label: "Abrir Nova OS",
      icone: PlusCircle,
      destaque: true,
      permitido: true,
    },
    // Itens exclusivos da Gestão
    {
      id: "metricas" as AbaNavegacao,
      label: "Métricas & Resultados",
      icone: BarChart3,
      permitido: isGestor,
      separador: true,
    },
    {
      id: "sla" as AbaNavegacao,
      label: "Controle de SLA",
      icone: Timer,
      permitido: isGestor,
    },
    {
      id: "rankings" as AbaNavegacao,
      label: "Rankings da Equipe",
      icone: Trophy,
      permitido: isGestor,
    },
    {
      id: "estoque" as AbaNavegacao,
      label: "Estoque & Materiais",
      icone: Package,
      permitido: isGestor,
    },
    {
      id: "usuarios" as AbaNavegacao,
      label: "Usuários & Senhas",
      icone: Users,
      permitido: isGestor,
      separador: true,
    },
    {
      id: "configuracoes" as AbaNavegacao,
      label: "Configurações",
      icone: Settings,
      permitido: isGestor,
    },
  ];

  return (
    <>
      {/* Overlay para celular */}
      {aberta && (
        <div
          onClick={onFechar}
          className="no-print fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Barra Lateral */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-[80] flex w-72 flex-col bg-[#0b1f5c] text-white shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${
          aberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between border-b border-blue-900/60 p-4">
          <div className="flex items-center gap-3">
            <img src={brasao} alt="Águia Power" className="h-10 w-auto object-contain drop-shadow" />
            <div>
              <h2 className="text-[14px] font-bold leading-tight tracking-wide">Águia Power</h2>
              <p className="text-[10px] text-blue-300">Gestão Operacional</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="cursor-pointer rounded-lg p-1.5 text-blue-300 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card do Usuário Logado */}
        <div className="m-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white shadow-xs">
                {usuarioAtual.nome.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">{usuarioAtual.nome}</p>
                <div className="flex items-center gap-1">
                  {isGestor ? (
                    <span className="rounded bg-purple-400/30 px-1.5 py-0.2 text-[9px] font-bold text-purple-200">
                      👑 Gestor
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-400/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-200">
                      🔧 Técnico
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onTrocarUsuario}
              title="Trocar usuário"
              className="cursor-pointer rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {itensMenu.map((item, idx) => {
            if (!item.permitido) return null;
            const Icon = item.icone;
            const isAtivo = abaAtiva === item.id;

            return (
              <React.Fragment key={item.id}>
                {item.separador && (
                  <div className="my-2 border-t border-blue-900/60 pt-2">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-blue-300/80">
                      Gestão & Central
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelecionarAba(item.id);
                    onFechar();
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition active:scale-98 ${
                    isAtivo
                      ? "bg-white text-[#0b1f5c] shadow-md font-bold"
                      : item.destaque
                        ? "bg-blue-600/60 text-white hover:bg-blue-600"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isAtivo ? "text-[#0b1f5c]" : "text-blue-200"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isAtivo ? "bg-[#0b1f5c] text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-blue-900/60 p-3 text-center">
          <p className="text-[10px] text-blue-300">GCR Sistemas / Águia Power</p>
          <p className="text-[9px] text-blue-400/80">v2.5 · Cloud Sync & SLA Ativos</p>
        </div>
      </aside>
    </>
  );
};
