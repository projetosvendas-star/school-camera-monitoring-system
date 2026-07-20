"use client";

import { useEffect, useState } from "react";

interface School {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string | null;
  contact: string | null;
  phone: string | null;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);

    fetch(`/api/schools?${params}`)
      .then((res) => res.json())
      .then((data) => setSchools(data.schools || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter, search]);

  const typeColors: Record<string, string> = {
    CEI: "bg-blue-100 text-blue-700",
    CEM: "bg-green-100 text-green-700",
    EM: "bg-purple-100 text-purple-700",
    ERM: "bg-amber-100 text-amber-700",
    LOGISTICA: "bg-gray-100 text-gray-700",
    ALMOXARIFADO: "bg-orange-100 text-orange-700",
    MERENDA: "bg-pink-100 text-pink-700",
  };

  const typeGroups = schools.reduce(
    (acc, school) => {
      if (!acc[school.type]) acc[school.type] = [];
      acc[school.type].push(school);
      return acc;
    },
    {} as Record<string, School[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escolas</h1>
        <p className="text-sm text-gray-500">
          {schools.length} unidades cadastradas
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Buscar escola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos os Tipos</option>
            <option value="CEI">CEI</option>
            <option value="CEM">CEM</option>
            <option value="EM">EM</option>
            <option value="ERM">ERM</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="ALMOXARIFADO">ALMOXARIFADO</option>
            <option value="MERENDA">MERENDA</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(typeGroups).map(([type, typeSchools]) => (
            <div key={type}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${typeColors[type] || "bg-gray-100 text-gray-700"}`}
                >
                  {type}
                </span>
                <span className="text-sm text-gray-400">
                  {typeSchools.length} unidade(s)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {typeSchools.map((school) => (
                  <div
                    key={school.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {school.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs text-gray-400">
                          {school.code}
                        </p>
                      </div>
                      <span className="text-lg">🏫</span>
                    </div>
                    {school.contact && (
                      <p className="mt-2 text-xs text-gray-500">
                        📞 {school.contact}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
