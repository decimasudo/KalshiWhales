import { BettingActivity } from '../types';
import { TrendingUp, TrendingDown, Terminal, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFeedProps {
  activities: BettingActivity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-[#050A0A] border border-neutral-800 h-[600px] flex flex-col relative overflow-hidden group">
      {/* Scanline Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />

      {/* Header */}
      <div className="p-3 border-b border-neutral-800 bg-[#020404] sticky top-0 z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-accent-500" />
          <span className="text-[10px] font-mono text-accent-500 uppercase tracking-widest">Signal_Intercept_Feed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
          </span>
          <span className="text-[9px] font-mono text-accent-500">LIVE</span>
        </div>
      </div>
      
      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 relative z-10">
        <AnimatePresence initial={false} mode='popLayout'>
          {activities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4"
            >
              <Wifi className="w-8 h-8 animate-pulse" />
              <p className="font-mono text-xs uppercase tracking-widest">Scanning Network...</p>
            </motion.div>
          ) : (
            activities.map((activity) => {
              const isBuy = activity.side === 'BUY';
              // Format time to show seconds for "live" feel
              const timeString = new Date(activity.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
              
              return (
                <motion.div
                  layout
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, backgroundColor: "rgba(0, 224, 208, 0.1)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0, 0, 0, 0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 border-l-2 border-transparent hover:border-accent-500 hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-mono text-neutral-500">[{timeString}]</span>
                    <span className={`text-[9px] font-mono font-bold px-1 rounded ${isBuy ? 'bg-semantic-success/10 text-semantic-success' : 'bg-semantic-danger/10 text-semantic-danger'}`}>
                      {activity.side}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <div className={isBuy ? 'text-semantic-success' : 'text-semantic-danger'}>
                      {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </div>
                    <span className="text-xs text-white font-medium leading-tight line-clamp-1">
                      {activity.outcome || 'Unknown Market'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 border-t border-dashed border-neutral-800 pt-2">
                    <code className="text-[9px] text-neutral-500">{activity.wallet_address.substring(0, 6)}...{activity.wallet_address.slice(-4)}</code>
                    <span className="text-xs font-mono text-accent-500">
                      ${activity.amount?.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}