import { db } from "./db";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import {
  users,
  subscriptions,
  uploads,
  transactions,
  reports,
  auditLogs,
  InsertUser,
  InsertSubscription,
  InsertUpload,
  InsertTransaction,
  InsertReport,
  InsertAuditLog,
  User,
  Subscription,
  Upload,
  Transaction,
  Report,
  AuditLog,
} from "../shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserFreeUploads(id: string, count: number): Promise<User | undefined>;

  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  getUploadsByUserId(userId: string): Promise<Upload[]>;
  updateUpload(id: number, data: Partial<InsertUpload>): Promise<Upload | undefined>;
  countUserUploadsThisMonth(userId: string): Promise<number>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  getTransactionsByUploadId(uploadId: number): Promise<Transaction[]>;
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<void>;

  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUserId(userId: string): Promise<Report[]>;

  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserFreeUploads(id: string, count: number): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ freeUploadsUsed: count })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return sub;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [created] = await db.insert(uploads).values(upload).returning();
    return created;
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getUploadsByUserId(userId: string): Promise<Upload[]> {
    return db
      .select()
      .from(uploads)
      .where(eq(uploads.userId, userId))
      .orderBy(desc(uploads.createdAt));
  }

  async updateUpload(id: number, data: Partial<InsertUpload>): Promise<Upload | undefined> {
    const [updated] = await db
      .update(uploads)
      .set(data)
      .where(eq(uploads.id, id))
      .returning();
    return updated;
  }

  async countUserUploadsThisMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await db
      .select()
      .from(uploads)
      .where(
        and(
          eq(uploads.userId, userId),
          gte(uploads.createdAt, startOfMonth),
          lt(uploads.createdAt, endOfMonth)
        )
      );
    return result.length;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async createTransactions(transactionList: InsertTransaction[]): Promise<Transaction[]> {
    if (transactionList.length === 0) return [];
    return db.insert(transactions).values(transactionList).returning();
  }

  async getTransactionsByUploadId(uploadId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.uploadId, uploadId))
      .orderBy(desc(transactions.date));
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date(), editedByUser: true })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
