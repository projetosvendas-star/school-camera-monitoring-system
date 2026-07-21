import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "administrativo") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "administrativo") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Nome, email, senha e perfil são obrigatórios" },
      { status: 400 }
    );
  }

  if (!["tecnico_monitoramento", "tatico", "administrativo"].includes(role)) {
    return NextResponse.json(
      { error: "Perfil inválido" },
      { status: 400 }
    );
  }

  const existing = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    return NextResponse.json(
      { error: "Já existe um usuário com este email" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: newUser, error } = await supabaseAdmin
    .from("users")
    .insert({
      name,
      email,
      password: hashedPassword,
      role,
      active: true,
    })
    .select("id, name, email, role, active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }

  return NextResponse.json({ user: newUser }, { status: 201 });
}
