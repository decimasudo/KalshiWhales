import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddWalletForm from '../components/AddWalletForm';
import { 
  ArrowLeft, Copy, CheckCircle, TrendingUp, TrendingDown, 
  DollarSign, Target, Activity, Calendar, BarChart3, Award, Plus 
} from 'lucide-react';

// Using local interfaces based on the original file
interface TraderData {
  id: string;
  trader_wallet: string;
  trader_name: string;
  profile_image_url: string;
  total_profit: number;
  past_month_profit: number;
  win_rate: number;
  total_trades: number;
  description: string;
}

interface TopTrade {
  id: string;
  trader_wallet: string;
  market_name: string;
  profit: number;
  position: 'BUY' | 'SELL';
  amount: number;
  trade_date: string;
}

interface PnLMetrics {
  best_single_trade: number;
  worst_single_trade: number;
  avg_position_size: number;
  win_rate_percentage: number;
  largest_position: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

export default function TraderProfile() {
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [topTrades, setTopTrades] = useState<TopTrade[]>([]);
  const [pnlMetrics, setPnlMetrics] = useState<PnLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      Promise.all([
        fetchTraderData(),
        fetchTopTrades(),
        fetchPnLMetrics()
      ]).finally(() => setLoading(false));
    }
  }, [walletAddress]);

  const fetchTraderData = async () => {
    const { data } = await supabase
      .from('recommended_traders')
      .select('*')
      .eq('trader_wallet', walletAddress)
      .single();
    if (data) setTrader(data);
  };

  const fetchTopTrades = async () => {
    const { data } = await supabase
      .from('trader_top_trades')
      .select('*')
      .eq('trader_wallet', walletAddress)
      .order('profit', { ascending: false })
      .limit(5);
    setTopTrades(data || []);
  };

  const fetchPnLMetrics = async () => {
    // Simplified logic similar to original but using the fetched trades for mock calc
    // In real app, this would query backend. Keeping frontend logic for stability.
    const { data: trades } = await supabase
      .from('trader_top_trades')
      .select('*')
      .eq('trader_wallet', walletAddress);
      
    if (trades && trades.length > 0) {
      setPnlMetrics({
        best_single_trade: Math.max(...trades.map(t => t.profit)),
        worst_single_trade: Math.min(...trades.map(t => t.profit)),
        avg_position_size: trades.reduce((sum, t) => sum + t.amount, 0) / trades.length,
        win_rate_percentage: Math.round((trades.filter(t => t.profit > 0).length / trades.length) * 100),
        largest_position: Math.max(...trades.map(t => t.amount)),
        risk_level: 'Medium'
      });
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleAddToWallets = async (walletAddr: string, label?: string) => {
    if (!user) return;
    await supabase.from('tracked_wallets').insert([{
      user_id: user.id,
      wallet_address: walletAddr,
      label: label || trader?.trader_name,
      chain_id: 137
    }]);
    setShowAddModal(false);
    alert('Target acquired.');
  };

  const formatMoney = (val: number) => `$${Math.abs(val).toLocaleString()}`;

  if (loading) return <div className="min-h-screen bg-[#000202] flex items-center justify-center text-accent-500 font-mono text-xs">DECRYPTING_PROFILE...</div>;
  if (!trader) return <div className="min-h-screen bg-[#000202] flex items-center justify-center text-neutral-500 font-mono">TARGET_NOT_FOUND</div>;

  return (
    <div className="min-h-screen bg-[#000202] text-text-primary font-body pb-12">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#050A0A] py-4 px-6">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-xs font-mono text-neutral-400 hover:text-white uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Command
          </button>
          <div className="text-sm font-display font-bold text-white">PROFILE_ANALYSIS</div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-8">
        {/* Identity Card */}
        <div className="bg-[#050A0A] border border-neutral-800 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-bl-full" />
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-2xl font-display font-bold text-white">
                {trader.trader_name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">{trader.trader_name}</h1>
                <div className="flex items-center gap-3">
                  <code className="bg-neutral-900 px-3 py-1 text-xs font-mono text-accent-500 rounded-sm border border-neutral-800">
                    {trader.trader_wallet}
                  </code>
                  <button onClick={copyAddress} className="text-neutral-500 hover:text-white">
                    {copySuccess ? <CheckCircle className="w-4 h-4 text-semantic-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {!isGuest && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-accent-500 text-black font-bold font-mono text-xs uppercase hover:bg-accent-400 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Track Target
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Net', value: formatMoney(trader.total_profit), icon: DollarSign, color: 'text-semantic-success' },
            { label: 'Win Rate', value: `${trader.win_rate}%`, icon: Target, color: 'text-accent-500' },
            { label: 'Executions', value: trader.total_trades, icon: Activity, color: 'text-blue-400' },
            { label: '30D Change', value: formatMoney(trader.past_month_profit), icon: TrendingUp, color: trader.past_month_profit >= 0 ? 'text-semantic-success' : 'text-semantic-danger' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#050A0A] border border-neutral-800 p-6 hover:border-accent-500/20 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top Trades */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-display font-bold text-white mb-4 border-b border-neutral-800 pb-2">
              CONVICTION_PLAYS
            </h3>
            {topTrades.map((trade, i) => (
              <div key={trade.id} className="bg-[#050A0A] border border-neutral-800 p-4 flex items-center justify-between hover:border-neutral-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-neutral-600">#{i+1}</div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1">{trade.market_name}</div>
                    <div className="flex gap-4 text-[10px] font-mono text-neutral-500">
                      <span>{trade.position}</span>
                      <span>{new Date(trade.trade_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-bold ${trade.profit >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  {trade.profit >= 0 ? '+' : ''}{formatMoney(trade.profit)}
                </div>
              </div>
            ))}
          </div>

          {/* Risk Metrics */}
          <div className="lg:col-span-1">
            <div className="bg-[#050A0A] border border-neutral-800 p-6 sticky top-24">
              <h3 className="text-sm font-display font-bold text-white mb-6 border-b border-neutral-800 pb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-500" />
                RISK_PROFILE
              </h3>
              
              {pnlMetrics && (
                <div className="space-y-6 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Best Entry</span>
                    <span className="text-semantic-success">+{formatMoney(pnlMetrics.best_single_trade)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Worst Drawdown</span>
                    <span className="text-semantic-danger">{formatMoney(pnlMetrics.worst_single_trade)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Avg Size</span>
                    <span className="text-white">{formatMoney(pnlMetrics.avg_position_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Risk Rating</span>
                    <span className="px-2 py-0.5 bg-neutral-900 text-white rounded border border-neutral-800">
                      {pnlMetrics.risk_level.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <AddWalletForm 
            onSubmit={async (addr, label) => handleAddToWallets(addr, label)} 
            onCancel={() => setShowAddModal(false)} 
          />
        </div>
      )}
    </div>
  );
}