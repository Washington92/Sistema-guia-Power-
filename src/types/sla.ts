export type NivelSla = "urgente" | "padrao" | "preventiva" | "planejada";

export interface SlaConfig {
  id: NivelSla;
  rotulo: string;
  horasLimite: number;
  descricao: string;
  cor: string;
}

export const REGRAS_SLA: Record<NivelSla, SlaConfig> = {
  urgente: {
    id: "urgente",
    rotulo: "Urgente (Crítico)",
    horasLimite: 2,
    descricao: "Parada total de CFTV, Wi-Fi ou sistema vital",
    cor: "text-red-600 bg-red-50 border-red-200",
  },
  padrao: {
    id: "padrao",
    rotulo: "Padrão (Atendimento Normal)",
    horasLimite: 4,
    descricao: "Manutenção corretiva e chamados normais",
    cor: "text-blue-600 bg-blue-50 border-blue-200",
  },
  preventiva: {
    id: "preventiva",
    rotulo: "Preventiva / Visita",
    horasLimite: 8,
    descricao: "Organização de rack, retrofits e vistorias",
    cor: "text-purple-600 bg-purple-50 border-purple-200",
  },
  planejada: {
    id: "planejada",
    rotulo: "Planejada (Projeto)",
    horasLimite: 24,
    descricao: "Instalações de grande porte ou desmobilização",
    cor: "text-slate-600 bg-slate-50 border-slate-200",
  },
};

export type StatusSla = "no_prazo" | "alerta" | "estourado" | "nao_iniciado";

export function calcularStatusSla(
  entrada?: number | null,
  saida?: number | null,
  nivel: NivelSla = "padrao"
): {
  status: StatusSla;
  texto: string;
  tempoGastoMs: number;
  tempoLimiteMs: number;
  percentualGasto: number;
  badgeCor: string;
} {
  const limiteMs = (REGRAS_SLA[nivel]?.horasLimite || 4) * 60 * 60 * 1000;

  if (!entrada) {
    return {
      status: "nao_iniciado",
      texto: "Não iniciado",
      tempoGastoMs: 0,
      tempoLimiteMs: limiteMs,
      percentualGasto: 0,
      badgeCor: "bg-slate-100 text-slate-600",
    };
  }

  const fim = saida || Date.now();
  const gastoMs = Math.max(0, fim - entrada);
  const percentual = Math.round((gastoMs / limiteMs) * 100);

  if (saida) {
    // Atendimento concluído
    const cumpriu = gastoMs <= limiteMs;
    return {
      status: cumpriu ? "no_prazo" : "estourado",
      texto: cumpriu ? "SLA Cumprido" : "SLA Estourado",
      tempoGastoMs: gastoMs,
      tempoLimiteMs: limiteMs,
      percentualGasto: percentual,
      badgeCor: cumpriu ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
    };
  }

  // Em andamento
  if (percentual >= 100) {
    return {
      status: "estourado",
      texto: "SLA Estourado",
      tempoGastoMs: gastoMs,
      tempoLimiteMs: limiteMs,
      percentualGasto: percentual,
      badgeCor: "bg-red-100 text-red-700 animate-pulse",
    };
  } else if (percentual >= 75) {
    return {
      status: "alerta",
      texto: "SLA em Alerta (>75%)",
      tempoGastoMs: gastoMs,
      tempoLimiteMs: limiteMs,
      percentualGasto: percentual,
      badgeCor: "bg-amber-100 text-amber-700",
    };
  }

  return {
    status: "no_prazo",
    texto: "Dentro do SLA",
    tempoGastoMs: gastoMs,
    tempoLimiteMs: limiteMs,
    percentualGasto: percentual,
    badgeCor: "bg-green-100 text-green-700",
  };
}
