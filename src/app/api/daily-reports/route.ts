import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let query = supabaseAdmin
    .from("daily_reports")
    .select("id, reportDate:report_date, isNormal:is_normal, observations, camerasOnline:cameras_online, camerasOffline:cameras_offline, camerasMaintenance:cameras_maintenance, createdAt:created_at, schools!inner(name, type), users!inner(name)")
    .order("report_date", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }
  if (dateFrom) {
    query = query.gte("report_date", new Date(dateFrom).toISOString());
  }
  if (dateTo) {
    query = query.lte("report_date", new Date(dateTo + "T23:59:59").toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Daily reports error:", error);
    return NextResponse.json({ error: "Erro ao buscar relatórios" }, { status: 500 });
  }

  const reports = (data || []).map((r: Record<string, unknown>) => {
    const schools = r.schools as { name: string; type: string } | null;
    const users = r.users as { name: string } | null;
    return {
      id: r.id,
      reportDate: r.reportDate,
      isNormal: r.isNormal,
      observations: r.observations,
      camerasOnline: r.camerasOnline,
      camerasOffline: r.camerasOffline,
      camerasMaintenance: r.camerasMaintenance,
      createdAt: r.createdAt,
      schoolName: schools?.name || null,
      schoolType: schools?.type || null,
      technicianName: users?.name || null,
    };
  });

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "tecnico_monitoramento") {
    return NextResponse.json(
      { error: "Apenas técnicos podem criar relatórios diários" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { schoolId, isNormal, observations, camerasOnline, camerasOffline, camerasMaintenance } = body;

  if (!schoolId) {
    return NextResponse.json(
      { error: "Escola é obrigatória" },
      { status: 400 }
    );
  }

  const { data: report, error } = await supabaseAdmin
    .from("daily_reports")
    .insert({
      school_id: schoolId,
      technician_id: user.id,
      report_date: new Date().toISOString(),
      is_normal: isNormal !== false,
      observations,
      cameras_online: camerasOnline || 0,
      cameras_offline: camerasOffline || 0,
      cameras_maintenance: camerasMaintenance || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert daily report error:", error);
    return NextResponse.json({ error: "Erro ao criar relatório" }, { status: 500 });
  }

  return NextResponse.json({ report }, { status: 201 });
}
