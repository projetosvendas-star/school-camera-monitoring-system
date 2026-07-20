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
    .from("ticket_history")
    .select("id, action, comment, previous_status, new_status, created_at, users!inner(name, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ticket history error:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }

  const history = (data || []).map((h: Record<string, unknown>) => {
    const users = h.users as { name: string; role: string } | null;
    return {
      id: h.id,
      action: h.action,
      comment: h.comment,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      createdAt: h.created_at,
      userName: users?.name || null,
      userRole: users?.role || null,
    };
  });

  return NextResponse.json({ history });
}
