import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { z } from "zod";
import DerivAPI from "./deriv-api";
import { clientManager } from "./client-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize Deriv API
  const derivAPI = new DerivAPI({
    appId: '76613',
    apiToken: process.env.DERIV_API_TOKEN
  });

  // WebSocket server for real-time data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  // Connect to Deriv API
  try {
    await derivAPI.connect();
    console.log('Connected to Deriv API');
    
    // Subscribe to market data when Deriv API connects
    derivAPI.on('connected', () => {
      derivAPI.getActiveSymbols();
      // Subscribe to popular forex pairs
      ['frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD'].forEach(symbol => {
        derivAPI.subscribeToTicks(symbol);
      });
    });

    // Handle real-time tick data from Deriv
    derivAPI.on('tick', (tickData) => {
      const marketUpdate = {
        symbol: tickData.tick.symbol,
        currentPrice: tickData.tick.quote.toString(),
        lastUpdate: new Date()
      };

      // Update local storage
      storage.updateMarket(tickData.tick.symbol, marketUpdate);

      // Broadcast to all clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'price_update', 
            data: [marketUpdate]
          }));
        }
      });
    });

    // Handle active symbols response
    derivAPI.on('symbols', (symbolsData) => {
      if (symbolsData.active_symbols) {
        const markets = symbolsData.active_symbols
          .filter((symbol: any) => symbol.market === 'forex' && symbol.submarket === 'major_pairs')
          .slice(0, 10) // Limit to first 10 symbols
          .map((symbol: any) => ({
            symbol: symbol.symbol,
            name: symbol.display_name,
            category: 'forex',
            currentPrice: '0.00000',
            change: '0.00000',
            changePercent: '0.00',
            high: '0.00000',
            low: '0.00000',
            volume: '0',
            isActive: true
          }));

        // Store markets in local storage
        markets.forEach((market: any) => {
          storage.createMarket(market).catch(console.error);
        });
      }
    });

  } catch (error) {
    console.error('Failed to connect to Deriv API:', error);
    console.log('Using demo mode with simulated data');
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    // Send initial market data
    storage.getAllMarkets().then(markets => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'markets', data: markets }));
      }
    });

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'deriv_connect') {
          console.log('Client requesting Deriv API connection');
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'deriv_status', 
              status: derivAPI.connected ? 'connected' : 'disconnected',
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

      // If Deriv API is connected and token is available, place real trade
      if (derivAPI.connected && process.env.DERIV_API_TOKEN) {
        try {
          // Place trade through Deriv API
          await derivAPI.placeTrade({
            symbol: validatedData.symbol,
            tradeType: validatedData.tradeType as 'CALL' | 'PUT',
            amount: parseFloat(validatedData.stake),
            duration: validatedData.duration,
            durationType: validatedData.durationType === 'minutes' ? 'm' : 
                         validatedData.durationType === 'hours' ? 'h' : 'd',
            basis: 'stake'
          });

          console.log('Trade placed through Deriv API');
        } catch (derivError) {
          console.error('Deriv API trade error:', derivError);
          return res.status(500).json({ message: "Failed to place trade with Deriv API" });
        }
      }

      // Create trade record in local storage
      const trade = await storage.createTrade({
        ...validatedData,
        entryPrice: market.currentPrice || "0",
      });

      // Calculate potential payout
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

  // Client Management Endpoints

  // Connect a client to Deriv API
  app.post("/api/clients/connect", async (req, res) => {
    try {
      const { userId, derivAccountId, apiToken, currency = 'USD' } = req.body;

      if (!apiToken) {
        return res.status(400).json({ message: "API token is required" });
      }

      const success = await clientManager.connectClient({
        userId,
        derivAccountId,
        apiToken,
        balance: "0",
        currency,
        isActive: true
      });

      if (success) {
        res.json({ message: "Client connected successfully", connected: true });
      } else {
        res.status(500).json({ message: "Failed to connect client" });
      }
    } catch (error) {
      res.status(500).json({ message: "Connection error" });
    }
  });

  // Disconnect a client
  app.post("/api/clients/:clientId/disconnect", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      await clientManager.disconnectClient(clientId);
      res.json({ message: "Client disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect client" });
    }
  });

  // Place trade for a specific client
  app.post("/api/clients/:clientId/trade", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const { symbol, tradeType, amount, duration, durationType, contractType } = req.body;

      const trade = await clientManager.placeTradeForClient({
        clientId,
        symbol,
        tradeType,
        amount,
        duration,
        durationType,
        contractType
      });

      res.json({ trade, message: "Trade placed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to place trade" });
    }
  });

  // Get client balance
  app.get("/api/clients/:clientId/balance", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const balance = await clientManager.getClientBalance(clientId);
      
      if (balance !== null) {
        res.json({ balance, connected: clientManager.isClientConnected(clientId) });
      } else {
        res.status(404).json({ message: "Client not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Get client trades
  app.get("/api/clients/:clientId/trades", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const trades = await clientManager.getClientTrades(clientId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Get client active positions
  app.get("/api/clients/:clientId/positions", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const positions = await clientManager.getClientActivePositions(clientId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Get all connected clients
  app.get("/api/clients/connected", async (req, res) => {
    try {
      const connectedClients = await clientManager.getAllConnectedClients();
      res.json({ clients: connectedClients, count: connectedClients.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connected clients" });
    }
  });

  // Subscribe client to market data
  app.post("/api/clients/:clientId/subscribe", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const { symbols } = req.body;

      await clientManager.subscribeClientToMarketData(clientId, symbols);
      res.json({ message: "Subscribed to market data successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to subscribe to market data" });
    }
  });

  // Demo user endpoint (fallback for testing without real API tokens)
  app.get("/api/user/demo", async (req, res) => {
    try {
      const demoUser = {
        id: 1,
        username: "demo_trader",
        balance: "10247.50",
        derivAccountId: "76613",
        connected: false,
        message: "Connect with real API token for live trading"
      };
      res.json(demoUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  return httpServer;
}
