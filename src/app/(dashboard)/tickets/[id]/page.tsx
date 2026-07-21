"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import StatusBadge from "@/components/StatusBadge";
import { getOccurrenceLabel, getOccurrenceIcon } from "@/lib/occurrences";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  schoolId: string;
  cameraId: string | null;
  occurrence_type: string | null;
  taticoParecer: string | null;
  adminParecer: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  comment: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
  userName: string;
  userRole: string;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [taticoParecer, setTaticoParecer] = useState("");
  const [adminParecer, setAdminParecer] = useState("");
  const [comment, setComment] = useState("");

  function fetchData() {
    Promise.all([
      fetch(`/api/tickets/${id}`).then((r) => r.json()),
      fetch(`/api/tickets/${id}/history`).then((r) => r.json()),
    ])
      .then(([ticketData, historyData]) => {
        setTicket(ticketData.ticket);
        setHistory(historyData.history || []);
        if (ticketData.ticket?.taticoParecer) {
          setTaticoParecer(ticketData.ticket.taticoParecer);
        }
        if (ticketData.ticket?.adminParecer) {
          setAdminParecer(ticketData.ticket.adminParecer);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function handleAction(
    action: "em_analise" | "fechado" | "aguardando",
    extraData?: Record<string, string>
  ) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          comment,
          ...extraData,
        }),
      });

      if (res.ok) {
        fetchData();
        setComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Chamado não encontrado</p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    tecnico_monitoramento: "Técnico",
    tatico: "Tático",
    administrativo: "Administrativo",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-400">
              {ticket.ticketNumber}
            </span>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900">
            {ticket.title}
          </h1>
          {ticket.occurrence_type && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
              <span>{getOccurrenceIcon(ticket.occurrence_type)}</span>
              <span>{getOccurrenceLabel(ticket.occurrence_type)}</span>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Criado em{" "}
            {new Date(ticket.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Descrição
            </h2>
            <p className="whitespace-pre-wrap text-sm text-gray-600">
              {ticket.description}
            </p>
          </div>

          {/* Tático Parecer */}
          {ticket.taticoParecer && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-yellow-800">
                📋 Parecer Tático
              </h2>
              <p className="whitespace-pre-wrap text-sm text-yellow-700">
                {ticket.taticoParecer}
              </p>
            </div>
          )}

          {/* Admin Parecer */}
          {ticket.adminParecer && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-green-800">
                ✅ Parecer Administrativo
              </h2>
              <p className="whitespace-pre-wrap text-sm text-green-700">
                {ticket.adminParecer}
              </p>
            </div>
          )}

          {/* Actions based on role */}
          {ticket.status !== "fechado" && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                Ações
              </h2>

              {/* Comment field */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Comentário
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Adicione um comentário..."
                />
              </div>

              {/* Técnico: can send to Tático */}
              {user?.role === "tecnico_monitoramento" &&
                ticket.status === "aberto" && (
                  <button
                    onClick={() => handleAction("em_analise")}
                    disabled={actionLoading}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Enviando..."
                      : "Enviar para Análise Tática"}
                  </button>
                )}

              {/* Tático: provide parecer */}
              {user?.role === "tatico" &&
                (ticket.status === "em_analise" || ticket.status === "aguardando") && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Parecer Tático
                      </label>
                      <textarea
                        value={taticoParecer}
                        onChange={(e) => setTaticoParecer(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Descreva a identificação e avaliação do problema..."
                      />
                    </div>
                    <button
                      onClick={() =>
                        handleAction("em_analise", { taticoParecer })
                      }
                      disabled={actionLoading || !taticoParecer}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Enviando..."
                        : "Emitir Parecer e Enviar ao Administrativo"}
                    </button>
                  </div>
                )}

              {/* Administrativo: close or set waiting */}
              {user?.role === "administrativo" &&
                (ticket.status === "em_analise" ||
                  ticket.status === "aguardando") && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Parecer Administrativo
                      </label>
                      <textarea
                        value={adminParecer}
                        onChange={(e) => setAdminParecer(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Descreva a resolução ou providências tomadas..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleAction("fechado", { adminParecer })
                        }
                        disabled={actionLoading}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading ? "Fechando..." : "✅ Fechar Chamado (Solução)"}
                      </button>
                      <button
                        onClick={() =>
                          handleAction("aguardando", { adminParecer })
                        }
                        disabled={actionLoading}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Salvando..."
                          : "⏳ Aguardar Direção Escolar"}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* History */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              Histórico
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum registro</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex gap-3 border-l-2 border-blue-200 pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {entry.action}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {roleLabels[entry.userRole] || entry.userRole}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="mt-1 text-xs text-gray-500">
                          {entry.comment}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-gray-400">
                        {entry.userName} •{" "}
                        {new Date(entry.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Informações
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={ticket.status} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Prioridade</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={ticket.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Criado em</dt>
                <dd className="mt-0.5 font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              {ticket.closedAt && (
                <div>
                  <dt className="text-gray-500">Fechado em</dt>
                  <dd className="mt-0.5 font-medium">
                    {new Date(ticket.closedAt).toLocaleDateString("pt-BR")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Workflow Info */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Fluxo de Trabalho
            </h2>
            <div className="space-y-2">
              {[
                {
                  step: "1",
                  label: "Técnico abre chamado",
                  active: ticket.status === "aberto",
                  done: true,
                },
                {
                  step: "2",
                  label: "Tático analisa",
                  active: ticket.status === "em_analise",
                  done:
                    ticket.status === "fechado" ||
                    ticket.status === "aguardando",
                },
                {
                  step: "3",
                  label: "Administrativo fecha",
                  active: false,
                  done: ticket.status === "fechado",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    item.active
                      ? "bg-blue-50 text-blue-700"
                      : item.done
                        ? "bg-green-50 text-green-700"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      item.active
                        ? "bg-blue-600 text-white"
                        : item.done
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {item.done ? "✓" : item.step}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
