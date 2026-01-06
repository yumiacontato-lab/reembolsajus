import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { clerkAuthMiddleware } from "./auth";

const app = express();
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhook")) {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: false }));
app.use(clerkAuthMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse !== undefined) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          logLine += " :: [unserializable]";
        }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

function getErrorStatus(err: unknown): number {
  if (!err || typeof err !== "object") return 500;

  if ("status" in err && typeof (err as { status: unknown }).status === "number") {
    return (err as { status: number }).status;
  }

  if ("statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number") {
    return (err as { statusCode: number }).statusCode;
  }

  return 500;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Internal Server Error";
}

(async () => {
  const server = createServer(app);

  registerRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);

    res.status(status).json({ message });
    console.error(err);
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }

  const port = 5001;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
