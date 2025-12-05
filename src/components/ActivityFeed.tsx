import { BettingActivity } from '../types';
import { TrendingUp, TrendingDown, Activity as ActivityIcon, Terminal } from 'lucide-react';

interface ActivityFeedProps {
  activities: BettingActivity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-[#050A0A] border border-neutral-800 p-8 text-center">
        <ActivityIcon className="h-8 w-8 text-neutral-700 mx-auto mb-4" />
        <p className="text-neutral-500 font-mono text-xs uppercase">No signal data detected</p>
      </div>
    );
  }

  return (
    <div className="bg-[#050A0A] border border-neutral-800 max-h-[600px] overflow-y-auto custom-scrollbar">
      <div className="p-3 border-b border-neutral-800 bg-[#020404] sticky top-0 z-10 flex items-center gap-2">
        <Terminal className="w-3 h-3 text-accent-500" />
        <span className="text-[10px] font-mono text-accent-500 uppercase tracking-widest">Live_Signal_Feed</span>
      </div>
      
      <div className="divide-y divide-neutral-800">
        {activities.map((activity) => {
          const isBuy = activity.side === 'BUY';
          const shortAddress = `${activity.wallet_address.substring(0, 6)}...${activity.wallet_address.substring(activity.wallet_address.length - 4)}`;
          
          return (
            <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors group">
              <div className="flex items-start space-x-3">
                <div className={`mt-1 ${isBuy ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-mono font-bold ${isBuy ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                      {activity.side}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-600">
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-white mb-2 font-medium leading-tight">
                    {activity.outcome || 'Unknown Position'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <code className="text-[9px] text-neutral-500 bg-neutral-900 px-1 py-0.5 rounded">{shortAddress}</code>
                    {activity.amount && (
                      <span className="text-xs font-mono text-accent-500">
                        ${activity.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}