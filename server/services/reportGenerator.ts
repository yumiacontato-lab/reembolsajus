
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { Report, Transaction, User } from "../shared/schema";

interface ReportData {
    report: Report;
    transactions: Transaction[];
    user: User;
}

export async function generateReportPDF(
    data: ReportData,
    outputPath: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc
            .fontSize(20)
            .fillColor("#0B4F71") // Primary Blue
            .text("ReembolsaJus", { align: "left" })
            .moveDown(0.5);

        doc
            .fontSize(10)
            .fillColor("#666666")
            .text("Relatório de Despesas Reembolsáveis", { align: "left" })
            .moveDown(2);

        // Meta Info
        doc
            .fontSize(10)
            .fillColor("#000000")
            .text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`)
            .text(`Advogado: ${data.user.name || resultEmailName(data.user.email)}`)
            .text(`Arquivo Original: ${data.report.fileName}`)
            .moveDown(2);

        // Summary Box
        const totalAmount = parseFloat(data.report.totalAmount.toString());

        doc
            .rect(50, doc.y, 500, 70)
            .fill("#F3F4F6") // Light Gray
            .stroke("#E5E7EB");

        const summaryY = doc.y - 60; // Adjust inside the box

        doc
            .fillColor("#000000")
            .fontSize(12)
            .text("Total Reembolsável", 70, summaryY)
            .fontSize(24)
            .fillColor("#29A36C") // Success Green
            .text(`R$ ${totalAmount.toFixed(2).replace(".", ",")}`, 70, summaryY + 20);

        doc
            .fontSize(12)
            .fillColor("#000000")
            .text("Total de Itens", 300, summaryY)
            .fontSize(24)
            .text(data.report.itemCount.toString(), 300, summaryY + 20);

        doc.moveDown(4);

        // Clients Summary
        if (data.report.clientsSummary) {
            doc.fontSize(14).fillColor("#000000").text("Resumo por Cliente");
            doc.moveDown(0.5);

            const clients = data.report.clientsSummary as Record<string, number>;
            Object.entries(clients).forEach(([client, total]) => {
                doc
                    .fontSize(10)
                    .text(client || "Sem Cliente", { continued: true })
                    .text(`R$ ${total.toFixed(2).replace(".", ",")}`, { align: "right" });
            });
            doc.moveDown(2);
        }

        // Transactions Table
        doc.fontSize(14).text("Detalhamento dos Itens");
        doc.moveDown(1);

        // Table Header
        const tableTop = doc.y;
        const colDate = 50;
        const colDesc = 130;
        const colClient = 350;
        const colValue = 480;

        doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .text("DATA", colDate, tableTop)
            .text("DESCRIÇÃO", colDesc, tableTop)
            .text("CLIENTE", colClient, tableTop)
            .text("VALOR", colValue, tableTop, { align: "right" });

        doc
            .moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .strokeColor("#E5E7EB")
            .stroke();

        let y = tableTop + 25;

        // Table Rows
        doc.font("Helvetica");
        data.transactions.forEach((tx) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            const amount = parseFloat(tx.amount.toString());

            doc
                .fontSize(9)
                .text(new Date(tx.date).toLocaleDateString("pt-BR"), colDate, y)
                .text(tx.description.substring(0, 45), colDesc, y, { width: 200, ellipsis: true })
                .text(tx.clientName || "-", colClient, y)
                .text(`R$ ${amount.toFixed(2).replace(".", ",")}`, colValue, y, { align: "right" });

            y += 20;
        });

        // Footer
        const bottom = doc.page.height - 50;
        doc
            .fontSize(8)
            .fillColor("#9CA3AF")
            .text("Gerado automaticamente por ReembolsaJus", 50, bottom, { align: "center" });

        doc.end();

        stream.on("finish", () => resolve());
        stream.on("error", (err) => reject(err));
    });
}

function resultEmailName(email: string): string {
    return email.split("@")[0];
}
