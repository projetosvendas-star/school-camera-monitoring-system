"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  userRole: string;
  userName: string;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: "📊",
    roles: ["tecnico_monitoramento", "tatico", "administrativo"],
  },
  {
    label: "Chamados",
    href: "/tickets",
    icon: "🎫",
    roles: ["tecnico_monitoramento", "tatico", "administrativo"],
  },
  {
    label: "Novo Chamado",
    href: "/tickets/new",
    icon: "➕",
    roles: ["tecnico_monitoramento"],
  },
  {
    label: "Escolas",
    href: "/schools",
    icon: "🏫",
    roles: ["tecnico_monitoramento", "tatico", "administrativo"],
  },
  {
    label: "Câmeras",
    href: "/cameras",
    icon: "📹",
    roles: ["tecnico_monitoramento", "tatico", "administrativo"],
  },
  {
    label: "Relatório Diário",
    href: "/daily-reports",
    icon: "📋",
    roles: ["tecnico_monitoramento"],
  },
  {
    label: "Relatórios PDF",
    href: "/reports",
    icon: "📄",
    roles: ["administrativo"],
  },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const roleLabels: Record<string, string> = {
    tecnico_monitoramento: "Técnico de Monitoramento",
    tatico: "Operador Tático",
    administrativo: "Administrativo",
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-blue-700 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl">
          📹
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white">Monitora SME</h1>
            <p className="text-xs text-blue-200">Câmeras Escolares</p>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="border-b border-blue-700 px-4 py-3">
        {!collapsed ? (
          <>
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-blue-200">
              {roleLabels[userRole] || userRole}
            </p>
          </>
        ) : (
          <p className="text-center text-lg">👤</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-blue-700 p-3">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition-all hover:bg-white/10 hover:text-white"
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-blue-800 p-2 text-white shadow-lg lg:hidden"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gradient-to-b from-blue-900 to-blue-800 transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-shrink-0 ${
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        <div
          className={`flex w-full flex-col bg-gradient-to-b from-blue-900 to-blue-800 ${
            collapsed ? "items-center" : ""
          }`}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute right-[-12px] top-7 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-blue-700 text-xs text-white shadow lg:flex"
          >
            {collapsed ? "→" : "←"}
          </button>
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
