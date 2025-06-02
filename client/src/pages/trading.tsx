import { useQuery } from "@tanstack/react-query";
import { useDerivAPI } from "@/hooks/use-deriv-api";
import Sidebar from "@/components/trading/Sidebar";
import Header from "@/components/trading/Header";
import TradingPanel from "@/components/trading/TradingPanel";
import Chart from "@/components/trading/Chart";
import PositionsTable from "@/components/trading/PositionsTable";

export default function TradingPage() {
  const { markets, isConnected, selectedMarket, setSelectedMarket } = useDerivAPI();
  
  const { data: user } = useQuery({
    queryKey: ['/api/user/demo'],
  });

  const { data: positions } = useQuery({
    queryKey: ['/api/positions/user/1'],
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--trading-dark))] text-white">
      <Sidebar 
        markets={markets || []}
        selectedMarket={selectedMarket}
        onSelectMarket={setSelectedMarket}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          isConnected={isConnected}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Chart market={selectedMarket} />
          </div>
          
          <TradingPanel 
            market={selectedMarket}
            userBalance={user?.balance || "0"}
          />
        </div>

        <PositionsTable 
          positions={positions || []}
        />
      </div>
    </div>
  );
}
