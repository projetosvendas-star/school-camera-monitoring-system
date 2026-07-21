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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!stats) return null;

  const cameraTotal = stats.cameras.total || 1;
  const onlinePercent = Math.round((stats.cameras.online / cameraTotal) * 100);

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
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Câmeras</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{stats.cameras.total}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600">{stats.cameras.online} online</span>
                <span className="text-xs font-semibold text-red-500">{stats.cameras.offline} offline</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl transition-transform group-hover:scale-110">📹</div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${onlinePercent}%` }} />
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-gray-400">{onlinePercent}% online</p>
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

      {/* Camera Status + Recent Tickets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-800">Status das Câmeras</h2>
          <div className="space-y-4">
            {[
              { label: "Online", count: stats.cameras.online, color: "bg-emerald-500" },
              { label: "Offline", count: stats.cameras.offline, color: "bg-red-500" },
              { label: "Manutenção", count: stats.cameras.maintenance, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <span className="w-24 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / cameraTotal) * 100}%` }} />
                  </div>
                </div>
                <span className="w-8 text-right text-sm font-bold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

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
      </div>

      {/* Quick Actions */}
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
          <Link href="/cameras" className="flex items-center gap-3 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">📹</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Câmeras</p>
              <p className="text-[11px] text-amber-500">Status das câmeras</p>
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
