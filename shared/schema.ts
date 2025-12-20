import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing"
]);

export const uploadStatusEnum = pgEnum("upload_status", [
  "pending",
  "parsing",
  "analyzing",
  "review",
  "completed",
  "failed",
  "concierge"
]);

export const transactionCategoryEnum = pgEnum("transaction_category", [
  "reimbursable",
  "not_reimbursable",
  "review"
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  freeUploadsUsed: integer("free_uploads_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  plan: text("plan").notNull().default("basic"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  uploadsUsedThisMonth: integer("uploads_used_this_month").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  status: uploadStatusEnum("status").notNull().default("pending"),
  processingError: text("processing_error"),
  totalItems: integer("total_items"),
  reimbursableTotal: decimal("reimbursable_total", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id").notNull().references(() => uploads.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: transactionCategoryEnum("category").notNull().default("review"),
  tag: text("tag"),
  clientName: text("client_name"),
  isIncluded: boolean("is_included").notNull().default(true),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  highlightTokens: text("highlight_tokens").array(),
  editedByUser: boolean("edited_by_user").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  uploadId: integer("upload_id").notNull().references(() => uploads.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  itemCount: integer("item_count").notNull(),
  clientsSummary: json("clients_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: json("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertUploadSchema = createInsertSchema(uploads);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertReportSchema = createInsertSchema(reports);
export const insertAuditLogSchema = createInsertSchema(auditLogs);

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
