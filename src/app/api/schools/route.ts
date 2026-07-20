import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  let query = supabaseAdmin
    .from("schools")
    .select("*")
    .eq("active", true)
    .order("name");

  if (type) {
    query = query.eq("type", type);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Schools error:", error);
    return NextResponse.json({ error: "Erro ao buscar escolas" }, { status: 500 });
  }

  return NextResponse.json({ schools: data });
}
