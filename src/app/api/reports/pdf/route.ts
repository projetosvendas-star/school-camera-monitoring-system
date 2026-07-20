import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, schools, users, dailyReports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
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
  const type = searchParams.get("type") || "tickets"; // tickets | daily
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

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SME - Secretaria Municipal de Educação", pageWidth / 2, 20, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Monitoramento de Câmeras", pageWidth / 2, 28, {
      align: "center",
    });

    // Period
    doc.setFontSize(10);
    const formatDate = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString("pt-BR");
    };
    doc.text(
      `Período: ${formatDate(dateFrom)} a ${formatDate(dateTo)}`,
      pageWidth / 2,
      36,
      { align: "center" }
    );
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      42,
      { align: "center" }
    );

    let startY = 50;

    if (type === "tickets") {
      // Tickets report
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Chamados", pageWidth / 2, startY, {
        align: "center",
      });
      startY += 10;

      const conditions = [
        gte(tickets.createdAt, new Date(dateFrom)),
        lte(tickets.createdAt, new Date(dateTo + "T23:59:59")),
      ];
      if (status) {
        conditions.push(eq(tickets.status, status as "aberto" | "em_analise" | "fechado" | "aguardando"));
      }

      const ticketData = await db
        .select({
          ticketNumber: tickets.ticketNumber,
          title: tickets.title,
          status: tickets.status,
          priority: tickets.priority,
          schoolName: schools.name,
          openedByName: sql<string>`open_user.name`,
          createdAt: tickets.createdAt,
          closedAt: tickets.closedAt,
        })
        .from(tickets)
        .innerJoin(schools, eq(tickets.schoolId, schools.id))
        .leftJoin(sql`users as open_user`, sql`open_user.id = ${tickets.openedBy}`)
        .where(and(...conditions))
        .orderBy(desc(tickets.createdAt));

      // Summary
      const totalTickets = ticketData.length;
      const abertos = ticketData.filter((t) => t.status === "aberto").length;
      const emAnalise = ticketData.filter((t) => t.status === "em_analise").length;
      const fechados = ticketData.filter((t) => t.status === "fechado").length;
      const aguardando = ticketData.filter((t) => t.status === "aguardando").length;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Chamados: ${totalTickets}`, 14, startY);
      startY += 5;
      doc.text(`Abertos: ${abertos} | Em Análise: ${emAnalise} | Fechados: ${fechados} | Aguardando: ${aguardando}`, 14, startY);
      startY += 8;

      const statusLabels: Record<string, string> = {
        aberto: "Aberto",
        em_analise: "Em Análise",
        fechado: "Fechado",
        aguardando: "Aguardando",
      };

      const priorityLabels: Record<string, string> = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        critica: "Crítica",
      };

      const tableData = ticketData.map((t) => [
        t.ticketNumber,
        t.schoolName,
        t.title.substring(0, 40),
        statusLabels[t.status] || t.status,
        priorityLabels[t.priority] || t.priority,
        t.openedByName,
        t.createdAt ? new Date(t.createdAt).toLocaleDateString("pt-BR") : "-",
      ]);

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
      // Daily reports
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Diário de Monitoramento", pageWidth / 2, startY, {
        align: "center",
      });
      startY += 10;

      const conditions = [
        gte(dailyReports.reportDate, new Date(dateFrom)),
        lte(dailyReports.reportDate, new Date(dateTo + "T23:59:59")),
      ];

      const reportData = await db
        .select({
          reportDate: dailyReports.reportDate,
          isNormal: dailyReports.isNormal,
          observations: dailyReports.observations,
          camerasOnline: dailyReports.camerasOnline,
          camerasOffline: dailyReports.camerasOffline,
          camerasMaintenance: dailyReports.camerasMaintenance,
          schoolName: schools.name,
          technicianName: users.name,
        })
        .from(dailyReports)
        .innerJoin(schools, eq(dailyReports.schoolId, schools.id))
        .innerJoin(users, eq(dailyReports.technicianId, users.id))
        .where(and(...conditions))
        .orderBy(desc(dailyReports.reportDate));

      const tableData = reportData.map((r) => [
        new Date(r.reportDate).toLocaleDateString("pt-BR"),
        r.schoolName,
        r.isNormal ? "Normal" : "Irregular",
        `${r.camerasOnline}/${r.camerasOffline}/${r.camerasMaintenance}`,
        r.observations || "-",
        r.technicianName,
      ]);

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

    // Footer
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
