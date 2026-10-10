import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Users,
  Building2,
  Download,
  Calendar,
  Layers,
  Timer,
  Trophy,
  Shield,
  Settings,
  Plus,
  Key,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Usuario } from "@/types/auth";
import { NivelSla, REGRAS_SLA, calcularStatusSla } from "@/types/sla";
import { AbaNavegacao } from "@/components/Sidebar";

export interface RegistroHist {
  id: string;
  atualizado: number;
  dados: {
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
    linhas: { id: number; especificacao: string; unidade: string; quantidade: string }[];
    fotos: { id: number; src: string; legenda: string }[];
    entrada?: number | null;
    saida?: number | null;
    gpsUrl?: string | null;
    nivelSla?: NivelSla;
  };
}

interface PainelCentralProps {
  lista: RegistroHist[];
  onVoltar: () => void;
  onAbrirFicha: (id: string) => void;
  abaAtual?: AbaNavegacao;
  onMudarAba?: (aba: AbaNavegacao) => void;
  usuarios: Usuario[];
  onSalvarUsuario: (usuario: Usuario) => void;
  onExcluirUsuario: (id: string) => void;
}

export const PainelCentral: React.FC<PainelCentralProps> = ({
  lista,
  onVoltar,
  onAbrirFicha,
  abaAtual = "metricas",
  onMudarAba,
  usuarios,
  onSalvarUsuario,
  onExcluirUsuario,
}) => {
  const [abaInterna, setAbaInterna] = useState<AbaNavegacao>(abaAtual);
  const [filtroPeriodo, setFiltroPeriodo] = useState<"todos" | "hoje" | "7dias" | "30dias">("todos");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroSla, setFiltroSla] = useState<string>("todos");

  // Modal de novo usuário
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoLogin, setNovoLogin] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoCargo, setNovoCargo] = useState("Técnico TI Águia Power");
  const [novoPapel, setNovoPapel] = useState<"tecnico" | "gestor">("tecnico");

  const abaExibida = onMudarAba ? abaAtual : abaInterna;
  const setAba = onMudarAba || setAbaInterna;

  // Técnicos presentes nas fichas
  const tecnicosNasFichas = useMemo(() => {
    const set = new Set<string>();
    lista.forEach((r) => {
      if (r.dados.lider?.trim()) set.add(r.dados.lider.trim());
    });
    return Array.from(set);
  }, [lista]);

  // Lista filtrada por período e técnico
  const listaFiltrada = useMemo(() => {
    const agora = Date.now();
    return lista.filter((r) => {
      if (filtroTecnico !== "todos" && r.dados.lider?.trim() !== filtroTecnico) {
        return false;
      }
      if (filtroPeriodo === "hoje") {
        const d = new Date(r.atualizado);
        const hj = new Date();
        return d.toDateString() === hj.toDateString();
      }
      if (filtroPeriodo === "7dias") {
        return agora - r.atualizado <= 7 * 24 * 60 * 60 * 1000;
      }
      if (filtroPeriodo === "30dias") {
        return agora - r.atualizado <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [lista, filtroPeriodo, filtroTecnico]);

  // Cálculos consolidados gerais & SLA
  const dadosConsolidados = useMemo(() => {
    const total = listaFiltrada.length;
    let sucessos = 0;
    let naoRealizados = 0;
    let emAndamento = 0;
    let totalDuracaoMs = 0;
    let comDuracao = 0;

    let slaCumpridos = 0;
    let slaEstourados = 0;
    let slaEmAlerta = 0;
    let slaComCalculo = 0;

    const contagemLocais: Record<string, number> = {};
    const contagemServicos: Record<string, number> = {};
    const mapaMateriais: Record<string, { especificacao: string; unidade: string; totalQtd: number; count: number }> = {};
    const mapaTecnicos: Record<string, { nome: string; total: number; sucessos: number; duracaoTotalMs: number; comDuracao: number; slaOk: number }> = {};

    listaFiltrada.forEach((r) => {
      const d = r.dados;
      if (d.sucesso) sucessos++;
      else if (d.naoRealizado) naoRealizados++;
      else emAndamento++;

      if (d.entrada && d.saida && d.saida > d.entrada) {
        totalDuracaoMs += d.saida - d.entrada;
        comDuracao++;
      }

      // Cálculo de SLA
      const infoSla = calcularStatusSla(d.entrada, d.saida, d.nivelSla || "padrao");
      if (infoSla.status !== "nao_iniciado") {
        slaComCalculo++;
        if (infoSla.status === "no_prazo") slaCumpridos++;
        else if (infoSla.status === "alerta") slaEmAlerta++;
        else if (infoSla.status === "estourado") slaEstourados++;
      }

      // Ranking do técnico
      const tec = d.lider?.trim() || "Não informado";
      if (!mapaTecnicos[tec]) {
        mapaTecnicos[tec] = { nome: tec, total: 0, sucessos: 0, duracaoTotalMs: 0, comDuracao: 0, slaOk: 0 };
      }
      mapaTecnicos[tec].total++;
      if (d.sucesso) mapaTecnicos[tec].sucessos++;
      if (infoSla.status === "no_prazo") mapaTecnicos[tec].slaOk++;
      if (d.entrada && d.saida && d.saida > d.entrada) {
        mapaTecnicos[tec].duracaoTotalMs += d.saida - d.entrada;
        mapaTecnicos[tec].comDuracao++;
      }

      // Locais
      const loc = d.local?.trim() || "Não especificado";
      contagemLocais[loc] = (contagemLocais[loc] || 0) + 1;

      // Serviços
      Object.entries(d.marcados || {}).forEach(([srv, checked]) => {
        if (checked) contagemServicos[srv] = (contagemServicos[srv] || 0) + 1;
      });
      if (d.outros && d.outrosTexto?.trim()) {
        const srv = `Outros: ${d.outrosTexto.trim()}`;
        contagemServicos[srv] = (contagemServicos[srv] || 0) + 1;
      }

      // Materiais
      d.linhas?.forEach((l) => {
        const esp = l.especificacao?.trim();
        if (esp) {
          const chave = esp.toLowerCase();
          const qtd = parseFloat(l.quantidade?.replace(",", ".")) || 1;
          if (!mapaMateriais[chave]) {
            mapaMateriais[chave] = {
              especificacao: esp,
              unidade: l.unidade || "UN",
              totalQtd: 0,
              count: 0,
            };
          }
          mapaMateriais[chave].totalQtd += qtd;
          mapaMateriais[chave].count++;
        }
      });
    });

    const taxaSucesso = total > 0 ? Math.round((sucessos / total) * 100) : 0;
    const taxaSla = slaComCalculo > 0 ? Math.round((slaCumpridos / slaComCalculo) * 100) : 100;
    const tempoMedioMs = comDuracao > 0 ? Math.round(totalDuracaoMs / comDuracao) : 0;
    const tempoMedioMin = Math.round(tempoMedioMs / 60000);
    const horasMedias = Math.floor(tempoMedioMin / 60);
    const minsMedios = tempoMedioMin % 60;
    const tempoMedioFormatado =
      comDuracao > 0 ? `${horasMedias > 0 ? `${horasMedias}h ` : ""}${minsMedios}min` : "N/A";

    const topLocais = Object.entries(contagemLocais)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topServicos = Object.entries(contagemServicos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const listaMateriais = Object.values(mapaMateriais).sort((a, b) => b.totalQtd - a.totalQtd);

    const rankingTecnicos = Object.values(mapaTecnicos).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.sucessos - a.sucessos;
    });

    return {
      total,
      sucessos,
      naoRealizados,
      emAndamento,
      taxaSucesso,
      taxaSla,
      slaCumpridos,
      slaEstourados,
      slaEmAlerta,
      tempoMedioFormatado,
      topLocais,
      topServicos,
      listaMateriais,
      rankingTecnicos,
    };
  }, [listaFiltrada]);

  const criarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoLogin.trim() || !novaSenha.trim()) return;

    const u: Usuario = {
      id: `usr-${Date.now()}`,
      nome: novoNome.trim(),
      login: novoLogin.trim().toLowerCase(),
      senha: novaSenha.trim(),
      cargo: novoCargo.trim(),
      papel: novoPapel,
      ativo: true,
    };

    onSalvarUsuario(u);
    setNovoNome("");
    setNovoLogin("");
    setNovaSenha("");
    setModalNovoUsuario(false);
  };

  const exportarCSV = () => {
    const cabecalhoCsv = [
      "ID",
      "Data/Hora",
      "Unidade",
      "Sigla",
      "Técnico / Líder",
      "Colaborador",
      "Status",
      "SLA Status",
      "Duração (min)",
      "Qtd Fotos",
      "Materiais",
      "GPS",
    ];

    const linhasCsv = listaFiltrada.map((r) => {
      const d = r.dados;
      const status = d.sucesso ? "Sucesso" : d.naoRealizado ? "Não Realizado" : "Em Andamento";
      const infoSla = calcularStatusSla(d.entrada, d.saida, d.nivelSla || "padrao");
      const duracaoMin =
        d.entrada && d.saida && d.saida > d.entrada ? Math.round((d.saida - d.entrada) / 60000) : "";
      const mats = d.linhas
        ?.filter((l) => l.especificacao?.trim())
        .map((l) => `${l.especificacao} (${l.quantidade} ${l.unidade})`)
        .join(" | ");

      return [
        `"${r.id}"`,
        `"${d.dataHora || new Date(r.atualizado).toLocaleString("pt-BR")}"`,
        `"${(d.local || "").replace(/"/g, '""')}"`,
        `"${d.sigla || ""}"`,
        `"${(d.lider || "").replace(/"/g, '""')}"`,
        `"${(d.colaborador || "").replace(/"/g, '""')}"`,
        `"${status}"`,
        `"${infoSla.texto}"`,
        `"${duracaoMin}"`,
        `"${d.fotos?.length || 0}"`,
        `"${(mats || "").replace(/"/g, '""')}"`,
        `"${d.gpsUrl || ""}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [cabecalhoCsv.join(";"), ...linhasCsv].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-aguia-power-${abaExibida}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="no-print min-h-screen bg-slate-100 pb-24 text-slate-900">
      <div className="mx-auto max-w-[1000px] px-4 pt-4">
        {/* Header Superior com Abas */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onVoltar}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                ← Meus Checklists
              </button>
              <div>
                <h1 className="text-[17px] font-bold text-slate-900">
                  Central de Gestão & Operações · Grupo Águia Power
                </h1>
                <p className="text-[11px] text-slate-500">
                  Painel executivo com SLA, produtividade, ranking e estoque
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportarCSV}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>

          {/* Abas Superiores */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {[
              { id: "metricas" as AbaNavegacao, label: "Métricas Gerais", icone: BarChart3 },
              { id: "sla" as AbaNavegacao, label: "Controle de SLA", icone: Timer },
              { id: "rankings" as AbaNavegacao, label: "Rankings da Equipe", icone: Trophy },
              { id: "estoque" as AbaNavegacao, label: "Estoque & Materiais", icone: Package },
              { id: "usuarios" as AbaNavegacao, label: "Usuários & Senhas", icone: Users },
              { id: "configuracoes" as AbaNavegacao, label: "Configurações", icone: Settings },
            ].map((aba) => {
              const Icon = aba.icone;
              const ativa = abaExibida === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAba(aba.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition ${
                    ativa
                      ? "bg-[#0b1f5c] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {aba.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Filtros (para abas analíticas) */}
        {["metricas", "sla", "rankings", "estoque"].includes(abaExibida) && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              Período:
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { id: "todos", label: "Tudo" },
                { id: "hoje", label: "Hoje" },
                { id: "7dias", label: "Últimos 7 dias" },
                { id: "30dias", label: "Últimos 30 dias" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFiltroPeriodo(p.id as any)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    filtroPeriodo === p.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {tecnicosNasFichas.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-600">Técnico:</span>
                <select
                  value={filtroTecnico}
                  onChange={(e) => setFiltroTecnico(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium outline-none"
                >
                  <option value="todos">Todos os técnicos</option>
                  {tecnicosNasFichas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ----------------- ABA 1: MÉTRICAS GERAIS ----------------- */}
        {abaExibida === "metricas" && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Atendimentos</span>
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <p className="mt-2 text-[26px] font-extrabold text-slate-800">
                  {dadosConsolidados.total}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Total no período</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Sucesso</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="mt-2 text-[26px] font-extrabold text-green-600">
                  {dadosConsolidados.taxaSucesso}%
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {dadosConsolidados.sucessos} concluídos com sucesso
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Cumprimento SLA</span>
                  <Timer className="h-4 w-4 text-blue-700" />
                </div>
                <p className="mt-2 text-[26px] font-extrabold text-blue-700">
                  {dadosConsolidados.taxaSla}%
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {dadosConsolidados.slaCumpridos} no prazo acordado
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tempo Médio</span>
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <p className="mt-2 text-[26px] font-extrabold text-purple-700">
                  {dadosConsolidados.tempoMedioFormatado}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Por atendimento concluído</p>
              </div>
            </div>

            {/* Gráficos de Unidades e Serviços */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Unidades com Mais Atendimentos
                </h2>
                {dadosConsolidados.topLocais.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-slate-400">Nenhum dado encontrado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dadosConsolidados.topLocais.map(([loc, qtd]) => {
                      const pct = Math.round((qtd / (dadosConsolidados.total || 1)) * 100);
                      return (
                        <div key={loc}>
                          <div className="flex justify-between text-[12px] font-medium text-slate-700">
                            <span className="truncate pr-2">{loc}</span>
                            <span className="font-bold text-slate-900">
                              {qtd} ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-[#0b1f5c]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  Serviços Mais Realizados
                </h2>
                {dadosConsolidados.topServicos.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-slate-400">Nenhum serviço registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {dadosConsolidados.topServicos.map(([srv, qtd]) => (
                      <div
                        key={srv}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[12px]"
                      >
                        <span className="truncate font-medium text-slate-700 pr-2">{srv}</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-800">
                          {qtd}x
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ----------------- ABA 2: CONTROLE DE SLA ----------------- */}
        {abaExibida === "sla" && (
          <div className="space-y-5">
            {/* Cards de SLA */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-green-50 p-4 border border-green-200">
                <p className="text-[11px] font-bold uppercase text-green-700">No Prazo (SLA OK)</p>
                <p className="mt-2 text-[26px] font-extrabold text-green-800">
                  {dadosConsolidados.slaCumpridos}
                </p>
                <p className="text-[11px] text-green-600">Dentro do tempo acordado</p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                <p className="text-[11px] font-bold uppercase text-amber-700">Em Alerta (&gt;75%)</p>
                <p className="mt-2 text-[26px] font-extrabold text-amber-800">
                  {dadosConsolidados.slaEmAlerta}
                </p>
                <p className="text-[11px] text-amber-600">Próximos do limite</p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
                <p className="text-[11px] font-bold uppercase text-red-700">SLA Estourado</p>
                <p className="mt-2 text-[26px] font-extrabold text-red-800">
                  {dadosConsolidados.slaEstourados}
                </p>
                <p className="text-[11px] text-red-600">Tempo limite ultrapassado</p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
                <p className="text-[11px] font-bold uppercase text-blue-700">Índice Geral SLA</p>
                <p className="mt-2 text-[26px] font-extrabold text-blue-800">
                  {dadosConsolidados.taxaSla}%
                </p>
                <p className="text-[11px] text-blue-600">Meta recomendada: 90%</p>
              </div>
            </div>

            {/* Regras e Metas de SLA vigentes */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <h2 className="mb-2 text-[14px] font-bold text-slate-800">
                Tabela de Prazos de SLA da Águia Power
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                {Object.values(REGRAS_SLA).map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-2.5 bg-slate-50">
                    <span className="text-[12px] font-bold text-slate-800">{r.rotulo}</span>
                    <p className="text-[15px] font-extrabold text-[#0b1f5c] mt-0.5">
                      {r.horasLimite} horas
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{r.descricao}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista com status de SLA por chamado */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <h2 className="mb-3 text-[14px] font-bold text-slate-800">
                Chamados e Monitoramento de Prazos ({listaFiltrada.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Unidade</th>
                      <th className="pb-2">Técnico</th>
                      <th className="pb-2">Entrada</th>
                      <th className="pb-2">Tempo Gasto</th>
                      <th className="pb-2">Status SLA</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listaFiltrada.map((r) => {
                      const d = r.dados;
                      const sla = calcularStatusSla(d.entrada, d.saida, d.nivelSla || "padrao");
                      const durMin = Math.round(sla.tempoGastoMs / 60000);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-800">{d.local || "Sem local"}</td>
                          <td className="py-2.5 text-slate-600">{d.lider || "—"}</td>
                          <td className="py-2.5 text-slate-500">
                            {d.entrada ? new Date(d.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-2.5 tabular-nums font-semibold text-slate-700">
                            {d.entrada ? `${Math.floor(durMin / 60)}h ${durMin % 60}m` : "Não iniciado"}
                          </td>
                          <td className="py-2.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sla.badgeCor}`}>
                              {sla.texto}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => onAbrirFicha(r.id)}
                              className="cursor-pointer font-bold text-blue-600 hover:underline"
                            >
                              Abrir OS
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- ABA 3: RANKINGS DA EQUIPE ----------------- */}
        {abaExibida === "rankings" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Ranking de Produtividade dos Técnicos
                </h2>
                <p className="text-[12px] text-slate-500">
                  Desempenho por volume, taxa de sucesso e pontualidade no SLA
                </p>
              </div>
            </div>

            {dadosConsolidados.rankingTecnicos.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-400">Nenhum atendimento registrado no período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2 text-center w-12">Pos.</th>
                      <th className="pb-2">Técnico</th>
                      <th className="pb-2 text-center">Atendimentos</th>
                      <th className="pb-2 text-center">Taxa de Sucesso</th>
                      <th className="pb-2 text-center">Cumprimento SLA</th>
                      <th className="pb-2 text-right">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dadosConsolidados.rankingTecnicos.map((tec, idx) => {
                      const medalha = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`;
                      const pctSucesso = tec.total > 0 ? Math.round((tec.sucessos / tec.total) * 100) : 0;
                      const pctSla = tec.total > 0 ? Math.round((tec.slaOk / tec.total) * 100) : 100;
                      const tMedioMin = tec.comDuracao > 0 ? Math.round(tec.duracaoTotalMs / tec.comDuracao / 60000) : 0;

                      return (
                        <tr key={tec.nome} className="hover:bg-slate-50">
                          <td className="py-3 text-center font-bold text-[15px]">{medalha}</td>
                          <td className="py-3 font-bold text-slate-800">
                            {tec.nome}
                          </td>
                          <td className="py-3 text-center font-extrabold text-blue-700">{tec.total}</td>
                          <td className="py-3 text-center">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
                              {pctSucesso}%
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                              {pctSla}%
                            </span>
                          </td>
                          <td className="py-3 text-right tabular-nums font-semibold text-slate-600">
                            {tMedioMin > 0 ? `${Math.floor(tMedioMin / 60)}h ${tMedioMin % 60}m` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------- ABA 4: ESTOQUE & MATERIAIS ----------------- */}
        {abaExibida === "estoque" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Consumo de Materiais em Campo
                </h2>
                <p className="text-[12px] text-slate-500">
                  Soma consolidada de todos os materiais preenchidos pelos técnicos no verso das fichas
                </p>
              </div>
            </div>

            {dadosConsolidados.listaMateriais.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-400">
                Nenhum material preenchido nas fichas do período selecionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Material / Especificação</th>
                      <th className="pb-2 text-center">Total Gasto</th>
                      <th className="pb-2 text-center">Unidade</th>
                      <th className="pb-2 text-right">OS com Uso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dadosConsolidados.listaMateriais.map((mat) => (
                      <tr key={mat.especificacao} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-800">{mat.especificacao}</td>
                        <td className="py-2.5 text-center font-extrabold text-[#0b1f5c]">
                          {mat.totalQtd}
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-500">
                          {mat.unidade}
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-600">
                          {mat.count} chamados
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------- ABA 5: USUÁRIOS & SENHAS ----------------- */}
        {abaExibida === "usuarios" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Gestão de Usuários & Senhas da Equipe
                </h2>
                <p className="text-[12px] text-slate-500">
                  Técnicos e gestores cadastrados para login e assinatura automática
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoUsuario(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0b1f5c] px-3.5 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-blue-900 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Novo Usuário
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                      {u.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                        {u.nome}
                        {u.papel === "gestor" ? (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                            👑 Gestor
                          </span>
                        ) : (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            🔧 Técnico
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Login: <strong className="text-slate-700">{u.login}</strong> · Senha: <strong className="text-slate-700">{u.senha}</strong> · Cargo: {u.cargo}
                      </p>
                    </div>
                  </div>

                  {usuarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onExcluirUsuario(u.id)}
                      className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Excluir usuário"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Modal de Cadastro de Usuário */}
            {modalNovoUsuario && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                  <h3 className="text-[16px] font-bold text-slate-900">Cadastrar Novo Usuário</h3>
                  <form onSubmit={criarUsuario} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Nome Completo
                      </label>
                      <input
                        required
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-[13px] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Usuário / Login
                      </label>
                      <input
                        required
                        value={novoLogin}
                        onChange={(e) => setNovoLogin(e.target.value)}
                        placeholder="Ex: joao"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-[13px] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Senha
                      </label>
                      <input
                        required
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Senha de acesso"
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-[13px] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Cargo
                      </label>
                      <input
                        value={novoCargo}
                        onChange={(e) => setNovoCargo(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-[13px] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Perfil de Acesso
                      </label>
                      <select
                        value={novoPapel}
                        onChange={(e) => setNovoPapel(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-[13px] outline-none"
                      >
                        <option value="tecnico">🔧 Técnico (Somente Checklists & Ordens)</option>
                        <option value="gestor">👑 Gestor (Acesso Total ao Painel & Estoque)</option>
                      </select>
                    </div>

                    <div className="mt-5 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setModalNovoUsuario(false)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#0b1f5c] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-blue-900"
                      >
                        Salvar Usuário
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- ABA 6: CONFIGURAÇÕES ----------------- */}
        {abaExibida === "configuracoes" && (
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              Configurações do Sistema Águia Power
            </h2>

            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <h3 className="font-bold text-[13px] text-slate-800">Dados da Empresa no PDF</h3>
              <p className="text-[12px] text-slate-600 mt-1">
                <strong>Empresa:</strong> GCR Sistemas de Segurança / Águia Power<br />
                <strong>CNPJ:</strong> 44.683.082/0001-91<br />
                <strong>E-mail de Contato:</strong> paola.contato@gmail.com
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <h3 className="font-bold text-[13px] text-slate-800">Banco de Dados em Nuvem</h3>
              <p className="text-[12px] text-green-700 font-semibold mt-1">
                ● Firebase Firestore Conectado e Sincronizando em Tempo Real
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Todas as fichas, fotos e alterações são replicadas instantaneamente para a coordenação.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
