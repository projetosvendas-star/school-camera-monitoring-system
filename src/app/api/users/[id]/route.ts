import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "administrativo") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, role, active, password } = body;

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (active !== undefined) updateData.active = active;
  if (password) updateData.password = await bcrypt.hash(password, 10);
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select("id, name, email, role, active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "administrativo") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { error: "Não é possível excluir seu próprio usuário" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
