import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ticketHistory, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

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
    .select({
      id: ticketHistory.id,
      action: ticketHistory.action,
      comment: ticketHistory.comment,
      previousStatus: ticketHistory.previousStatus,
      newStatus: ticketHistory.newStatus,
      createdAt: ticketHistory.createdAt,
      userName: users.name,
      userRole: users.role,
    })
    .from(ticketHistory)
    .innerJoin(users, eq(ticketHistory.userId, users.id))
    .where(eq(ticketHistory.ticketId, id))
    .orderBy(desc(ticketHistory.createdAt));

  return NextResponse.json({ history: result });
}
