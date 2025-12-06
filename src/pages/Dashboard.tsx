import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrackedWallet, BettingActivity, RecommendedTrader } from '../types';
import WalletCard from '../components/WalletCard';
import AddWalletForm from '../components/AddWalletForm';
import ActivityFeed from '../components/ActivityFeed';
import RecommendedTraderCard from '../components/RecommendedTraderCard';
import { 
  Activity, Wallet, Plus, LogOut, User, Send, Shield, Lock, 
  Terminal, Globe, Database
} from 'lucide-react';

type TabType = 'wallets' | 'recommended';

// --- PROCEDURAL GENERATION ENGINE ---

const NAME_PREFIXES = ['Alpha', 'Quant', 'Deep', 'Yield', 'Macro', 'Delta', 'Vega', 'Giga', 'Based', 'Smart', 'Net', 'Core'];
const NAME_SUFFIXES = ['Whale', 'Hunter', 'Trader', 'Fund', 'Capital', 'Mind', 'Searcher', 'God', 'Lord', 'Degen', 'Arb', 'Ops'];

const MOCK_OUTCOMES = [
  "Bitcoin > $100k by Dec", "Fed Rate Cut 50bps", "SpaceX Launch Success", 
  "Ethereum ETF Approval", "GDP Growth > 2%", "Oil < $70 bbl", 
  "NVIDIA Earnings Beat", "Solana ATH Q4", "US Election: DEM Win", 
  "Gold > $3000", "CPI < 2.5%", "Tesla Delivery Miss"
];

