import type { Express, Request, Response } from "express";
import { storage } from "./storage";

export function registerRoutes(app: Express): void {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/uploads/:userId", async (req: Request, res: Response) => {
    try {
      const uploads = await storage.getUploadsByUserId(req.params.userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/upload/:id", async (req: Request, res: Response) => {
    try {
      const upload = await storage.getUpload(parseInt(req.params.id));
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      res.json(upload);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/transactions/:uploadId", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactionsByUploadId(parseInt(req.params.uploadId));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/transaction/:id", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateTransaction(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/transaction/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteTransaction(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/reports/:userId", async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReportsByUserId(req.params.userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/report/:id", async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/user/:userId/upload-count", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(req.params.userId);
      const uploadsThisMonth = await storage.countUserUploadsThisMonth(req.params.userId);

      res.json({
        freeUploadsUsed: user.freeUploadsUsed,
        freeUploadsLimit: 5,
        hasActiveSubscription: subscription?.status === "active",
        uploadsThisMonth,
        monthlyLimit: 3,
      });
    } catch (error) {
      console.error("Error fetching upload count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
