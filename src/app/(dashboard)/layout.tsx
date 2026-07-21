"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50/80">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="flex flex-1 flex-col lg:ml-0">
        <main className="flex-1 p-4 pt-16 lg:p-6 lg:pt-6">{children}</main>
        <footer className="border-t border-gray-100 bg-white/60 py-3 text-center backdrop-blur-sm">
          <p className="text-[10px] font-bold text-gray-400">
            Desenvolvido pelo Departamento de Tecnologia da SME
          </p>
        </footer>
      </div>
    </div>
  );
}
