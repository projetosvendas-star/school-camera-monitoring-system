"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  tecnico_monitoramento: "Técnico de Monitoramento",
  tatico: "Operador Tático",
  administrativo: "Administrador",
};

const roleColors: Record<string, string> = {
  tecnico_monitoramento: "bg-emerald-100 text-emerald-700",
  tatico: "bg-amber-100 text-amber-700",
  administrativo: "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "tecnico_monitoramento",
  });

  function fetchUsers() {
    setLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openCreate() {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "tecnico_monitoramento" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      if (editingUser) {
        const body: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao atualizar");
          return;
        }
        setSuccess("Usuário atualizado com sucesso!");
      } else {
        if (!form.password) {
          setError("Senha é obrigatória para novos usuários");
          return;
        }
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao criar");
          return;
        }
        setSuccess("Usuário criado com sucesso!");
      }
      setShowModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess("Usuário excluído com sucesso!");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function handleToggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      fetchUsers();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">Gerencie os técnicos e operadores do sistema</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="animate-scale-in rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          ✓ {success}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center shadow-sm">
          <p className="text-5xl">👤</p>
          <p className="mt-3 text-gray-500">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500">Usuário</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500">Perfil</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500">Criado em</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const initials = u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 text-xs font-bold text-indigo-700">
                            {initials}
                          </div>
                          <span className="font-semibold text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            u.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {u.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </h2>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Nome completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-modern"
                  placeholder="João Silva"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-modern"
                  placeholder="joao@sme.local"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  {editingUser ? "Nova senha (deixe vazio para manter)" : "Senha"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-modern"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Perfil de acesso</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "tecnico_monitoramento", label: "Técnico de Monitoramento", desc: "Cria chamados e relatórios diários" },
                    { value: "tatico", label: "Operador Tático", desc: "Analisa e encaminha chamados" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        form.role === r.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className={`text-sm font-bold ${form.role === r.value ? "text-indigo-700" : "text-gray-800"}`}>{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? "Salvando..." : editingUser ? "Salvar" : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
