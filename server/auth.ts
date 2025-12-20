import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export const clerkAuthMiddleware = clerkMiddleware();

export const requireAuthMiddleware = requireAuth();

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  (req as any).userId = auth?.userId || null;
  next();
}

export function protectedRoute(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = auth.userId;
  next();
}

export { getAuth };
