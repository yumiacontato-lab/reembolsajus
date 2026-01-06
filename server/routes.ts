import type { Express, NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import rateLimit from "express-rate-limit";
import type Stripe from "stripe";
import { storage } from "./storage";
import { protectedRoute } from "./auth";
import { processUpload } from "./services/uploadProcessor";
import { stripe } from "./stripe";
import { generateReportPDF } from "./services/reportGenerator";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function sanitizeFilename(fileName: string): string {
  const base = path.basename(fileName);
  return base.replace(/[^\w.\-()+ ]+/g, "_");
}

function requireUserId(req: Request): string {
  if (typeof req.userId !== "string" || !req.userId) {
    const err = new Error("Unauthorized");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return req.userId;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Internal server error";
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "unpaid" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "trialing":
      return "trialing";
    default:
      return "unpaid";
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + sanitizeFilename(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdfMime && isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF sao permitidos"));
    }
  },
});

const FREE_UPLOAD_LIMIT = 5;
const MONTHLY_UPLOAD_LIMIT = 3;

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Muitas requisicoes, tente novamente mais tarde." }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit uploads to 10 per hour per IP (as a safety net)
  message: { error: "Muitos uploads, tente novamente mais tarde." }
});

export function registerRoutes(app: Express): void {
  // Global API rate limiting
  app.use("/api/", apiLimiter);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID || "price_1Qfo3eP93j8Rj3XyXXXXXX", // Placeholder, requires env var
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
        metadata: { userId },
      });

      res.json({ url: session.url });
    } catch (error: unknown) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Create Customer Portal Session
  app.post("/api/create-portal-session", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);

      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User or Stripe Customer not found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/billing`,
      });

      res.json({ url: session.url });
    } catch (error: unknown) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Stripe Webhook
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const signatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error(`Webhook signature verification failed: ${message}`);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (userId && subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await storage.createSubscription({
              userId,
              stripeSubscriptionId: subscriptionId,
              status: mapStripeSubscriptionStatus(subscription.status),
              plan: "pro", // OR determine based on price
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await storage.updateSubscriptionByStripeId(subscription.id, {
            status: mapStripeSubscriptionStatus(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await storage.updateSubscriptionByStripeId(subscription.id, {
            status: "canceled",
          });
          break;
        }
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      // Don't fail the webhook response or Stripe will retry indefinitely
    }

    res.json({ received: true });
  });

  app.post("/api/user/sync", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUser(userId);

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
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);

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
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const hasActiveSubscription = subscription?.status === "active";
      const uploadsThisMonth = await storage.countUserUploadsThisMonth(userId);

      let canUpload = false;
      let reason = "";
      let remainingUploads = 0;

      if (!hasActiveSubscription) {
        if (user.freeUploadsUsed < FREE_UPLOAD_LIMIT) {
          canUpload = true;
          remainingUploads = FREE_UPLOAD_LIMIT - user.freeUploadsUsed;
          reason = `Voce tem ${remainingUploads} upload${remainingUploads > 1 ? 's' : ''} gratuito${remainingUploads > 1 ? 's' : ''} restante${remainingUploads > 1 ? 's' : ''}.`;
        } else {
          canUpload = false;
          remainingUploads = 0;
          reason = "Voce atingiu o limite de uploads gratuitos. Assine o plano para continuar.";
        }
      } else {
        if (uploadsThisMonth < MONTHLY_UPLOAD_LIMIT) {
          canUpload = true;
          remainingUploads = MONTHLY_UPLOAD_LIMIT - uploadsThisMonth;
          reason = `Voce tem ${remainingUploads} upload${remainingUploads > 1 ? 's' : ''} restante${remainingUploads > 1 ? 's' : ''} este mes.`;
        } else {
          canUpload = false;
          remainingUploads = 0;
          reason = "Voce atingiu o limite mensal de uploads. Aguarde o proximo ciclo de cobranca.";
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

  app.post("/api/upload", protectedRoute, uploadLimiter, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const hasActiveSubscription = subscription?.status === "active";
      const uploadsThisMonth = await storage.countUserUploadsThisMonth(userId);

      let canUpload = false;
      if (!hasActiveSubscription) {
        canUpload = user.freeUploadsUsed < FREE_UPLOAD_LIMIT;
      } else {
        canUpload = uploadsThisMonth < MONTHLY_UPLOAD_LIMIT;
      }

      if (!canUpload) {
        fs.unlinkSync(file.path);
        return res.status(403).json({
          error: "Limite de uploads atingido",
          needsSubscription: !hasActiveSubscription,
        });
      }

      const uploadRecord = await storage.createUpload({
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        filePath: file.path,
        status: "pending",
      });

      if (!hasActiveSubscription) {
        await storage.updateUserFreeUploads(userId, user.freeUploadsUsed + 1);
      }

      processUpload(uploadRecord.id, file.path).catch(err => {
        console.error("Background processing failed:", err);
      });

      res.status(201).json({
        id: uploadRecord.id,
        fileName: uploadRecord.fileName,
        status: uploadRecord.status,
        message: "Upload recebido. Processamento iniciado.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Erro ao processar upload" });
    }
  });

  app.get("/api/uploads", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const uploads = await storage.getUploadsByUserId(userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/upload/:id", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const uploadRecord = await storage.getUpload(parseInt(req.params.id));

      if (!uploadRecord) {
        return res.status(404).json({ error: "Upload not found" });
      }

      if (uploadRecord.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(uploadRecord);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/transactions/:uploadId", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const uploadId = parseInt(req.params.uploadId);

      const uploadRecord = await storage.getUpload(uploadId);
      if (!uploadRecord) {
        return res.status(404).json({ error: "Upload not found" });
      }
      if (uploadRecord.userId !== userId) {
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
      const userId = requireUserId(req);
      const reports = await storage.getReportsByUserId(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/report/:uploadId/generate", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const uploadId = parseInt(req.params.uploadId);

      const user = await storage.getUser(userId);
      const uploadRecord = await storage.getUpload(uploadId);

      if (!user || !uploadRecord) {
        return res.status(404).json({ error: "Not found" });
      }

      if (uploadRecord.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const transactions = await storage.getTransactionsByUploadId(uploadId);
      const reimbursableTransactions = transactions.filter(t => t.category === 'reimbursable' && t.isIncluded);

      const totalAmount = reimbursableTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const itemCount = reimbursableTransactions.length;

      const clientsSummary: Record<string, number> = {};
      reimbursableTransactions.forEach(t => {
        const client = t.clientName || "Não Identificado";
        clientsSummary[client] = (clientsSummary[client] || 0) + parseFloat(t.amount.toString());
      });

      const fileName = `relatorio_${uploadRecord.fileName.replace('.pdf', '')}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Create Report Record First
      const report = await storage.createReport({
        userId,
        uploadId,
        fileName,
        filePath,
        totalAmount: totalAmount.toFixed(2),
        itemCount,
        clientsSummary
      });

      // Generate PDF
      await generateReportPDF(
        { report, transactions: reimbursableTransactions, user },
        filePath
      );

      // Update upload status
      await storage.updateUpload(uploadId, { status: "completed" });

      res.status(201).json(report);
    } catch (error: unknown) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  app.get("/api/report/:id/download", protectedRoute, async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const reportId = parseInt(req.params.id);

      const report = await storage.getReport(reportId);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!fs.existsSync(report.filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }

      res.download(report.filePath, report.fileName);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Arquivo muito grande. O limite e 10MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof Error && err.message === "Apenas arquivos PDF sao permitidos") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
}
