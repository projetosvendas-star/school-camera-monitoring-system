import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, schools, cameras, users, ticketHistory } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

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
  const search = searchParams.get("search");

  const conditions = [];
  if (status) conditions.push(eq(tickets.status, status as "aberto" | "em_analise" | "fechado" | "aguardando"));
  if (priority) conditions.push(eq(tickets.priority, priority as "baixa" | "media" | "alta" | "critica"));
  if (schoolId) conditions.push(eq(tickets.schoolId, schoolId));

  const offset = (page - 1) * limit;

  const baseQuery = db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      priority: tickets.priority,
      taticoParecer: tickets.taticoParecer,
      adminParecer: tickets.adminParecer,
      closedAt: tickets.closedAt,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      schoolName: schools.name,
      schoolType: schools.type,
      cameraName: cameras.name,
      openedByName: sql<string>`open_user.name`.as("openedByName"),
      assignedToName: sql<string>`assign_user.name`.as("assignedToName"),
      closedByName: sql<string>`close_user.name`.as("closedByName"),
    })
    .from(tickets)
    .innerJoin(schools, eq(tickets.schoolId, schools.id))
    .leftJoin(cameras, eq(tickets.cameraId, cameras.id))
    .leftJoin(sql`users as open_user`, sql`open_user.id = ${tickets.openedBy}`)
    .leftJoin(sql`users as assign_user`, sql`assign_user.id = ${tickets.assignedTo}`)
    .leftJoin(sql`users as close_user`, sql`close_user.id = ${tickets.closedBy}`)
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset);

  const result = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery;

  // Count total
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(tickets);
  const countResult = conditions.length > 0
    ? await countQuery.where(and(...conditions))
    : await countQuery;

  return NextResponse.json({
    tickets: result,
    total: Number(countResult[0]?.count || 0),
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

  const [newTicket] = await db
    .insert(tickets)
    .values({
      ticketNumber: ticketNum,
      schoolId,
      cameraId: cameraId || null,
      title,
      description,
      priority: priority || "media",
      status: "aberto",
      openedBy: user.id,
    })
    .returning();

  // Add history entry
  await db.insert(ticketHistory).values({
    ticketId: newTicket.id,
    userId: user.id,
    action: "Chamado aberto",
    comment: description,
    newStatus: "aberto",
  });

  return NextResponse.json({ ticket: newTicket }, { status: 201 });
}
