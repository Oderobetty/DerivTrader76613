import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  derivAccountId: text("deriv_account_id"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
