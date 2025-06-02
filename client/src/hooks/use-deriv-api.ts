import { useState, useEffect, useRef } from "react";
import { type Market } from "@shared/schema";

export function useDerivAPI() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to trading WebSocket');
      
      // Send Deriv API connection request
      ws.send(JSON.stringify({ 
        type: 'deriv_connect',
        app_id: '76613'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'markets':
            setMarkets(data.data);
            if (!selectedMarket && data.data.length > 0) {
              setSelectedMarket(data.data[0]);
            }
            break;
            
          case 'price_update':
            setMarkets(data.data);
            // Update selected market if it matches
            if (selectedMarket) {
              const updatedMarket = data.data.find((m: Market) => m.symbol === selectedMarket.symbol);
              if (updatedMarket) {
                setSelectedMarket(updatedMarket);
              }
            }
            break;
            
          case 'deriv_status':
            console.log('Deriv API status:', data.status, 'App ID:', data.app_id);
            break;
            
          case 'trade_placed':
            console.log('Trade placed:', data.data);
            break;
            
          case 'trade_closed':
            console.log('Trade closed:', data.data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from trading WebSocket');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return {
    markets,
    selectedMarket,
    setSelectedMarket,
    isConnected,
    websocket: wsRef.current,
  };
}
