import { type Market } from "@shared/schema";

interface SidebarProps {
  markets: Market[];
  selectedMarket: Market | null;
  onSelectMarket: (market: Market) => void;
}

export default function Sidebar({ markets, selectedMarket, onSelectMarket }: SidebarProps) {
  const categories = ["forex", "crypto", "indices"];
  const [activeCategory, setActiveCategory] = useState("forex");

  const filteredMarkets = markets.filter(market => market.category === activeCategory);

  const getMarketIcon = (symbol: string) => {
    if (symbol.includes("EUR")) return "€";
    if (symbol.includes("GBP")) return "£";
    if (symbol.includes("BTC")) return "₿";
    if (symbol.includes("USD")) return "$";
    return symbol.substring(0, 2);
  };

  const getIconColors = (symbol: string) => {
    if (symbol.includes("EUR")) return "from-blue-500 to-purple-600";
    if (symbol.includes("GBP")) return "from-yellow-500 to-orange-600";
    if (symbol.includes("BTC")) return "from-orange-500 to-red-600";
    return "from-green-500 to-blue-600";
  };

  return (
    <aside className="w-80 bg-[hsl(var(--trading-slate))] border-r border-[hsl(var(--trading-gray))] flex flex-col">
      <div className="p-6 border-b border-[hsl(var(--trading-gray))]">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-[hsl(var(--profit-green))] to-[hsl(var(--info-blue))] rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Deriv Binary</h1>
            <p className="text-xs text-gray-400">Trading Platform</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Markets</h2>
          <button className="text-gray-400 hover:text-gray-200">
            <i className="fas fa-search"></i>
          </button>
        </div>
        
        <div className="flex space-x-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-[hsl(var(--info-blue))] text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredMarkets.map((market) => (
          <div
            key={market.symbol}
            onClick={() => onSelectMarket(market)}
            className={`p-3 border-b border-[hsl(var(--trading-gray))] hover:bg-[hsl(var(--trading-gray))] cursor-pointer transition-colors ${
              selectedMarket?.symbol === market.symbol ? "bg-[hsl(var(--trading-gray))]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${getIconColors(market.symbol)} rounded-full flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">
                    {getMarketIcon(market.symbol)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-white">{market.symbol}</div>
                  <div className="text-xs text-gray-400">{market.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-white">{market.currentPrice}</div>
                <div className={`text-xs flex items-center ${
                  parseFloat(market.change || "0") >= 0 ? "text-[hsl(var(--profit-green))]" : "text-[hsl(var(--loss-red))]"
                }`}>
                  <i className={`fas fa-caret-${parseFloat(market.change || "0") >= 0 ? "up" : "down"} mr-1`}></i>
                  {parseFloat(market.change || "0") >= 0 ? "+" : ""}{market.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[hsl(var(--trading-gray))]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[hsl(var(--info-blue))] to-[hsl(var(--profit-green))] rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">John Trader</p>
            <p className="text-xs text-gray-400">ID: 76613</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function useState<T>(initialValue: T): [T, (value: T) => void] {
  // Simple mock implementation for demo
  return [initialValue as T, () => {}];
}
