import { users, markets, trades, type User, type InsertUser, type Market, type InsertMarket, type Trade, type InsertTrade } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: string): Promise<void>;

  // Market operations
  getAllMarkets(): Promise<Market[]>;
  getMarket(symbol: string): Promise<Market | undefined>;
  updateMarket(symbol: string, updates: Partial<Market>): Promise<void>;
  createMarket(market: InsertMarket): Promise<Market>;

  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getOpenTradesByUser(userId: number): Promise<Trade[]>;
  updateTrade(tradeId: number, updates: Partial<Trade>): Promise<void>;
  closeTrade(tradeId: number, exitPrice: string, payout: string, profit: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private markets: Map<string, Market>;
  private trades: Map<number, Trade>;
  private currentUserId: number;
  private currentTradeId: number;

  constructor() {
    this.users = new Map();
    this.markets = new Map();
    this.trades = new Map();
    this.currentUserId = 1;
    this.currentTradeId = 1;

    // Initialize with demo markets
    this.initializeMarkets();
  }

  private initializeMarkets() {
    const demoMarkets: Market[] = [
      {
        id: 1,
        symbol: "EUR/USD",
        name: "Euro vs US Dollar",
        category: "forex",
        currentPrice: "1.08547",
        change: "0.0023",
        changePercent: "0.21",
        high: "1.08721",
        low: "1.08324",
        volume: "2.4M",
        isActive: true,
        lastUpdate: new Date(),
      },
      {
        id: 2,
        symbol: "GBP/USD",
        name: "British Pound vs US Dollar",
        category: "forex",
        currentPrice: "1.27845",
        change: "-0.0012",
        changePercent: "-0.09",
        high: "1.28021",
        low: "1.27654",
        volume: "1.8M",
        isActive: true,
        lastUpdate: new Date(),
      },
      {
        id: 3,
        symbol: "BTC/USD",
        name: "Bitcoin vs US Dollar",
        category: "crypto",
        currentPrice: "43127.50",
        change: "847.20",
        changePercent: "2.01",
        high: "43850.00",
        low: "42100.00",
        volume: "24.5K",
        isActive: true,
        lastUpdate: new Date(),
      },
    ];

    demoMarkets.forEach((market) => {
      this.markets.set(market.symbol, market);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      derivAccountId: insertUser.derivAccountId || null,
      balance: "10000.00",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
    }
  }

  // Market operations
  async getAllMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values());
  }

  async getMarket(symbol: string): Promise<Market | undefined> {
    return this.markets.get(symbol);
  }

  async updateMarket(symbol: string, updates: Partial<Market>): Promise<void> {
    const market = this.markets.get(symbol);
    if (market) {
      const updatedMarket = { ...market, ...updates, lastUpdate: new Date() };
      this.markets.set(symbol, updatedMarket);
    }
  }

  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const id = this.markets.size + 1;
    const market: Market = { 
      id,
      symbol: insertMarket.symbol,
      name: insertMarket.name,
      category: insertMarket.category,
      currentPrice: insertMarket.currentPrice || null,
      change: insertMarket.change || null,
      changePercent: insertMarket.changePercent || null,
      high: insertMarket.high || null,
      low: insertMarket.low || null,
      volume: insertMarket.volume || null,
      isActive: insertMarket.isActive !== undefined ? insertMarket.isActive : true,
      lastUpdate: new Date(),
    };
    this.markets.set(market.symbol, market);
    return market;
  }

  // Trade operations
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = { 
      id,
      userId: insertTrade.userId,
      symbol: insertTrade.symbol,
      tradeType: insertTrade.tradeType,
      contractType: insertTrade.contractType,
      stake: insertTrade.stake,
      entryPrice: insertTrade.entryPrice || null,
      exitPrice: null,
      duration: insertTrade.duration,
      durationType: insertTrade.durationType,
      status: insertTrade.status || "open",
      payout: null,
      profit: null,
      derivTradeId: insertTrade.derivTradeId || null,
      createdAt: new Date(),
      closedAt: null,
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId,
    );
  }

  async getOpenTradesByUser(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId && trade.status === "open",
    );
  }

  async updateTrade(tradeId: number, updates: Partial<Trade>): Promise<void> {
    const trade = this.trades.get(tradeId);
    if (trade) {
      const updatedTrade = { ...trade, ...updates };
      this.trades.set(tradeId, updatedTrade);
    }
  }

  async closeTrade(tradeId: number, exitPrice: string, payout: string, profit: string): Promise<void> {
    const trade = this.trades.get(tradeId);
    if (trade) {
      const updatedTrade = { 
        ...trade, 
        exitPrice,
        payout,
        profit,
        status: parseFloat(profit) > 0 ? "won" : "lost",
        closedAt: new Date(),
      };
      this.trades.set(tradeId, updatedTrade);
    }
  }
}

export const storage = new MemStorage();
