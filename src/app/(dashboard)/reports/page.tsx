"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("tickets");
  const [statusFilter, setStatusFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!dateFrom || !dateTo) {
      setError("Selecione o período");
      return;
    }

    setError("");
    setGenerating(true);

    try {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        type: reportType,
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/reports/pdf?${params}`);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao gerar relatório");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_${reportType}_${dateFrom}_${dateTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  }

  // Quick date ranges
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(end.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios PDF</h1>
        <p className="text-sm text-gray-500">
          Gere relatórios detalhados por período
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tipo de Relatório
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportType("tickets")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    reportType === "tickets"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">🎫</span>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    Chamados
                  </p>
                  <p className="text-xs text-gray-500">
                    Relatório de chamados abertos/fechados
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("daily")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    reportType === "daily"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">📋</span>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    Monitoramento Diário
                  </p>
                  <p className="text-xs text-gray-500">
                    Relatórios diários de monitoramento
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Ranges */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Período Rápido
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "7 dias", days: 7 },
                  { label: "15 dias", days: 15 },
                  { label: "30 dias", days: 30 },
                  { label: "90 dias", days: 90 },
                ].map((range) => (
                  <button
                    key={range.days}
                    type="button"
                    onClick={() => setQuickRange(range.days)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    Últimos {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status filter for tickets */}
            {reportType === "tickets" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Filtrar por Status (opcional)
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="aberto">Aberto</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="fechado">Fechado</option>
                  <option value="aguardando">Aguardando</option>
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !dateFrom || !dateTo}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Gerando PDF...
              </span>
            ) : (
              "📄 Gerar Relatório PDF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
