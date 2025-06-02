import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Market } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TradingPanelProps {
  market: Market | null;
  userBalance: string;
}

export default function TradingPanel({ market, userBalance }: TradingPanelProps) {
  const [tradeType, setTradeType] = useState<"CALL" | "PUT">("CALL");
  const [stakeAmount, setStakeAmount] = useState("100.00");
  const [duration, setDuration] = useState("5");
  const [durationType, setDurationType] = useState("minutes");
  const [contractType, setContractType] = useState("Higher/Lower");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      return apiRequest("POST", "/api/trades", tradeData);
    },
    onSuccess: () => {
      toast({
        title: "Trade Executed",
        description: `Your ${market?.symbol} trade has been placed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/positions/user/1'] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

  const handlePlaceTrade = () => {
    if (!market) {
      toast({
        title: "Error",
        description: "Please select a market first",
        variant: "destructive",
      });
      return;
    }

    const tradeData = {
      userId: 1, // Demo user ID
      symbol: market.symbol,
      tradeType,
      contractType,
      stake: stakeAmount,
      duration: parseInt(duration),
      durationType,
      status: "open",
    };

    placeTradeMutation.mutate(tradeData);
  };

  const potentialPayout = (parseFloat(stakeAmount) * 1.85).toFixed(2);
  const potentialProfit = (parseFloat(potentialPayout) - parseFloat(stakeAmount)).toFixed(2);

  return (
    <div className="w-80 bg-[hsl(var(--trading-slate))] border-r border-[hsl(var(--trading-gray))] p-6 overflow-y-auto">
      <h2 className="text-lg font-bold mb-6 text-white">Place New Trade</h2>
      
      {/* Market Selection */}
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-2 text-white">Market</Label>
        <div className="relative">
          <Select value={market?.symbol || "none"} disabled>
            <SelectTrigger className="w-full bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white">
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {market ? (
                <SelectItem value={market.symbol}>{market.symbol}</SelectItem>
              ) : (
                <SelectItem value="none">No market selected</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contract Type */}
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-2 text-white">Contract Type</Label>
        <Select value={contractType} onValueChange={setContractType}>
          <SelectTrigger className="w-full bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Higher/Lower">Higher/Lower</SelectItem>
            <SelectItem value="Touch/No Touch">Touch/No Touch</SelectItem>
            <SelectItem value="In/Out">In/Out</SelectItem>
            <SelectItem value="Asian Options">Asian Options</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade Type */}
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-2 text-white">Prediction</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => setTradeType("CALL")}
            className={`px-4 py-3 font-medium transition-colors ${
              tradeType === "CALL"
                ? "bg-[hsl(var(--profit-green))] hover:bg-green-600 text-white"
                : "bg-[hsl(var(--trading-gray))] hover:bg-gray-600 text-white"
            }`}
          >
            <i className="fas fa-arrow-up mr-2"></i>HIGHER
          </Button>
          <Button
            onClick={() => setTradeType("PUT")}
            className={`px-4 py-3 font-medium transition-colors ${
              tradeType === "PUT"
                ? "bg-[hsl(var(--loss-red))] hover:bg-red-600 text-white"
                : "bg-[hsl(var(--trading-gray))] hover:bg-gray-600 text-white"
            }`}
          >
            <i className="fas fa-arrow-down mr-2"></i>LOWER
          </Button>
        </div>
      </div>

      {/* Stake Amount */}
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-2 text-white">Stake Amount</Label>
        <div className="relative">
          <Input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white pl-8"
            placeholder="100.00"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
        </div>
        <div className="flex gap-2 mt-2">
          {["10", "50", "100"].map((amount) => (
            <Button
              key={amount}
              onClick={() => setStakeAmount(amount)}
              variant="outline"
              size="sm"
              className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white hover:bg-gray-600"
            >
              ${amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-2 text-white">Duration</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
            placeholder="5"
          />
          <Select value={durationType} onValueChange={setDurationType}>
            <SelectTrigger className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Potential Payout */}
      <div className="bg-[hsl(var(--trading-gray))] rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Potential Payout</span>
          <span className="text-lg font-bold text-[hsl(var(--profit-green))]">${potentialPayout}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Potential Profit</span>
          <span className="text-sm font-medium text-[hsl(var(--profit-green))]">${potentialProfit}</span>
        </div>
      </div>

      {/* Place Trade Button */}
      <Button
        onClick={handlePlaceTrade}
        disabled={placeTradeMutation.isPending || !market}
        className="w-full bg-gradient-to-r from-[hsl(var(--profit-green))] to-green-600 hover:from-green-600 hover:to-green-700 py-4 font-bold text-lg transition-all duration-200 text-white"
      >
        {placeTradeMutation.isPending ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>Placing Trade...
          </>
        ) : (
          <>
            <i className="fas fa-chart-line mr-2"></i>Place Trade
          </>
        )}
      </Button>

      {/* Risk Warning */}
      <div className="mt-4 p-3 bg-[hsl(var(--warning-amber))]/10 border border-[hsl(var(--warning-amber))]/20 rounded-lg">
        <p className="text-xs text-[hsl(var(--warning-amber))]">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Trading involves risk. You may lose your entire investment.
        </p>
      </div>
    </div>
  );
}
