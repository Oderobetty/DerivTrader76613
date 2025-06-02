import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    // Send initial market data
    storage.getAllMarkets().then(markets => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'markets', data: markets }));
      }
    });

    // Handle Deriv API connection
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'deriv_connect') {
          // Initialize Deriv WebSocket connection
          console.log('Connecting to Deriv API with app_id: 76613');
          
          // Send connection status
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'deriv_status', 
              status: 'connected',
              app_id: '76613'
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Simulate real-time price updates
  setInterval(() => {
    storage.getAllMarkets().then(markets => {
      const updatedMarkets = markets.map(market => {
        const change = (Math.random() - 0.5) * 0.002;
        const newPrice = (parseFloat(market.currentPrice || "0") + change).toFixed(5);
        const newChange = change.toFixed(5);
        const newChangePercent = (change * 100).toFixed(2);
        
        // Update in storage
        storage.updateMarket(market.symbol, {
          currentPrice: newPrice,
          change: newChange,
          changePercent: newChangePercent,
        });

        return {
          ...market,
          currentPrice: newPrice,
          change: newChange,
          changePercent: newChangePercent,
        };
      });

      // Broadcast to all connected clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'price_update', 
            data: updatedMarkets 
          }));
        }
      });
    });
  }, 2000);

  // API Routes
  
  // Get all markets
  app.get("/api/markets", async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  // Get market by symbol
  app.get("/api/markets/:symbol", async (req, res) => {
    try {
      const market = await storage.getMarket(req.params.symbol);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      res.json(market);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market" });
    }
  });

  // Place new trade
  app.post("/api/trades", async (req, res) => {
    try {
      const validatedData = insertTradeSchema.parse(req.body);
      
      // Get current market price
      const market = await storage.getMarket(validatedData.symbol);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      // Create trade with entry price
      const trade = await storage.createTrade({
        ...validatedData,
        entryPrice: market.currentPrice || "0",
      });

      // Calculate potential payout (demo calculation)
      const payout = (parseFloat(validatedData.stake) * 1.85).toFixed(2);
      
      // Broadcast trade update
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'trade_placed', 
            data: { ...trade, payout } 
          }));
        }
      });

      res.json({ ...trade, payout });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place trade" });
    }
  });

  // Get user trades
  app.get("/api/trades/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trades = await storage.getTradesByUser(userId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Get user open positions
  app.get("/api/positions/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await storage.getOpenTradesByUser(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Close trade
  app.post("/api/trades/:tradeId/close", async (req, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const { exitPrice, payout, profit } = req.body;
      
      await storage.closeTrade(tradeId, exitPrice, payout, profit);
      
      // Broadcast trade closure
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'trade_closed', 
            data: { tradeId, exitPrice, payout, profit } 
          }));
        }
      });

      res.json({ message: "Trade closed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to close trade" });
    }
  });

  // Mock user for demo purposes
  app.get("/api/user/demo", async (req, res) => {
    try {
      const demoUser = {
        id: 1,
        username: "demo_trader",
        balance: "10247.50",
        derivAccountId: "76613",
      };
      res.json(demoUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  return httpServer;
}
