import DerivAPI from './deriv-api';
import { storage } from './storage';
import type { User, Trade } from '@shared/schema';

export interface ClientAccount {
  userId: number;
  derivAccountId: string;
  apiToken: string;
  balance: string;
  currency: string;
  isActive: boolean;
}

export interface TradeRequest {
  clientId: number;
  symbol: string;
  tradeType: 'CALL' | 'PUT';
  amount: number;
  duration: number;
  durationType: 'm' | 'h' | 'd';
  contractType: string;
}

export class ClientManager {
  private clientAPIs = new Map<number, DerivAPI>();
  private activeConnections = new Map<number, boolean>();

  async connectClient(clientAccount: ClientAccount): Promise<boolean> {
    try {
      const derivAPI = new DerivAPI({
        appId: '76613',
        apiToken: clientAccount.apiToken
      });

      await derivAPI.connect();

      // Set up event handlers for this client
      derivAPI.on('connected', () => {
        console.log(`Client ${clientAccount.userId} connected to Deriv API`);
        this.activeConnections.set(clientAccount.userId, true);
      });

      derivAPI.on('disconnected', () => {
        console.log(`Client ${clientAccount.userId} disconnected from Deriv API`);
        this.activeConnections.set(clientAccount.userId, false);
      });

      derivAPI.on('authorized', (authData) => {
        console.log(`Client ${clientAccount.userId} authorized:`, authData);
        this.updateClientBalance(clientAccount.userId, authData);
      });

      derivAPI.on('trade_result', (tradeResult) => {
        this.handleTradeResult(clientAccount.userId, tradeResult);
      });

      this.clientAPIs.set(clientAccount.userId, derivAPI);
      return true;
    } catch (error) {
      console.error(`Failed to connect client ${clientAccount.userId}:`, error);
      return false;
    }
  }

  async disconnectClient(clientId: number): Promise<void> {
    const derivAPI = this.clientAPIs.get(clientId);
    if (derivAPI) {
      derivAPI.disconnect();
      this.clientAPIs.delete(clientId);
      this.activeConnections.delete(clientId);
    }
  }

  async placeTradeForClient(tradeRequest: TradeRequest): Promise<any> {
    const derivAPI = this.clientAPIs.get(tradeRequest.clientId);
    
    if (!derivAPI || !this.activeConnections.get(tradeRequest.clientId)) {
      throw new Error('Client not connected to Deriv API');
    }

    try {
      // Place trade through Deriv API
      await derivAPI.placeTrade({
        symbol: tradeRequest.symbol,
        tradeType: tradeRequest.tradeType,
        amount: tradeRequest.amount,
        duration: tradeRequest.duration,
        durationType: tradeRequest.durationType,
        basis: 'stake'
      });

      // Record trade in local storage
      const trade = await storage.createTrade({
        userId: tradeRequest.clientId,
        symbol: tradeRequest.symbol,
        tradeType: tradeRequest.tradeType,
        contractType: tradeRequest.contractType,
        stake: tradeRequest.amount.toString(),
        duration: tradeRequest.duration,
        durationType: tradeRequest.durationType === 'm' ? 'minutes' : 
                     tradeRequest.durationType === 'h' ? 'hours' : 'days',
        status: 'open'
      });

      return trade;
    } catch (error) {
      console.error(`Trade failed for client ${tradeRequest.clientId}:`, error);
      throw error;
    }
  }

  async getClientBalance(clientId: number): Promise<string | null> {
    const user = await storage.getUser(clientId);
    return user?.balance || null;
  }

  async updateClientBalance(clientId: number, authData: any): Promise<void> {
    if (authData.authorize && authData.authorize.balance) {
      await storage.updateUserBalance(clientId, authData.authorize.balance.toString());
    }
  }

  private async handleTradeResult(clientId: number, tradeResult: any): Promise<void> {
    console.log(`Trade result for client ${clientId}:`, tradeResult);
    
    if (tradeResult.buy) {
      const { contract_id, payout, longcode } = tradeResult.buy;
      
      // Update trade record with Deriv contract ID
      // This would need to be implemented based on your specific requirements
      console.log(`Trade placed: Contract ID ${contract_id}, Payout: ${payout}`);
    }
  }

  async getClientTrades(clientId: number): Promise<Trade[]> {
    return await storage.getTradesByUser(clientId);
  }

  async getClientActivePositions(clientId: number): Promise<Trade[]> {
    return await storage.getOpenTradesByUser(clientId);
  }

  isClientConnected(clientId: number): boolean {
    return this.activeConnections.get(clientId) || false;
  }

  async getAllConnectedClients(): Promise<number[]> {
    return Array.from(this.activeConnections.entries())
      .filter(([_, connected]) => connected)
      .map(([clientId, _]) => clientId);
  }

  async subscribeClientToMarketData(clientId: number, symbols: string[]): Promise<void> {
    const derivAPI = this.clientAPIs.get(clientId);
    if (derivAPI && this.activeConnections.get(clientId)) {
      for (const symbol of symbols) {
        await derivAPI.subscribeToTicks(symbol);
      }
    }
  }

  async unsubscribeClientFromMarketData(clientId: number, symbols: string[]): Promise<void> {
    const derivAPI = this.clientAPIs.get(clientId);
    if (derivAPI && this.activeConnections.get(clientId)) {
      for (const symbol of symbols) {
        await derivAPI.unsubscribeFromTicks(symbol);
      }
    }
  }
}

export const clientManager = new ClientManager();