import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cameras, schools } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status");

  const conditions = [eq(cameras.active, true)];
  if (schoolId) {
    conditions.push(eq(cameras.schoolId, schoolId));
  }
  if (status) {
    conditions.push(eq(cameras.status, status as "online" | "offline" | "manutencao"));
  }

  const result = await db
    .select({
      id: cameras.id,
      schoolId: cameras.schoolId,
      name: cameras.name,
      location: cameras.location,
      ip: cameras.ip,
      status: cameras.status,
      active: cameras.active,
      createdAt: cameras.createdAt,
      schoolName: schools.name,
      schoolType: schools.type,
    })
    .from(cameras)
    .innerJoin(schools, eq(cameras.schoolId, schools.id))
    .where(and(...conditions))
    .orderBy(schools.name, cameras.name);

  return NextResponse.json({ cameras: result });
}
