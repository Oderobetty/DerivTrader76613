import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Trade } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface PositionsTableProps {
  positions: Trade[];
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const closeTradeMutation = useMutation({
    mutationFn: async ({ tradeId, exitPrice }: { tradeId: number; exitPrice: string }) => {
      const payout = "0.00"; // Would be calculated based on actual outcome
      const profit = "-100.00"; // Would be calculated based on actual outcome
      return apiRequest("POST", `/api/trades/${tradeId}/close`, {
        exitPrice,
        payout,
        profit,
      });
    },
    onSuccess: () => {
      toast({
        title: "Trade Closed",
        description: "Your trade has been closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/positions/user/1'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close trade",
        variant: "destructive",
      });
    },
  });

  const handleCloseTrade = (trade: Trade) => {
    closeTradeMutation.mutate({
      tradeId: trade.id,
      exitPrice: "1.08500", // Would use current market price
    });
  };

  const getMarketIcon = (symbol: string) => {
    if (symbol.includes("EUR")) return "€";
    if (symbol.includes("GBP")) return "£";
    if (symbol.includes("BTC")) return "₿";
    return "$";
  };

  const getIconColors = (symbol: string) => {
    if (symbol.includes("EUR")) return "from-blue-500 to-purple-600";
    if (symbol.includes("GBP")) return "from-yellow-500 to-orange-600";
    if (symbol.includes("BTC")) return "from-orange-500 to-red-600";
    return "from-green-500 to-blue-600";
  };

  const calculateTimeLeft = (createdAt: Date | null, duration: number, durationType: string) => {
    if (!createdAt) return "0m 0s";
    
    const now = new Date();
    const endTime = new Date(createdAt);
    
    switch (durationType) {
      case "minutes":
        endTime.setMinutes(endTime.getMinutes() + duration);
        break;
      case "hours":
        endTime.setHours(endTime.getHours() + duration);
        break;
      case "days":
        endTime.setDate(endTime.getDate() + duration);
        break;
    }
    
    const timeLeft = endTime.getTime() - now.getTime();
    if (timeLeft <= 0) return "Expired";
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="h-80 bg-[hsl(var(--trading-slate))] border-t border-[hsl(var(--trading-gray))]">
      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--trading-gray))]">
        <button className="px-6 py-3 border-b-2 border-[hsl(var(--info-blue))] text-[hsl(var(--info-blue))] font-medium">
          Open Positions ({positions.length})
        </button>
        <button className="px-6 py-3 text-gray-400 hover:text-white transition-colors">
          Orders
        </button>
        <button className="px-6 py-3 text-gray-400 hover:text-white transition-colors">
          History
        </button>
        <button className="px-6 py-3 text-gray-400 hover:text-white transition-colors">
          Statistics
        </button>
      </div>

      {/* Positions Table */}
      <div className="p-6 overflow-auto">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-chart-bar text-2xl mb-2"></i>
            <div>No active positions</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-[hsl(var(--trading-gray))]">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Stake</th>
                  <th className="text-right py-2">Entry Price</th>
                  <th className="text-right py-2">Current P&L</th>
                  <th className="text-right py-2">Duration</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--trading-gray))]">
                {positions.map((position) => (
                  <tr key={position.id} className="hover:bg-[hsl(var(--trading-gray))]/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 bg-gradient-to-r ${getIconColors(position.symbol)} rounded-full flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">
                            {getMarketIcon(position.symbol)}
                          </span>
                        </div>
                        <span className="font-medium text-white">{position.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        position.tradeType === "CALL"
                          ? "bg-[hsl(var(--profit-green))]/20 text-[hsl(var(--profit-green))]"
                          : "bg-[hsl(var(--loss-red))]/20 text-[hsl(var(--loss-red))]"
                      }`}>
                        {position.tradeType}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white">${position.stake}</td>
                    <td className="py-3 text-right text-white">{position.entryPrice}</td>
                    <td className="py-3 text-right">
                      <span className="text-[hsl(var(--profit-green))]">
                        +${((parseFloat(position.stake) * 1.85) - parseFloat(position.stake)).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[hsl(var(--warning-amber))]">
                      {calculateTimeLeft(position.createdAt, position.duration, position.durationType)}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        onClick={() => handleCloseTrade(position)}
                        disabled={closeTradeMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-[hsl(var(--loss-red))] hover:bg-[hsl(var(--loss-red))]/20"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
