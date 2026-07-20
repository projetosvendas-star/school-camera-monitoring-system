import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: Record<string, unknown>) => jsPDF;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "administrativo") {
    return NextResponse.json(
      { error: "Apenas administrativos podem gerar relatórios" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const type = searchParams.get("type") || "tickets";
  const status = searchParams.get("status");

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Data inicial e final são obrigatórias" },
      { status: 400 }
    );
  }

  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SME - Secretaria Municipal de Educação", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Monitoramento de Câmeras", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(10);
    const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
    doc.text(`Período: ${formatDate(dateFrom)} a ${formatDate(dateTo)}`, pageWidth / 2, 36, { align: "center" });
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      42,
      { align: "center" }
    );

    let startY = 50;

    if (type === "tickets") {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Chamados", pageWidth / 2, startY, { align: "center" });
      startY += 10;

      let ticketQuery = supabaseAdmin
        .from("tickets")
        .select("ticket_number, title, status, priority, created_at, closed_at, schools!inner(name), opened_user:users!opened_by(name)")
        .gte("created_at", new Date(dateFrom).toISOString())
        .lte("created_at", new Date(dateTo + "T23:59:59").toISOString())
        .order("created_at", { ascending: false });

      if (status) {
        ticketQuery = ticketQuery.eq("status", status);
      }

      const { data: ticketData } = await ticketQuery;

      const statusLabels: Record<string, string> = {
        aberto: "Aberto", em_analise: "Em Análise", fechado: "Fechado", aguardando: "Aguardando",
      };
      const priorityLabels: Record<string, string> = {
        baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica",
      };

      const tickets = ticketData || [];
      const abertos = tickets.filter((t: { status: string }) => t.status === "aberto").length;
      const emAnalise = tickets.filter((t: { status: string }) => t.status === "em_analise").length;
      const fechados = tickets.filter((t: { status: string }) => t.status === "fechado").length;
      const aguardando = tickets.filter((t: { status: string }) => t.status === "aguardando").length;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Chamados: ${tickets.length}`, 14, startY);
      startY += 5;
      doc.text(`Abertos: ${abertos} | Em Análise: ${emAnalise} | Fechados: ${fechados} | Aguardando: ${aguardando}`, 14, startY);
      startY += 8;

      const tableData = tickets.map((t: Record<string, unknown>) => {
        const schools = t.schools as { name: string } | null;
        const openedUser = t.opened_user as { name: string } | null;
        return [
          t.ticket_number,
          schools?.name || "-",
          (t.title as string)?.substring(0, 40) || "-",
          statusLabels[t.status as string] || t.status,
          priorityLabels[t.priority as string] || t.priority,
          openedUser?.name || "-",
          t.created_at ? new Date(t.created_at as string).toLocaleDateString("pt-BR") : "-",
        ];
      });

      doc.autoTable({
        startY,
        head: [["Nº", "Escola", "Título", "Status", "Prioridade", "Aberto por", "Data"]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { top: startY },
      });
    } else {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Diário de Monitoramento", pageWidth / 2, startY, { align: "center" });
      startY += 10;

      const { data: reportData } = await supabaseAdmin
        .from("daily_reports")
        .select("report_date, is_normal, observations, cameras_online, cameras_offline, cameras_maintenance, schools!inner(name), users!inner(name)")
        .gte("report_date", new Date(dateFrom).toISOString())
        .lte("report_date", new Date(dateTo + "T23:59:59").toISOString())
        .order("report_date", { ascending: false });

      const tableData = (reportData || []).map((r: Record<string, unknown>) => {
        const schools = r.schools as { name: string } | null;
        const users = r.users as { name: string } | null;
        return [
          r.report_date ? new Date(r.report_date as string).toLocaleDateString("pt-BR") : "-",
          schools?.name || "-",
          r.is_normal ? "Normal" : "Irregular",
          `${r.cameras_online}/${r.cameras_offline}/${r.cameras_maintenance}`,
          r.observations || "-",
          users?.name || "-",
        ];
      });

      doc.autoTable({
        startY,
        head: [["Data", "Escola", "Status", "Online/Off/Manut", "Observações", "Técnico"]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { top: startY },
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Desenvolvido pelo Departamento de Tecnologia da SME",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio_${type}_${dateFrom}_${dateTo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
