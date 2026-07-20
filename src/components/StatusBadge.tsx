const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  aberto: { label: "Aberto", color: "text-blue-700", bg: "bg-blue-100" },
  em_analise: {
    label: "Em Análise",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  fechado: { label: "Fechado", color: "text-green-700", bg: "bg-green-100" },
  aguardando: {
    label: "Aguardando",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  online: { label: "Online", color: "text-green-700", bg: "bg-green-100" },
  offline: { label: "Offline", color: "text-red-700", bg: "bg-red-100" },
  manutencao: {
    label: "Manutenção",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  baixa: { label: "Baixa", color: "text-gray-700", bg: "bg-gray-100" },
  media: { label: "Média", color: "text-blue-700", bg: "bg-blue-100" },
  alta: { label: "Alta", color: "text-orange-700", bg: "bg-orange-100" },
  critica: { label: "Crítica", color: "text-red-700", bg: "bg-red-100" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${config.bg}`}
    >
      {config.label}
    </span>
  );
}
