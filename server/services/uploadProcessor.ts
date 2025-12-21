import { storage } from "../storage";
import { parsePDF } from "./pdfParser";
import { classifyTransactionsWithAI } from "./aiClassifier";
import type { InsertTransaction } from "../../shared/schema";

export interface ProcessingResult {
  success: boolean;
  uploadId: number;
  transactionCount: number;
  reimbursableTotal: number;
  error?: string;
}

export async function processUpload(uploadId: number, filePath: string): Promise<ProcessingResult> {
  try {
    await storage.updateUpload(uploadId, { status: "parsing" });

    const parseResult = await parsePDF(filePath);

    if (parseResult.transactions.length === 0) {
      await storage.updateUpload(uploadId, {
        status: "failed",
        processingError: "Nenhuma transacao encontrada no extrato. Verifique se o PDF e um extrato bancario valido.",
      });
      return {
        success: false,
        uploadId,
        transactionCount: 0,
        reimbursableTotal: 0,
        error: "Nenhuma transacao encontrada",
      };
    }

    await storage.updateUpload(uploadId, { status: "analyzing" });

    const classifiedTransactions = await classifyTransactionsWithAI(parseResult.transactions);

    const upload = await storage.getUpload(uploadId);
    if (!upload) {
      throw new Error("Upload not found");
    }

    const transactionsToInsert: InsertTransaction[] = classifiedTransactions.map(tx => ({
      uploadId,
      date: tx.date,
      amount: tx.amount.toString(),
      description: tx.description,
      category: tx.category,
      tag: tx.tag,
      confidence: tx.confidence.toString(),
      highlightTokens: tx.highlightTokens,
      isIncluded: tx.category === "reimbursable",
    }));

    await storage.createTransactions(transactionsToInsert);

    const reimbursableTotal = classifiedTransactions
      .filter(tx => tx.category === "reimbursable")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const hasReviewItems = classifiedTransactions.some(tx => tx.category === "review");

    await storage.updateUpload(uploadId, {
      status: hasReviewItems ? "review" : "completed",
      totalItems: classifiedTransactions.length,
      reimbursableTotal: reimbursableTotal.toFixed(2),
      processedAt: new Date(),
    });

    return {
      success: true,
      uploadId,
      transactionCount: classifiedTransactions.length,
      reimbursableTotal,
    };
  } catch (error) {
    console.error("Error processing upload:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo";

    await storage.updateUpload(uploadId, {
      status: "failed",
      processingError: errorMessage,
    });

    return {
      success: false,
      uploadId,
      transactionCount: 0,
      reimbursableTotal: 0,
      error: errorMessage,
    };
  }
}
