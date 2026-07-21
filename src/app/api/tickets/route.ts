import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const schoolId = searchParams.get("schoolId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("tickets")
    .select(
      "id, ticketNumber:ticket_number, title, description, status, priority, taticoParecer:tatico_parecer, adminParecer:admin_parecer, closedAt:closed_at, createdAt:created_at, updatedAt:updated_at, schools!inner(name, type), cameras(name), opened_user:users!opened_by(name), assigned_user:users!assigned_to(name), closed_user:users!closed_by(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (schoolId) query = query.eq("school_id", schoolId);

  // Técnico só vê seus próprios chamados
  if (user.role === "tecnico_monitoramento") {
    query = query.eq("opened_by", user.id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Tickets error:", error);
    return NextResponse.json({ error: "Erro ao buscar chamados" }, { status: 500 });
  }

  const tickets = (data || []).map((t: Record<string, unknown>) => {
    const schools = t.schools as { name: string; type: string } | null;
    const cameras = t.cameras as { name: string } | null;
    const openedUser = t.opened_user as { name: string } | null;
    const assignedUser = t.assigned_user as { name: string } | null;
    const closedUser = t.closed_user as { name: string } | null;
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      taticoParecer: t.taticoParecer,
      adminParecer: t.adminParecer,
      closedAt: t.closedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      schoolName: schools?.name || null,
      schoolType: schools?.type || null,
      cameraName: cameras?.name || null,
      openedByName: openedUser?.name || null,
      assignedToName: assignedUser?.name || null,
      closedByName: closedUser?.name || null,
    };
  });

  return NextResponse.json({
    tickets,
    total: count || 0,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { schoolId, cameraId, title, description, priority } = body;

  if (!schoolId || !title || !description) {
    return NextResponse.json(
      { error: "Escola, título e descrição são obrigatórios" },
      { status: 400 }
    );
  }

  const ticketNum = `TK${Date.now().toString(36).toUpperCase()}`;

  const { data: newTicket, error } = await supabaseAdmin
    .from("tickets")
    .insert({
      ticket_number: ticketNum,
      school_id: schoolId,
      camera_id: cameraId || null,
      title,
      description,
      priority: priority || "media",
      status: "aberto",
      opened_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert ticket error:", error);
    return NextResponse.json({ error: "Erro ao criar chamado" }, { status: 500 });
  }

  await supabaseAdmin.from("ticket_history").insert({
    ticket_id: newTicket.id,
    user_id: user.id,
    action: "Chamado aberto",
    comment: description,
    new_status: "aberto",
  });

  return NextResponse.json({ ticket: newTicket }, { status: 201 });
}
