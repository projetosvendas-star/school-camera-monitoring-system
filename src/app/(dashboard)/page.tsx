"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { OCCURRENCE_TYPES, getOccurrenceLabel } from "@/lib/occurrences";

interface Stats {
  schools: number;
  cameras: { total: number; online: number; offline: number; maintenance: number };
  tickets: { total: number; aberto: number; emAnalise: number; fechado: number; aguardando: number };
  occurrenceStats: Record<string, number>;
  schoolOccurrences: Record<string, { name: string; count: number; types: Record<string, number> }>;
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!stats) return null;



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h1 className="text-2xl font-extrabold">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-blue-100">
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
        <div className="glass-card group rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Escolas</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{stats.schools}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl transition-transform group-hover:scale-110">🏫</div>
          </div>
        </div>

        <div className="glass-card group rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Chamados</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{stats.tickets.total}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {stats.tickets.aberto > 0 && (
                  <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">{stats.tickets.aberto} abertos</span>
                )}
                {stats.tickets.aguardando > 0 && (
                  <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">{stats.tickets.aguardando} aguardando</span>
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl transition-transform group-hover:scale-110">🎫</div>
          </div>
        </div>

        <div className="glass-card group rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Relatórios Hoje</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{stats.todayReports.total}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600">{stats.todayReports.normal} normal</span>
                {stats.todayReports.irregular > 0 && (
                  <span className="text-xs font-semibold text-red-500">{stats.todayReports.irregular} irregular</span>
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl transition-transform group-hover:scale-110">📋</div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="glass-card rounded-2xl p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">Chamados Recentes</h2>
            <Link href="/tickets" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Ver todos →</Link>
          </div>
          {stats.recentTickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum chamado encontrado</p>
          ) : (
            <div className="space-y-2">
              {stats.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{ticket.title}</p>
                    <p className="text-xs text-gray-400">{ticket.schoolName} • {ticket.ticketNumber}</p>
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

      {/* Quick Actions */}
      {user?.role === "administrativo" && (
        <>
          {/* Ocorrências por Tipo */}
          {Object.keys(stats.occurrenceStats).length > 0 && (
            <div className="glass-card rounded-2xl p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-800">Ocorrências por Tipo</h2>
              <div className="space-y-3">
                {Object.entries(stats.occurrenceStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const total = Object.values(stats.occurrenceStats).reduce((s, v) => s + v, 0);
                    const pct = Math.round((count / total) * 100);
                    const occ = OCCURRENCE_TYPES.find((o) => o.value === type);
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-6 text-center text-lg">{occ?.icon || "📋"}</span>
                        <span className="w-44 text-sm font-medium text-gray-700 truncate">{getOccurrenceLabel(type)}</span>
                        <div className="flex-1">
                          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm font-bold text-gray-700">{count}</span>
                        <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Ocorrências por Escola */}
          {Object.keys(stats.schoolOccurrences).length > 0 && (
            <div className="glass-card rounded-2xl p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-800">Ocorrências por Escola</h2>
              <div className="space-y-4">
                {Object.entries(stats.schoolOccurrences)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 10)
                  .map(([schoolId, data]) => {
                    const maxCount = Math.max(...Object.values(stats.schoolOccurrences).map((s) => s.count));
                    const pct = Math.round((data.count / maxCount) * 100);
                    return (
                      <div key={schoolId}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">{data.name}</span>
                          <span className="text-sm font-bold text-gray-500">{data.count} ocorrência{data.count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(data.types).map(([type, count]) => (
                            <span key={type} className="inline-flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              {OCCURRENCE_TYPES.find((o) => o.value === type)?.icon} {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="glass-card rounded-2xl p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-800">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {user?.role === "tecnico_monitoramento" && (
            <>
              <Link href="/tickets/new" className="flex items-center gap-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">➕</span>
                <div>
                  <p className="text-sm font-bold text-blue-800">Novo Chamado</p>
                  <p className="text-[11px] text-blue-500">Reportar problema</p>
                </div>
              </Link>
              <Link href="/daily-reports" className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">📋</span>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Relatório Diário</p>
                  <p className="text-[11px] text-emerald-500">Registrar monitoramento</p>
                </div>
              </Link>
            </>
          )}
          <Link href="/tickets" className="flex items-center gap-3 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg">🎫</span>
            <div>
              <p className="text-sm font-bold text-purple-800">Ver Chamados</p>
              <p className="text-[11px] text-purple-500">Acompanhar chamados</p>
            </div>
          </Link>
          {user?.role === "administrativo" && (
            <Link href="/reports" className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg">📄</span>
              <div>
                <p className="text-sm font-bold text-indigo-800">Relatórios PDF</p>
                <p className="text-[11px] text-indigo-500">Gerar relatórios</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
