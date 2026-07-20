"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
  type: string;
}

interface Camera {
  id: string;
  name: string;
  location: string | null;
  status: string;
  schoolId: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    schoolId: "",
    cameraId: "",
    title: "",
    description: "",
    priority: "media",
  });

  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => setSchools(data.schools || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.schoolId) {
      fetch(`/api/cameras?schoolId=${form.schoolId}`)
        .then((res) => res.json())
        .then((data) => setCameras(data.cameras || []))
        .catch(console.error);
    } else {
      setCameras([]);
    }
  }, [form.schoolId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
        <p className="text-sm text-gray-500">
          Registre um problema ou situação nas câmeras de monitoramento
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Escola *
            </label>
            <select
              value={form.schoolId}
              onChange={(e) =>
                setForm({ ...form, schoolId: e.target.value, cameraId: "" })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

          {cameras.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Câmera (opcional)
              </label>
              <select
                value={form.cameraId}
                onChange={(e) =>
                  setForm({ ...form, cameraId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecione a câmera</option>
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.name} - {cam.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Câmera offline no pátio"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Descrição *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Descreva detalhadamente o problema ou situação observada..."
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Prioridade
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { value: "baixa", label: "Baixa", color: "gray" },
                { value: "media", label: "Média", color: "blue" },
                { value: "alta", label: "Alta", color: "orange" },
                { value: "critica", label: "Crítica", color: "red" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    form.priority === p.value
                      ? `border-${p.color}-500 bg-${p.color}-50 text-${p.color}-700`
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
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
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Chamado"}
          </button>
        </div>
      </form>
    </div>
  );
}
