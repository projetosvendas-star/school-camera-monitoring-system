import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, cameras, schools, dailyReports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, sql, gte } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Total schools
  const schoolCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schools)
    .where(eq(schools.active, true));

  // Camera stats
  const cameraStats = await db
    .select({
      total: sql<number>`count(*)`,
      online: sql<number>`count(*) filter (where ${cameras.status} = 'online')`,
      offline: sql<number>`count(*) filter (where ${cameras.status} = 'offline')`,
      maintenance: sql<number>`count(*) filter (where ${cameras.status} = 'manutencao')`,
    })
    .from(cameras)
    .where(eq(cameras.active, true));

  // Ticket stats
  const ticketStats = await db
    .select({
      total: sql<number>`count(*)`,
      aberto: sql<number>`count(*) filter (where ${tickets.status} = 'aberto')`,
      emAnalise: sql<number>`count(*) filter (where ${tickets.status} = 'em_analise')`,
      fechado: sql<number>`count(*) filter (where ${tickets.status} = 'fechado')`,
      aguardando: sql<number>`count(*) filter (where ${tickets.status} = 'aguardando')`,
    })
    .from(tickets);

  // Today's reports
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReports = await db
    .select({
      total: sql<number>`count(*)`,
      normal: sql<number>`count(*) filter (where ${dailyReports.isNormal} = true)`,
      irregular: sql<number>`count(*) filter (where ${dailyReports.isNormal} = false)`,
    })
    .from(dailyReports)
    .where(gte(dailyReports.reportDate, today));

  // Recent tickets
  const recentTickets = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      title: tickets.title,
      status: tickets.status,
      priority: tickets.priority,
      createdAt: tickets.createdAt,
      schoolName: schools.name,
    })
    .from(tickets)
    .innerJoin(schools, eq(tickets.schoolId, schools.id))
    .orderBy(sql`${tickets.createdAt} desc`)
    .limit(5);

  return NextResponse.json({
    schools: Number(schoolCount[0]?.count || 0),
    cameras: cameraStats[0] || { total: 0, online: 0, offline: 0, maintenance: 0 },
    tickets: ticketStats[0] || { total: 0, aberto: 0, emAnalise: 0, fechado: 0, aguardando: 0 },
    todayReports: todayReports[0] || { total: 0, normal: 0, irregular: 0 },
    recentTickets,
  });
}
