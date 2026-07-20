"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

interface Stats {
  schools: number;
  cameras: { total: number; online: number; offline: number; maintenance: number };
  tickets: { total: number; aberto: number; emAnalise: number; fechado: number; aguardando: number };
  todayReports: { total: number; normal: number; irregular: number };
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    schoolName: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!stats) return null;

  const cameraTotal = stats.cameras.total || 1;
  const onlinePercent = Math.round(
    (stats.cameras.online / cameraTotal) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard de Monitoramento
        </h1>
        <p className="text-sm text-gray-500">
          Bem-vindo, {user?.name} •{" "}
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Schools */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Escolas</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.schools}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              🏫
            </div>
          </div>
        </div>

        {/* Cameras */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Câmeras</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.cameras.total}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-green-600">
                  {stats.cameras.online} online
                </span>
                <span className="text-xs text-red-600">
                  {stats.cameras.offline} offline
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
              📹
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${onlinePercent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-gray-400">
              {onlinePercent}% online
            </p>
          </div>
        </div>

        {/* Tickets */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chamados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.tickets.total}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {stats.tickets.aberto > 0 && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                    {stats.tickets.aberto} abertos
                  </span>
                )}
                {stats.tickets.aguardando > 0 && (
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                    {stats.tickets.aguardando} aguardando
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
              🎫
            </div>
          </div>
        </div>

        {/* Daily Reports */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Relatórios Hoje
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.todayReports.total}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-green-600">
                  {stats.todayReports.normal} normal
                </span>
                {stats.todayReports.irregular > 0 && (
                  <span className="text-xs text-red-600">
                    {stats.todayReports.irregular} irregular
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              📋
            </div>
          </div>
        </div>
      </div>

      {/* Camera Status Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Status das Câmeras
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {stats.cameras.online}
                </span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(stats.cameras.online / cameraTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {stats.cameras.offline}
                </span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${(stats.cameras.offline / cameraTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">Manutenção</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {stats.cameras.maintenance}
                </span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-yellow-500"
                    style={{
                      width: `${(stats.cameras.maintenance / cameraTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Chamados Recentes
            </h2>
            <Link
              href="/tickets"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos →
            </Link>
          </div>
          {stats.recentTickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Nenhum chamado encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ticket.schoolName} • {ticket.ticketNumber}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <StatusBadge status={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {user?.role === "tecnico_monitoramento" && (
            <>
              <Link
                href="/tickets/new"
                className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Novo Chamado
                  </p>
                  <p className="text-xs text-blue-600">
                    Reportar problema nas câmeras
                  </p>
                </div>
              </Link>
              <Link
                href="/daily-reports"
                className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 p-4 transition-colors hover:bg-green-100"
              >
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Relatório Diário
                  </p>
                  <p className="text-xs text-green-600">
                    Registrar monitoramento do dia
                  </p>
                </div>
              </Link>
            </>
          )}
          <Link
            href="/tickets"
            className="flex items-center gap-3 rounded-lg border border-purple-100 bg-purple-50 p-4 transition-colors hover:bg-purple-100"
          >
            <span className="text-2xl">🎫</span>
            <div>
              <p className="text-sm font-medium text-purple-800">
                Ver Chamados
              </p>
              <p className="text-xs text-purple-600">
                Acompanhar todos os chamados
              </p>
            </div>
          </Link>
          <Link
            href="/cameras"
            className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
          >
            <span className="text-2xl">📹</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Câmeras</p>
              <p className="text-xs text-amber-600">
                Visualizar status das câmeras
              </p>
            </div>
          </Link>
          {user?.role === "administrativo" && (
            <Link
              href="/reports"
              className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 transition-colors hover:bg-indigo-100"
            >
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm font-medium text-indigo-800">
                  Relatórios PDF
                </p>
                <p className="text-xs text-indigo-600">
                  Gerar relatórios por período
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
