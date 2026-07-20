import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyReports, schools, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const conditions = [];
  if (schoolId) conditions.push(eq(dailyReports.schoolId, schoolId));
  if (dateFrom) conditions.push(gte(dailyReports.reportDate, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(dailyReports.reportDate, new Date(dateTo + "T23:59:59")));

  const query = db
    .select({
      id: dailyReports.id,
      reportDate: dailyReports.reportDate,
      isNormal: dailyReports.isNormal,
      observations: dailyReports.observations,
      camerasOnline: dailyReports.camerasOnline,
      camerasOffline: dailyReports.camerasOffline,
      camerasMaintenance: dailyReports.camerasMaintenance,
      createdAt: dailyReports.createdAt,
      schoolName: schools.name,
      schoolType: schools.type,
      technicianName: users.name,
    })
    .from(dailyReports)
    .innerJoin(schools, eq(dailyReports.schoolId, schools.id))
    .innerJoin(users, eq(dailyReports.technicianId, users.id))
    .orderBy(desc(dailyReports.reportDate));

  const result = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return NextResponse.json({ reports: result });
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

  const [report] = await db
    .insert(dailyReports)
    .values({
      schoolId,
      technicianId: user.id,
      reportDate: new Date(),
      isNormal: isNormal !== false,
      observations,
      camerasOnline: camerasOnline || 0,
      camerasOffline: camerasOffline || 0,
      camerasMaintenance: camerasMaintenance || 0,
    })
    .returning();

  return NextResponse.json({ report }, { status: 201 });
}
