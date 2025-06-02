interface HeaderProps {
  user: any;
  isConnected: boolean;
}

export default function Header({ user, isConnected }: HeaderProps) {
  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-[hsl(var(--trading-slate))] border-b border-[hsl(var(--trading-gray))] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isConnected ? "bg-[hsl(var(--profit-green))]" : "bg-[hsl(var(--loss-red))]"
          }`}></div>
          <span className="text-sm font-medium text-white">
            {isConnected ? "Market Open" : "Connecting..."}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          Last Update: <span>{formatTime()} GMT</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right">
          <p className="text-sm text-gray-400">Available Balance</p>
          <p className="text-xl font-bold text-white">
            ${user?.balance || "10,247.50"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Today's P&L</p>
          <p className="text-lg font-semibold text-[hsl(var(--profit-green))]">
            +$347.20
          </p>
        </div>
        <button className="bg-[hsl(var(--info-blue))] hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition-colors text-white">
          <i className="fas fa-plus mr-2"></i>Deposit
        </button>
      </div>
    </div>
  );
}
