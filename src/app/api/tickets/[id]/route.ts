import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
  }

  // Permissões por perfil
  if (user.role === "tecnico_monitoramento" && data.opened_by !== user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json({ ticket: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, taticoParecer, adminParecer, comment } = body;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("tickets")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
  }

  // Permissões por perfil
  if (user.role === "tecnico_monitoramento" && existing.opened_by !== user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (user.role === "tecnico_monitoramento" && existing.status !== "aberto") {
    return NextResponse.json({ error: "Técnico só pode alterar chamados abertos" }, { status: 403 });
  }
  if (user.role === "tatico" && existing.status !== "em_analise") {
    return NextResponse.json({ error: "Tático só pode alterar chamados em análise" }, { status: 403 });
  }

  const previousStatus = existing.status;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updateData.status = status;
    if (status === "fechado" || status === "aguardando") {
      updateData.closed_by = user.id;
      updateData.closed_at = new Date().toISOString();
    }
  }
  if (taticoParecer !== undefined) updateData.tatico_parecer = taticoParecer;
  if (adminParecer !== undefined) updateData.admin_parecer = adminParecer;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("tickets")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Update ticket error:", updateError);
    return NextResponse.json({ error: "Erro ao atualizar chamado" }, { status: 500 });
  }

  const actionMap: Record<string, string> = {
    em_analise: "Encaminhado para análise tática",
    fechado: "Chamado fechado",
    aguardando: "Aguardando direção escolar",
    aberto: "Chamado reaberto",
  };

  await supabaseAdmin.from("ticket_history").insert({
    ticket_id: id,
    user_id: user.id,
    action: actionMap[status as string] || "Atualização",
    comment: comment || (taticoParecer ? `Parecer tático: ${taticoParecer}` : adminParecer ? `Parecer administrativo: ${adminParecer}` : null),
    previous_status: previousStatus,
    new_status: status || undefined,
  });

  return NextResponse.json({ ticket: updated });
}
