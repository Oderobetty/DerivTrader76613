import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDerivAuth } from "@/hooks/use-deriv-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketData {
  spot: number;
  payout: number;
  symbol: string;
}

interface TradeRequest {
  amount: number;
  contract_type: "CALL" | "PUT";
}

const API_BASE_URL = "https://quantumaixtrade-backend.onrender.com";

export default function MobileTradingPage() {
  const [tradeAmount, setTradeAmount] = useState("100");
  const [selectedContract, setSelectedContract] = useState<"CALL" | "PUT">("CALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, authToken, initiateLogin, logout } = useDerivAuth();

  // Fetch market data
  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery({
    queryKey: ['market-data'],
    queryFn: async (): Promise<MarketData> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/market-data`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: isAuthenticated ? 2000 : false,
    enabled: isAuthenticated,
  });

  // Place trade mutation
  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: TradeRequest) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/trade`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tradeData),
      });
      
      if (!response.ok) {
        throw new Error(`Trade failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Executed",
        description: `Your ${selectedContract} trade has been placed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

  const handleTrade = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount",
        variant: "destructive",
      });
      return;
    }

    placeTradeMutation.mutate({
      amount,
      contract_type: selectedContract,
    });
  };

  const quickAmounts = [10, 50, 100, 250, 500];

  // Show authentication screen if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">ChartBotAixTrade</h1>
            <p className="text-slate-300 mb-8">Professional Binary Options Trading Platform</p>
            <div className="space-y-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Connect with Deriv</h2>
                <p className="text-slate-400 mb-6 text-sm">
                  Authenticate with your Deriv account to start trading binary options with real-time market data.
                </p>
                <Button 
                  onClick={initiateLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  Start Trading
                </Button>
              </div>
              <div className="text-center text-slate-500 text-xs">
                <p>App ID: 76613 • Powered by Deriv API</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* App Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">ChartBotAixTrade</h1>
            <p className="text-blue-100 text-sm mt-1">Binary Options Trading</p>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Market Data Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            {marketLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-400">Loading market data...</span>
              </div>
            ) : marketError ? (
              <div className="text-center py-8">
                <div className="text-red-400 mb-2">
                  <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <p className="text-red-400 text-sm">Failed to load market data</p>
                <p className="text-slate-400 text-xs mt-1">Check your connection</p>
              </div>
            ) : marketData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="font-semibold text-white">{marketData.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Spot Price:</span>
                  <span className="font-bold text-2xl text-green-400">${marketData.spot.toFixed(5)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payout:</span>
                  <span className="font-semibold text-blue-400">{marketData.payout}%</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-slate-400">Live Data</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Place Trade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contract Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Contract Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setSelectedContract("CALL")}
                  className={`py-4 font-bold transition-all ${
                    selectedContract === "CALL"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  <i className="fas fa-arrow-up mr-2"></i>
                  CALL
                </Button>
                <Button
                  onClick={() => setSelectedContract("PUT")}
                  className={`py-4 font-bold transition-all ${
                    selectedContract === "PUT"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  <i className="fas fa-arrow-down mr-2"></i>
                  PUT
                </Button>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Trade Amount ($)
              </label>
              <Input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-lg font-semibold text-center py-3"
                placeholder="Enter amount"
              />
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-5 gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setTradeAmount(amount.toString())}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Potential Payout */}
            {marketData && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Potential Payout:</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${((parseFloat(tradeAmount) || 0) * (marketData.payout / 100)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Potential Profit:</span>
                  <span className="text-blue-400 font-semibold">
                    ${(((parseFloat(tradeAmount) || 0) * (marketData.payout / 100)) - (parseFloat(tradeAmount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Trade Button */}
            <Button
              onClick={handleTrade}
              disabled={placeTradeMutation.isPending || !marketData || marketLoading}
              className={`w-full py-4 font-bold text-lg transition-all ${
                selectedContract === "CALL"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {placeTradeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Placing Trade...
                </>
              ) : (
                <>
                  <i className="fas fa-chart-line mr-2"></i>
                  Place {selectedContract} Trade
                </>
              )}
            </Button>

            {/* Risk Warning */}
            <div className="bg-amber-900/30 border border-amber-600/30 rounded-lg p-3">
              <p className="text-amber-300 text-xs leading-relaxed">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Trading involves significant risk. You may lose your entire investment. Only trade with money you can afford to lose.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${marketData ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-slate-400 text-xs">
              {marketData ? 'Connected to Backend' : 'Connecting...'}
            </span>
          </div>
          <p className="text-slate-500 text-xs">ChartBotAixTrade Platform</p>
        </div>
      </div>
    </div>
  );
}