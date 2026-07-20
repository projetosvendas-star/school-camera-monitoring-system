"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

interface Camera {
  id: string;
  name: string;
  location: string | null;
  ip: string | null;
  status: string;
  schoolName: string;
  schoolType: string;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/cameras?${params}`)
      .then((res) => res.json())
      .then((data) => setCameras(data.cameras || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const offlineCount = cameras.filter((c) => c.status === "offline").length;
  const maintCount = cameras.filter((c) => c.status === "manutencao").length;

  // Group by school
  const bySchool = cameras.reduce(
    (acc, cam) => {
      if (!acc[cam.schoolName]) acc[cam.schoolName] = [];
      acc[cam.schoolName].push(cam);
      return acc;
    },
    {} as Record<string, Camera[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Câmeras</h1>
        <p className="text-sm text-gray-500">
          {cameras.length} câmeras cadastradas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{onlineCount}</p>
          <p className="text-xs text-green-600">Online</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{offlineCount}</p>
          <p className="text-xs text-red-600">Offline</p>
        </div>
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{maintCount}</p>
          <p className="text-xs text-yellow-600">Manutenção</p>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {["", "online", "offline", "manutencao"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === ""
                ? "Todas"
                : status === "online"
                  ? "Online"
                  : status === "offline"
                    ? "Offline"
                    : "Manutenção"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySchool).map(([schoolName, schoolCameras]) => (
            <div key={schoolName}>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                🏫 {schoolName}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {schoolCameras.map((cam) => (
                  <div
                    key={cam.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800">
                          {cam.name}
                        </h3>
                        {cam.location && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            📍 {cam.location}
                          </p>
                        )}
                        {cam.ip && (
                          <p className="mt-0.5 font-mono text-xs text-gray-400">
                            {cam.ip}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={cam.status} />
                    </div>
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