// Generate a realistic looking wallet address
const randomWallet = () => `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;

// Generate a consistent set of traders
const generateMockTraders = (count: number): RecommendedTrader[] => {
  return Array.from({ length: count }).map((_, i) => {
    const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    const name = `${prefix}_${suffix}`;
    
    // Logic: Higher profit usually means more trades or higher win rate
    const baseWinRate = 55 + Math.random() * 35; // 55-90%
    const totalTrades = 50 + Math.floor(Math.random() * 2000);
    const profitPerTrade = 500 + Math.random() * 5000;
    const totalProfit = Math.floor(totalTrades * profitPerTrade * (baseWinRate / 100) * 0.8); // Simple calc

    return {
      id: `mock-${i}`,
      trader_name: name,
      trader_wallet: randomWallet(),
      profile_image_url: '', // UI handles fallback
      total_profit: totalProfit,
      past_month_profit: Math.floor(totalProfit * (0.05 + Math.random() * 0.15)), // 5-20% of total
      win_rate: parseFloat(baseWinRate.toFixed(1)),
      total_trades: totalTrades,
      description: `Algorithmic strategy focused on ${['macro events', 'tech earnings', 'crypto volatility', 'political outcomes'][Math.floor(Math.random() * 4)]}.`,
      display_order: i,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }).sort((a, b) => b.total_profit - a.total_profit); // Sort by profit for leaderboard
};

// Generate a single activity, potentially linked to a known trader
const generateMockActivity = (knownTraders: RecommendedTrader[]): BettingActivity => {
  // 30% chance the activity comes from a "High Value Target"
  const useKnownTrader = Math.random() < 0.3 && knownTraders.length > 0;
  const trader = useKnownTrader ? knownTraders[Math.floor(Math.random() * knownTraders.length)] : null;

  return {
    id: Math.random().toString(36).substr(2, 9),
    wallet_address: trader ? trader.trader_wallet : randomWallet(),
    market_id: 'mock-market',
    event_type: 'TRADE',
    side: Math.random() > 0.5 ? 'BUY' : 'SELL',
    amount: Math.floor(Math.random() * 25000) + 500,
    price: parseFloat(Math.random().toFixed(2)),
    outcome: MOCK_OUTCOMES[Math.floor(Math.random() * MOCK_OUTCOMES.length)],
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
};

// Enigma Design System Component
const CoordinateLabel = ({ x, y }: { x: number; y: number }) => (
  <div className="absolute text-[9px] font-mono text-accent-500/40 tracking-widest pointer-events-none select-none">
    X:{x} Y:{y}
  </div>
);

export default function Dashboard() {
  const { user, signOut, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(isGuest ? 'recommended' : 'wallets');
  
  // State
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [activities, setActivities] = useState<BettingActivity[]>([]);
  const [recommendedTraders, setRecommendedTraders] = useState<RecommendedTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Refs for simulation stability
  const tradersRef = useRef<RecommendedTrader[]>([]);

  useEffect(() => {
    // 1. Initialize Data
    const initData = async () => {
      // Fetch user wallets (if logged in)
      if (user) {
        await fetchWallets();
      }

      // Fetch or Generate Traders
      try {
        const { data } = await supabase
          .from('recommended_traders')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (data && data.length > 0) {
          setRecommendedTraders(data);
          tradersRef.current = data;
        } else {
          // Fallback: Generate Procedural Mock Data
          const mocks = generateMockTraders(6);
          setRecommendedTraders(mocks);
          tradersRef.current = mocks;
        }
      } catch {
        const mocks = generateMockTraders(6);
        setRecommendedTraders(mocks);
        tradersRef.current = mocks;
      }

      // Initial Activity Fill
      const initialActivities = Array.from({ length: 8 }).map(() => 
        generateMockActivity(tradersRef.current)
      );
      setActivities(initialActivities);
      
      setLoading(false);
    };

    initData();

    // 2. Start Live Feed Simulation (Only updates Activity Feed)
    const activityInterval = setInterval(() => {
      // Pass the current stable list of traders to the generator
      const newActivity = generateMockActivity(tradersRef.current);
      setActivities(prev => [newActivity, ...prev].slice(0, 20));
    }, 3500); // New trade every 3.5s

    // 3. Real-time subscriptions (Supabase)
    const walletsSubscription = supabase
      .channel('tracked_wallets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracked_wallets' }, () => fetchWallets())
      .subscribe();

    return () => {
      clearInterval(activityInterval);
      walletsSubscription.unsubscribe();
    };
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tracked_wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setWallets(data);
  };

  const handleAddWallet = async (walletAddress: string, label?: string) => {
    if (isGuest) return;
    if (!user) return;

    const { error } = await supabase
      .from('tracked_wallets')
      .insert([{
        user_id: user.id,
        wallet_address: walletAddress,
        label: label,
        chain_id: 137
      }]);

    if (error) {
      console.error('Error adding wallet:', error);
      alert('Failed to add target.');
    } else {
      setShowAddForm(false);
      fetchWallets();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('CONFIRM: Terminate tracking?')) return;
    await supabase.from('tracked_wallets').delete().eq('id', id);
    fetchWallets();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000202] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-accent-500 font-mono text-xs animate-pulse tracking-widest">INITIALIZING_SYSTEM...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000202] text-text-primary font-body pb-12 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,224,208,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,224,208,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none fixed" />

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#000202]/90 backdrop-blur-md border-b border-neutral-800 h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-500/10 flex items-center justify-center rounded-sm border border-accent-500/20">
              <Terminal className="w-4 h-4 text-accent-500" />
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight text-white">
              KALSHI<span className="text-accent-500">WHALES</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {isGuest ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-sm">
                <Shield className="w-3 h-3 text-neutral-500" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase">GUEST_MODE</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-neutral-500 border-r border-neutral-800 pr-4">
                <Globe className="w-3 h-3" />
                <span>CONNECTED: {user?.email}</span>
              </div>
            )}
            
            <button onClick={handleSignOut} className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase hidden sm:inline">Disconnect</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        <CoordinateLabel x={10} y={120} />
        
        {/* --- TELEGRAM BANNER (Integration) --- */}
        <div className="relative overflow-hidden bg-accent-500/5 border border-accent-500/20 p-6 mb-8 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
            <div className="p-3 bg-[#000202] border border-accent-500/30 text-accent-500 shadow-[0_0_15px_rgba(0,224,208,0.2)]">
              <Send className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Telegram Uplink Active
                <span className="w-2 h-2 bg-semantic-success rounded-full animate-pulse" />
              </h3>
              <p className="text-sm font-mono text-neutral-400 mt-1 max-w-2xl">
                Initialize real-time signal intercepts directly to your device. Connect with the official bot.
              </p>
            </div>
            <a 
              href="https://t.me/Kalshiwhales_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-accent-500 text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-accent-400 transition-all flex items-center gap-2"
            >
              <span>@Kalshiwhales_bot</span>
              <Activity className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* --- GUEST RESTRICTION NOTICE --- */}
        {isGuest && (
          <div className="mb-8 p-4 border-l-2 border-semantic-warning bg-neutral-900/50 flex items-center gap-3">
            <Lock className="w-5 h-5 text-semantic-warning" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Guest Access Restrictions</h3>
              <p className="text-xs text-neutral-400">
                Personal wallet tracking is disabled. You are viewing the public alpha feed. 
                <button onClick={handleSignOut} className="text-accent-500 hover:underline ml-1">Login to upgrade.</button>
              </p>
            </div>
          </div>
        )}

        {/* --- NAVIGATION TABS --- */}
        <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto">
          {!isGuest && (
            <button
              onClick={() => setActiveTab('wallets')}
              className={`px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'wallets' 
                  ? 'border-accent-500 text-accent-500 bg-accent-500/5' 
                  : 'border-transparent text-neutral-500 hover:text-white'
              }`}
            >
              My Targets [{wallets.length}]
            </button>
          )}
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'recommended' 
                ? 'border-accent-500 text-accent-500 bg-accent-500/5' 
                : 'border-transparent text-neutral-500 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-2">
              High Value Targets [{recommendedTraders.length}]
              <Database className="w-3 h-3 text-neutral-600" />
            </div>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: MAIN CONTENT */}
          <div className="lg:col-span-2">
            
            {/* 1. MY WALLETS TAB */}
            {activeTab === 'wallets' && !isGuest && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-display font-bold text-white uppercase">Active Surveillance</h2>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-mono uppercase hover:border-accent-500 hover:text-accent-500 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Target</span>
                  </button>
                </div>

                {wallets.length === 0 ? (
                  <div className="border border-dashed border-neutral-800 p-12 text-center bg-[#050A0A]">
                    <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                      <Wallet className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 font-mono text-xs uppercase mb-4">No targets initialized</p>
                    <button onClick={() => setShowAddForm(true)} className="text-accent-500 hover:underline text-xs font-mono uppercase">
                      + Initialize Tracker
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {wallets.map((wallet) => (
                      <WalletCard key={wallet.id} wallet={wallet} onDelete={handleDeleteWallet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. RECOMMENDED TAB */}
            {activeTab === 'recommended' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-display font-bold text-white uppercase">Whale Leaderboard</h2>
                  <div className="text-[10px] font-mono text-neutral-500">DATA_SOURCE: SIM_NET</div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendedTraders.map((trader) => (
                    <RecommendedTraderCard key={trader.id} trader={trader} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE FEED */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>

      {/* Add Wallet Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            <AddWalletForm onSubmit={handleAddWallet} onCancel={() => setShowAddForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}