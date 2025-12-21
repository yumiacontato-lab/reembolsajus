import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { protectedRoute, getAuth } from "./auth";

export function registerRoutes(app: Express): void {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/user/sync", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await storage.getUser(userId);

      if (!user) {
        user = await storage.createUser({
          id: userId,
          email,
          name: name || null,
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/user/me", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found. Please sync your account first." });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const uploadsThisMonth = await storage.countUserUploadsThisMonth(userId);

      res.json({
        user,
        subscription: subscription || null,
        uploadsThisMonth,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/user/upload-eligibility", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const hasActiveSubscription = subscription?.status === "active";
      const uploadsThisMonth = await storage.countUserUploadsThisMonth(userId);

      const FREE_UPLOAD_LIMIT = 5;
      const MONTHLY_UPLOAD_LIMIT = 3;

      let canUpload = false;
      let reason = "";
      let remainingUploads = 0;

      if (!hasActiveSubscription) {
        if (user.freeUploadsUsed < FREE_UPLOAD_LIMIT) {
          canUpload = true;
          remainingUploads = FREE_UPLOAD_LIMIT - user.freeUploadsUsed;
          reason = `Você tem ${remainingUploads} upload${remainingUploads > 1 ? 's' : ''} gratuito${remainingUploads > 1 ? 's' : ''} restante${remainingUploads > 1 ? 's' : ''}.`;
        } else {
          canUpload = false;
          remainingUploads = 0;
          reason = "Você atingiu o limite de uploads gratuitos. Assine o plano para continuar.";
        }
      } else {
        if (uploadsThisMonth < MONTHLY_UPLOAD_LIMIT) {
          canUpload = true;
          remainingUploads = MONTHLY_UPLOAD_LIMIT - uploadsThisMonth;
          reason = `Você tem ${remainingUploads} upload${remainingUploads > 1 ? 's' : ''} restante${remainingUploads > 1 ? 's' : ''} este mês.`;
        } else {
          canUpload = false;
          remainingUploads = 0;
          reason = "Você atingiu o limite mensal de uploads. Aguarde o próximo ciclo de cobrança.";
        }
      }

      res.json({
        canUpload,
        reason,
        remainingUploads,
        freeUploadsUsed: user.freeUploadsUsed,
        freeUploadsLimit: FREE_UPLOAD_LIMIT,
        hasActiveSubscription,
        uploadsThisMonth,
        monthlyLimit: MONTHLY_UPLOAD_LIMIT,
      });
    } catch (error) {
      console.error("Error checking upload eligibility:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/uploads", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const uploads = await storage.getUploadsByUserId(userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/upload/:id", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const upload = await storage.getUpload(parseInt(req.params.id));

      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(upload);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/transactions/:uploadId", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const uploadId = parseInt(req.params.uploadId);

      const upload = await storage.getUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const transactions = await storage.getTransactionsByUploadId(uploadId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/transaction/:id", protectedRoute, async (req: Request, res: Response) => {
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

  app.delete("/api/transaction/:id", protectedRoute, async (req: Request, res: Response) => {
    try {
      await storage.deleteTransaction(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/reports", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const reports = await storage.getReportsByUserId(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/report/:id", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const report = await storage.getReport(parseInt(req.params.id));

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
