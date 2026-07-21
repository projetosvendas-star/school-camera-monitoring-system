import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    // Check if column exists by trying to select it
    const { error } = await supabaseAdmin
      .from("tickets")
      .select("occurrence_type")
      .limit(1);

    if (!error) {
      return NextResponse.json({ exists: true, message: "Column already exists" });
    }

    if (!error.message.includes("occurrence_type")) {
      return NextResponse.json({ exists: false, error: error.message });
    }

    return NextResponse.json({
      exists: false,
      message: "Column does not exist. Please run this SQL in Supabase Dashboard > SQL Editor: ALTER TABLE tickets ADD COLUMN occurrence_type varchar(100)"
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
