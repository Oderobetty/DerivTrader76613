import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface DerivAPIConfig {
  appId: string;
  apiToken?: string;
  wsUrl?: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  quote: number;
  spot?: number;
}

export interface TicksResponse {
  tick: {
    symbol: string;
    quote: number;
    epoch: number;
  };
}

export class DerivAPI extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: DerivAPIConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private subscriptions = new Map<string, string>();

  constructor(config: DerivAPIConfig) {
    super();
    this.config = {
      wsUrl: 'wss://ws.binaryws.com/websockets/v3',
      ...config
    };
  }

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(`${this.config.wsUrl}?app_id=${this.config.appId}`);
      
      this.ws.on('open', () => {
        console.log('Connected to Deriv WebSocket API');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Authenticate if token is provided
        if (this.config.apiToken) {
          this.authorize();
        }
      });

      this.ws.on('message', (data: string) => {
        try {
          const response = JSON.parse(data);
          this.handleMessage(response);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('Disconnected from Deriv WebSocket API');
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('Deriv WebSocket error:', error);
        this.emit('error', error);
      });

    } catch (error) {
      console.error('Failed to connect to Deriv API:', error);
      this.emit('error', error);
    }
  }

  private handleMessage(response: any) {
    if (response.msg_type === 'tick') {
      this.emit('tick', response);
    } else if (response.msg_type === 'authorize') {
      this.emit('authorized', response);
    } else if (response.msg_type === 'active_symbols') {
      this.emit('symbols', response);
    } else if (response.msg_type === 'buy') {
      this.emit('trade_result', response);
    } else if (response.error) {
      console.error('Deriv API error:', response.error);
      this.emit('api_error', response.error);
    }
  }

  private async authorize() {
    if (!this.config.apiToken) return;
    
    const request = {
      authorize: this.config.apiToken
    };
    
    this.send(request);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_reached');
    }
  }

  async getActiveSymbols(): Promise<void> {
    const request = {
      active_symbols: "brief",
      product_type: "basic"
    };
    
    this.send(request);
  }

  async subscribeToTicks(symbol: string): Promise<void> {
    const request = {
      ticks: symbol,
      subscribe: 1
    };
    
    const reqId = this.generateRequestId();
    this.subscriptions.set(symbol, reqId);
    
    this.send({ ...request, req_id: reqId });
  }

  async unsubscribeFromTicks(symbol: string): Promise<void> {
    const reqId = this.subscriptions.get(symbol);
    if (reqId) {
      const request = {
        forget: reqId
      };
      
      this.send(request);
      this.subscriptions.delete(symbol);
    }
  }

  async placeTrade(options: {
    symbol: string;
    tradeType: 'CALL' | 'PUT';
    amount: number;
    duration: number;
    durationType: 'm' | 'h' | 'd';
    basis: 'stake' | 'payout';
  }): Promise<void> {
    if (!this.config.apiToken) {
      throw new Error('API token required for trading');
    }

    const contractType = options.tradeType === 'CALL' ? 'CALLE' : 'PUTE';
    
    const request = {
      buy: 1,
      price: options.amount,
      parameters: {
        amount: options.amount,
        basis: options.basis,
        contract_type: contractType,
        currency: 'USD',
        duration: options.duration,
        duration_unit: options.durationType,
        symbol: options.symbol
      }
    };
    
    this.send(request);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  private generateRequestId(): number {
    return Math.floor(Math.random() * 1000000000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export default DerivAPI;