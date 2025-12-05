import { useState } from 'react';
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
  const navigate = useNavigate();
  
  // Debug: Log the trader data and Link props
  console.log('TraderCard rendering for:', trader.trader_name, 'Wallet:', trader.trader_wallet);
  const profilePath = `/profile/${trader.trader_wallet}`;
  console.log('TraderCard - Generated profile path:', profilePath);
  
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
    <div className="card-trader bg-navy-accent-dark rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-5 border border-border-moderate">
      {/* Header with Avatar and Name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={trader.profile_image_url}
              alt={trader.trader_name}
              className="w-12 h-12 rounded-full object-cover bg-gradient-to-br from-indigo-100 to-purple-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${trader.trader_name}&background=6366f1&color=fff`;
              }}
            />
            {trader.win_rate && trader.win_rate > 70 && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Award className="h-3 w-3 text-yellow-800" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-h3 text-text-primary font-semibold">{trader.trader_name}</h3>
            <p className="text-small text-text-tertiary truncate max-w-[180px]">{trader.trader_wallet}</p>
          </div>
        </div>
        
        <Link
          to={`/profile/${trader.trader_wallet}`}
          className="px-3 py-1.5 rounded-lg font-medium text-sm bg-cyan-electric text-text-primary hover:bg-cyan-electric/80 transition-colors flex items-center space-x-1"
          onClick={(event) => {
            console.log('Link clicked for trader:', trader.trader_name, 'navigating to:', `/profile/${trader.trader_wallet}`);
            console.log('Event target:', event.currentTarget.getAttribute('href'));
          }}
        >
          <span>View Full Profile</span>
        </Link>
      </div>

      {/* Description */}
      {trader.description && (
        <p className="text-body text-text-tertiary mb-4 line-clamp-2">{trader.description}</p>
      )}

      {/* Performance Metrics */}
      <div className="space-y-3">
        {/* Total Profit */}
        <div className="flex items-center justify-between bg-navy-accent-dark rounded-lg p-3 border border-border-subtle">
          <span className="text-body text-text-tertiary">Total Profit</span>
          <span className="text-h3 font-bold text-semantic-success">
            +{formatProfit(trader.total_profit)}
          </span>
        </div>

        {/* Past Month Profit */}
        <div className="flex items-center justify-between bg-navy-accent-dark rounded-lg p-3 border border-border-subtle">
          <span className="text-body text-text-tertiary">Past Month</span>
          <div className="flex items-center space-x-1">
            {isProfitPositive ? (
              <>
                <TrendingUp className="h-4 w-4 text-semantic-success" />
                <span className="text-h3 font-bold text-semantic-success">
                  +{formatProfit(trader.past_month_profit)}
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-h3 font-bold text-red-600">
                  {formatProfit(trader.past_month_profit)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-cyan-electric" />
            <div>
              <p className="text-small text-text-tertiary">Win Rate</p>
              <p className="text-body font-semibold text-text-primary">{trader.win_rate}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-small text-text-tertiary">Trades</p>
              <p className="text-body font-semibold text-text-primary">{trader.total_trades}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}