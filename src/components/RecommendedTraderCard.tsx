import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

interface RecommendedTraderCardProps {
  trader: {
    id: string;
    trader_wallet: string;
    trader_name: string;
    profile_image_url: string;
    total_profit: number;
    past_month_profit: number;
    win_rate: number;
    total_trades: number;
    description: string;
  };
}

export default function RecommendedTraderCard({ trader }: RecommendedTraderCardProps) {
  const formatProfit = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `$${(absAmount / 1000000).toFixed(2)}M`;
    } else if (absAmount >= 1000) {
      return `$${(absAmount / 1000).toFixed(1)}k`;
    }
    return `$${absAmount.toFixed(2)}`;
  };

  const isProfitPositive = trader.past_month_profit >= 0;

  return (
    <div className="bg-[#050A0A] border border-neutral-800 p-5 hover:border-accent-500/40 transition-all group relative">
      {/* Target Marker */}
      <div className="absolute top-2 right-2 text-[8px] font-mono text-neutral-600 group-hover:text-accent-500 transition-colors">
        ID: {trader.id.slice(0,4)}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-mono font-bold text-neutral-400">
              {trader.trader_name.slice(0,2).toUpperCase()}
            </div>
            {trader.win_rate && trader.win_rate > 70 && (
              <div className="absolute -top-1 -right-1 bg-accent-500 text-black p-0.5 rounded-sm">
                <Award className="h-2 w-2" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">{trader.trader_name}</h3>
            <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px]">{trader.trader_wallet}</p>
          </div>
        </div>
        
        <Link
          to={`/profile/${trader.trader_wallet}`}
          className="px-3 py-1 bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-400 hover:border-accent-500 hover:text-accent-500 transition-all uppercase"
        >
          Analyze
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-neutral-900/50 p-2 border border-neutral-800/50">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">Total Net</span>
          <span className="text-sm font-mono font-bold text-accent-500">
            +{formatProfit(trader.total_profit)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-neutral-900/50 p-2 border border-neutral-800/50">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">30D Change</span>
          <div className="flex items-center space-x-1">
            {isProfitPositive ? (
              <>
                <TrendingUp className="h-3 w-3 text-semantic-success" />
                <span className="text-sm font-mono font-bold text-semantic-success">
                  +{formatProfit(trader.past_month_profit)}
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-semantic-danger" />
                <span className="text-sm font-mono font-bold text-semantic-danger">
                  {formatProfit(trader.past_month_profit)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="flex items-center space-x-2">
            <Target className="h-3 w-3 text-neutral-600" />
            <div>
              <p className="text-[9px] text-neutral-600 uppercase font-mono">Win Rate</p>
              <p className="text-xs font-bold text-white font-mono">{trader.win_rate}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-3 w-3 text-neutral-600" />
            <div>
              <p className="text-[9px] text-neutral-600 uppercase font-mono">Executions</p>
              <p className="text-xs font-bold text-white font-mono">{trader.total_trades}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}