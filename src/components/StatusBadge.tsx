const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  aberto: { label: "Aberto", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  em_analise: { label: "Em Análise", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  fechado: { label: "Fechado", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  aguardando: { label: "Aguardando", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  online: { label: "Online", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  offline: { label: "Offline", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  manutencao: { label: "Manutenção", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  media: { label: "Média", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
