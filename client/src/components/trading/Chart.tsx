import { type Market } from "@shared/schema";

interface ChartProps {
  market: Market | null;
}

export default function Chart({ market }: ChartProps) {
  if (!market) {
    return (
      <div className="flex-1 bg-[hsl(var(--trading-dark))] p-6">
        <div className="w-full h-full bg-[hsl(var(--trading-slate))] rounded-lg border border-[hsl(var(--trading-gray))] flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-chart-line text-4xl text-gray-500 mb-4"></i>
            <p className="text-xl font-semibold text-gray-400">Select a Market</p>
            <p className="text-sm text-gray-500 mt-2">Choose a market from the sidebar to view the chart</p>
          </div>
        </div>
      </div>
    );
  }

  const timeframes = ["1m", "5m", "15m", "1h", "1d"];
  const [activeTimeframe, setActiveTimeframe] = useState("5m");

  return (
    <div className="flex-1 p-6">
      <div className="bg-[hsl(var(--trading-slate))] rounded-lg border border-[hsl(var(--trading-gray))] h-full flex flex-col">
        {/* Chart Header */}
        <div className="p-4 border-b border-[hsl(var(--trading-gray))] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold text-white">{market.symbol}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">{market.currentPrice}</span>
              <span className={`text-sm flex items-center ${
                parseFloat(market.change || "0") >= 0 
                  ? "text-[hsl(var(--profit-green))]" 
                  : "text-[hsl(var(--loss-red))]"
              }`}>
                <i className={`fas fa-arrow-${parseFloat(market.change || "0") >= 0 ? "up" : "down"} mr-1`}></i>
                {parseFloat(market.change || "0") >= 0 ? "+" : ""}{market.change} ({market.changePercent}%)
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-white">
            <div>
              <span className="text-gray-400">High:</span>
              <span className="ml-2 font-medium">{market.high}</span>
            </div>
            <div>
              <span className="text-gray-400">Low:</span>
              <span className="ml-2 font-medium">{market.low}</span>
            </div>
            <div>
              <span className="text-gray-400">Volume:</span>
              <span className="ml-2 font-medium">{market.volume}</span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[hsl(var(--trading-gray))] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-line text-2xl text-gray-400"></i>
            </div>
            <div className="text-gray-400 mb-2">Real-Time Price Chart</div>
            <div className="text-sm text-gray-500 mb-4">Connected to Deriv WebSocket API</div>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-[hsl(var(--profit-green))] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[hsl(var(--profit-green))] rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
              <div className="w-2 h-2 bg-[hsl(var(--profit-green))] rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">App ID: 76613</p>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="p-4 border-t border-[hsl(var(--trading-gray))]">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-400">Spread:</span>
                <span className="ml-2 text-white">0.8 pips</span>
              </div>
              <div>
                <span className="text-gray-400">Volatility:</span>
                <span className="ml-2 text-white">12.4%</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setActiveTimeframe(timeframe)}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTimeframe === timeframe
                      ? "bg-[hsl(var(--info-blue))] text-white"
                      : "bg-[hsl(var(--trading-gray))] text-white hover:bg-gray-600"
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useState<T>(initialValue: T): [T, (value: T) => void] {
  // Simple mock implementation for demo
  return [initialValue as T, () => {}];
}
