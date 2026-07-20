import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, ilike, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  let query = db.select().from(schools).where(eq(schools.active, true));

  const conditions = [eq(schools.active, true)];
  if (type) {
    conditions.push(eq(schools.type, type));
  }
  if (search) {
    conditions.push(ilike(schools.name, `%${search}%`));
  }

  const result = await db
    .select()
    .from(schools)
    .where(and(...conditions))
    .orderBy(schools.name);

  return NextResponse.json({ schools: result });
}
