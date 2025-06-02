import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table with authentication and roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  password: text("password"),
  role: text("role").notNull().default("client"), // "admin", "client", "trader"
  isActive: boolean("is_active").default(true),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  derivAccountId: text("deriv_account_id"),
  apiToken: text("api_token"), // Encrypted storage for client's Deriv API token
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // forex, crypto, indices
  currentPrice: decimal("current_price", { precision: 10, scale: 5 }),
  change: decimal("change", { precision: 10, scale: 5 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  high: decimal("high", { precision: 10, scale: 5 }),
  low: decimal("low", { precision: 10, scale: 5 }),
  volume: text("volume"),
  isActive: boolean("is_active").default(true),
  lastUpdate: timestamp("last_update").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  tradeType: text("trade_type").notNull(), // CALL, PUT
  contractType: text("contract_type").notNull(), // Higher/Lower, Touch/No Touch, etc.
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }),
  exitPrice: decimal("exit_price", { precision: 10, scale: 5 }),
  duration: integer("duration").notNull(),
  durationType: text("duration_type").notNull(), // minutes, hours, days
  status: text("status").notNull().default("open"), // open, closed, won, lost
  payout: decimal("payout", { precision: 10, scale: 2 }),
  profit: decimal("profit", { precision: 10, scale: 2 }),
  derivTradeId: text("deriv_trade_id"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  lastUpdate: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
