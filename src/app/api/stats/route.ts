import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Técnico: só vê seus próprios dados
  const isTecnico = user.role === "tecnico_monitoramento";

  const ticketQuery = supabaseAdmin.from("tickets").select("status, occurrence_type");
  if (isTecnico) ticketQuery.eq("opened_by", user.id);

  const schoolTicketQuery = supabaseAdmin
    .from("tickets")
    .select("school_id, occurrence_type, schools!inner(name)")
    .not("occurrence_type", "is", null);
  if (isTecnico) schoolTicketQuery.eq("opened_by", user.id);

  const recentQuery = supabaseAdmin
    .from("tickets")
    .select("id, ticket_number, title, status, priority, created_at, schools!inner(name)")
    .order("created_at", { ascending: false })
    .limit(5);
  if (isTecnico) recentQuery.eq("opened_by", user.id);

  const [schoolsRes, camerasRes, ticketsRes, reportsRes, recentRes, schoolTicketsRes] = await Promise.all([
    supabaseAdmin.from("schools").select("id", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("cameras").select("status").eq("active", true),
    ticketQuery,
    isTecnico
      ? supabaseAdmin.from("daily_reports").select("is_normal, report_date").eq("user_id", user.id).gte("report_date", new Date().toISOString().split("T")[0])
      : supabaseAdmin.from("daily_reports").select("is_normal, report_date").gte("report_date", new Date().toISOString().split("T")[0]),
    recentQuery,
    schoolTicketQuery,
  ]);

  const cameras = camerasRes.data || [];
  const tickets = ticketsRes.data || [];
  const reports = reportsRes.data || [];

  const cameraStats = {
    total: cameras.length,
    online: cameras.filter((c: { status: string }) => c.status === "online").length,
    offline: cameras.filter((c: { status: string }) => c.status === "offline").length,
    maintenance: cameras.filter((c: { status: string }) => c.status === "manutencao").length,
  };

  const ticketStats = {
    total: tickets.length,
    aberto: tickets.filter((t: { status: string }) => t.status === "aberto").length,
    emAnalise: tickets.filter((t: { status: string }) => t.status === "em_analise").length,
    fechado: tickets.filter((t: { status: string }) => t.status === "fechado").length,
    aguardando: tickets.filter((t: { status: string }) => t.status === "aguardando").length,
  };

  const occurrenceStats = tickets.reduce((acc: Record<string, number>, t: { occurrence_type: string | null }) => {
    if (t.occurrence_type) {
      acc[t.occurrence_type] = (acc[t.occurrence_type] || 0) + 1;
    }
    return acc;
  }, {});

  const schoolOccurrences = (schoolTicketsRes.data || []).reduce(
    (acc: Record<string, { name: string; count: number; types: Record<string, number> }>, t: Record<string, unknown>) => {
      const schools = t.schools as { name: string } | null;
      const schoolId = t.school_id as string;
      const occType = t.occurrence_type as string;
      if (!acc[schoolId]) {
        acc[schoolId] = { name: schools?.name || "Desconhecida", count: 0, types: {} };
      }
      acc[schoolId].count++;
      acc[schoolId].types[occType] = (acc[schoolId].types[occType] || 0) + 1;
      return acc;
    },
    {}
  );

  const todayReports = {
    total: reports.length,
    normal: reports.filter((r: { is_normal: boolean }) => r.is_normal).length,
    irregular: reports.filter((r: { is_normal: boolean }) => !r.is_normal).length,
  };

  const recentTickets = (recentRes.data || []).map((t: Record<string, unknown>) => {
    const schools = t.schools as { name: string } | null;
    return {
      id: t.id,
      ticketNumber: t.ticket_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.created_at,
      schoolName: schools?.name || null,
    };
  });

  return NextResponse.json({
    schools: schoolsRes.count || 0,
    cameras: cameraStats,
    tickets: ticketStats,
    occurrenceStats,
    schoolOccurrences,
    todayReports,
    recentTickets,
  });
}
