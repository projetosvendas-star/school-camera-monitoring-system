export const OCCURRENCE_TYPES = [
  { value: "camera_offline", label: "Câmera Offline", icon: "📹", color: "red" },
  { value: "camera_danificada", label: "Câmera Danificada", icon: "🔧", color: "orange" },
  { value: "vandalismo", label: "Vandalismo", icon: "⚠️", color: "red" },
  { value: "intrusos", label: "Presença de Intrusos", icon: "🚨", color: "red" },
  { value: "uso_inadequado", label: "Uso Inadequado do Espaço", icon: "⛔", color: "amber" },
  { value: "iluminacao_deficiente", label: "Iluminação Deficiente", icon: "💡", color: "yellow" },
  { value: "seguranca_perimetral", label: "Portão/Cerca Danificados", icon: "🏗️", color: "orange" },
  { value: "incidente_alunos", label: "Incidente com Alunos", icon: "👨‍🎓", color: "red" },
  { value: "ocorrencia_policial", label: "Ocorrência Policial", icon: "🚔", color: "red" },
  { value: "desordem", label: "Desordem nas Dependências", icon: "🧹", color: "amber" },
  { value: "alarme_acionado", label: "Alarme Acionado", icon: "🔔", color: "yellow" },
  { value: "pessoa_ferida", label: "Pessoa Ferida", icon: "🏥", color: "red" },
  { value: "objeto_suspeito", label: "Objeto Suspeito", icon: "📦", color: "orange" },
  { value: "falha_sistema", label: "Falha no Sistema de Monitoramento", icon: "🖥️", color: "orange" },
  { value: "outros", label: "Outros", icon: "📋", color: "gray" },
];

export function getOccurrenceLabel(value: string): string {
  return OCCURRENCE_TYPES.find((o) => o.value === value)?.label || value;
}

export function getOccurrenceIcon(value: string): string {
  return OCCURRENCE_TYPES.find((o) => o.value === value)?.icon || "📋";
}

export function getOccurrenceColor(value: string): string {
  return OCCURRENCE_TYPES.find((o) => o.value === value)?.color || "gray";
}
