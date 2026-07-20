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
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("cameras")
    .select("id, schoolId:school_id, name, location, ip, status, active, createdAt:created_at, schools!inner(name, type)")
    .eq("active", true);

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("name", { referencedTable: "schools" }).order("name");

  const { data, error } = await query;

  if (error) {
    console.error("Cameras error:", error);
    return NextResponse.json({ error: "Erro ao buscar câmeras" }, { status: 500 });
  }

  const cameras = (data || []).map((c: Record<string, unknown>) => {
    const schools = c.schools as { name: string; type: string } | null;
    return {
      id: c.id,
      schoolId: c.schoolId,
      name: c.name,
      location: c.location,
      ip: c.ip,
      status: c.status,
      active: c.active,
      createdAt: c.createdAt,
      schoolName: schools?.name || null,
      schoolType: schools?.type || null,
    };
  });

  return NextResponse.json({ cameras });
}
