"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface School {
  id: string;
  name: string;
  type: string;
}

interface Camera {
  id: string;
  name: string;
  status: string;
  schoolId: string;
}

interface DailyReport {
  id: string;
  reportDate: string;
  isNormal: boolean;
  observations: string | null;
  camerasOnline: number;
  camerasOffline: number;
  camerasMaintenance: number;
  schoolName: string;
  schoolType: string;
  technicianName: string;
}

export default function DailyReportsPage() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    schoolId: "",
    isNormal: true,
    observations: "",
    camerasOnline: 0,
    camerasOffline: 0,
    camerasMaintenance: 0,
  });

  function fetchReports() {
    setLoading(true);
    fetch("/api/daily-reports")
      .then((res) => res.json())
      .then((data) => setReports(data.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => setSchools(data.schools || []))
      .catch(console.error);

    fetchReports();
  }, []);

  useEffect(() => {
    if (form.schoolId) {
      fetch(`/api/cameras?schoolId=${form.schoolId}`)
        .then((res) => res.json())
        .then((data) => {
          const cams = data.cameras || [];
          setForm((f) => ({
            ...f,
            camerasOnline: cams.filter((c: Camera) => c.status === "online").length,
            camerasOffline: cams.filter((c: Camera) => c.status === "offline").length,
            camerasMaintenance: cams.filter((c: Camera) => c.status === "manutencao").length,
          }));
        })
        .catch(console.error);
    }
  }, [form.schoolId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");

    try {
      const res = await fetch("/api/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess("Relatório registrado com sucesso!");
        setShowForm(false);
        setForm({
          schoolId: "",
          isNormal: true,
          observations: "",
          camerasOnline: 0,
          camerasOffline: 0,
          camerasMaintenance: 0,
        });
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Diário</h1>
          <p className="text-sm text-gray-500">
            Monitoramento diário das câmeras por escola
          </p>
        </div>
        {user?.role === "tecnico_monitoramento" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            📋 Novo Relatório
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          ✅ {success}
        </div>
      )}

      {/* New Report Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-blue-800">
            Registrar Monitoramento
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Escola *
              </label>
              <select
                value={form.schoolId}
                onChange={(e) =>
                  setForm({ ...form, schoolId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Selecione a escola</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.type}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isNormal: true })}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    form.isNormal
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  ✅ Tudo na Normalidade
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isNormal: false })}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    !form.isNormal
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  ⚠️ Irregularidade
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Câmeras Online
              </label>
              <input
                type="number"
                min="0"
                value={form.camerasOnline}
                onChange={(e) =>
                  setForm({ ...form, camerasOnline: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Câmeras Offline
              </label>
              <input
                type="number"
                min="0"
                value={form.camerasOffline}
                onChange={(e) =>
                  setForm({ ...form, camerasOffline: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                value={form.observations}
                onChange={(e) =>
                  setForm({ ...form, observations: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Observações adicionais sobre o monitoramento..."
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Registrar Monitoramento"}
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <p className="text-4xl">📋</p>
          <p className="mt-2 text-gray-500">Nenhum relatório encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        report.isNormal
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {report.isNormal ? "✅ Normal" : "⚠️ Irregular"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(report.reportDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-gray-800">
                    [{report.schoolType}] {report.schoolName}
                  </h3>
                  {report.observations && (
                    <p className="mt-1 text-xs text-gray-500">
                      {report.observations}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-600">
                    🟢 {report.camerasOnline}
                  </span>
                  <span className="text-red-600">
                    🔴 {report.camerasOffline}
                  </span>
                  <span className="text-yellow-600">
                    🟡 {report.camerasMaintenance}
                  </span>
                  <span className="text-gray-400">
                    por {report.technicianName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
