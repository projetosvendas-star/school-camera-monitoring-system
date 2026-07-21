"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OCCURRENCE_TYPES } from "@/lib/occurrences";

interface School {
  id: string;
  name: string;
  type: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    schoolId: "",
    occurrenceType: "",
    description: "",
    priority: "media",
  });

  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => setSchools(data.schools || []))
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const school = schools.find((s) => s.id === form.schoolId);
      const occ = OCCURRENCE_TYPES.find((o) => o.value === form.occurrenceType);
      const autoTitle = `${occ?.label || "Ocorrência"} - ${school?.name || "Escola"}`;

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: autoTitle }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar chamado");
        return;
      }

      router.push(`/tickets/${data.ticket.id}`);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
        <p className="text-sm text-gray-500">
          Registre uma ocorrência nas câmeras de monitoramento
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-6 shadow-sm"
      >
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Escola *
            </label>
            <select
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="input-modern"
              required
            >
              <option value="">Selecione a escola</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  [{school.type}] {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Tipo de Ocorrência *
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {OCCURRENCE_TYPES.map((occ) => (
                <button
                  key={occ.value}
                  type="button"
                  onClick={() => setForm({ ...form, occurrenceType: occ.value })}
                  className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all ${
                    form.occurrenceType === occ.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{occ.icon}</span>
                  <span>{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Descrição *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              className="input-modern"
              placeholder="Descreva detalhadamente a ocorrência observada..."
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Prioridade
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { value: "baixa", label: "Baixa", bg: "bg-gray-100 text-gray-700 border-gray-300", active: "bg-gray-600 text-white border-gray-600" },
                { value: "media", label: "Média", bg: "bg-blue-50 text-blue-700 border-blue-300", active: "bg-blue-600 text-white border-blue-600" },
                { value: "alta", label: "Alta", bg: "bg-orange-50 text-orange-700 border-orange-300", active: "bg-orange-600 text-white border-orange-600" },
                { value: "critica", label: "Crítica", bg: "bg-red-50 text-red-700 border-red-300", active: "bg-red-600 text-white border-red-600" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                    form.priority === p.value ? p.active : p.bg
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.occurrenceType}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Chamado"}
          </button>
        </div>
      </form>
    </div>
  );
}
