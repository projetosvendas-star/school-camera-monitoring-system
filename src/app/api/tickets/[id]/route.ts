import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, ticketHistory } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ticket: result[0] });
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

  const existing = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
  }

  const ticket = existing[0];
  const previousStatus = ticket.status;

  // Update ticket
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (status) {
    updateData.status = status;
    if (status === "fechado" || status === "aguardando") {
      updateData.closedBy = user.id;
      updateData.closedAt = new Date();
    }
  }
  if (taticoParecer !== undefined) updateData.taticoParecer = taticoParecer;
  if (adminParecer !== undefined) updateData.adminParecer = adminParecer;

  const [updated] = await db
    .update(tickets)
    .set(updateData)
    .where(eq(tickets.id, id))
    .returning();

  // Add history entry
  const actionMap: Record<string, string> = {
    em_analise: "Encaminhado para análise tática",
    fechado: "Chamado fechado",
    aguardando: "Aguardando direção escolar",
    aberto: "Chamado reaberto",
  };

  await db.insert(ticketHistory).values({
    ticketId: id,
    userId: user.id,
    action: actionMap[status as string] || "Atualização",
    comment: comment || (taticoParecer ? `Parecer tático: ${taticoParecer}` : adminParecer ? `Parecer administrativo: ${adminParecer}` : null),
    previousStatus: previousStatus,
    newStatus: status || undefined,
  });

  return NextResponse.json({ ticket: updated });
}
